import assert from "node:assert/strict";
import { z } from "zod";

import type {
  NormalizedRoute,
  RouteHandlerContext,
  RouteOperation,
} from "../routing/mod.ts";
import {
  composeProjectSecurity,
  createMemoryRateLimiter,
  createSecurityRouter,
  defineSecurity,
  redactSecurityData,
  type RouteSecurity,
  SecurityConfigurationError,
  type SecurityDiagnostic,
  type SecurityOptions,
} from "./mod.ts";

const problemSchema = z.strictObject({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  instance: z.string(),
});
const okSchema = z.strictObject({ ok: z.boolean() });

type Handler = (
  context: RouteHandlerContext<unknown, RouteSecurity>,
) => Response | Promise<Response>;

function route(
  security: RouteSecurity,
  handler: Handler,
  responses: Readonly<Record<number, z.ZodType | null>> = { 200: okSchema },
  overrides: Partial<Pick<NormalizedRoute, "method" | "path" | "source">> = {},
): NormalizedRoute {
  return {
    method: overrides.method ?? "GET",
    path: overrides.path ?? "/vault/:itemId",
    source: overrides.source ?? "api/vault/[itemId]/route.ts",
    parameterNames: ["itemId"],
    operation: {
      schemas: {
        params: z.strictObject({ itemId: z.string() }),
        responses,
      },
      security,
      contract: { summary: "Read a vault item" },
      handler: handler as RouteOperation["handler"],
    },
  };
}

const none = (): RouteSecurity => ({ authentication: { mode: "none" } });
const required = (extra: Partial<RouteSecurity> = {}): RouteSecurity => ({
  authentication: {
    mode: "required",
    provider: "project-auth",
    requirementId: "AC-APP-014",
  },
  ...extra,
});
const requiredResponses = (
  extra: Readonly<Record<number, z.ZodType | null>> = {},
) => ({
  200: okSchema,
  401: problemSchema,
  ...extra,
});
const json = async (response: Response) =>
  await response.json() as Record<string, unknown>;
const request = (headers: HeadersInit = {}) =>
  new Request("https://api.test/vault/sleepy", { headers });

async function rejection(
  attempt: () => Promise<unknown>,
): Promise<SecurityConfigurationError> {
  try {
    await attempt();
  } catch (error) {
    assert.ok(
      error instanceof SecurityConfigurationError,
      `expected SecurityConfigurationError, received ${error}`,
    );
    return error;
  }
  throw new assert.AssertionError({ message: "composition did not fail" });
}

Deno.test("AC-F005-001 · explicit none exposes null without invoking a provider", async () => {
  let providerCalls = 0;
  let observed: unknown = "unset";
  const app = createSecurityRouter([
    route(none(), ({ principal }) => {
      observed = principal;
      return Response.json({ ok: true });
    }),
  ], {
    mode: "test",
    providers: {
      unused: {
        challenge: "Bearer",
        authenticate: () => {
          providerCalls += 1;
          return Promise.resolve({ id: "wrong", type: "user" });
        },
      },
    },
  });

  assert.equal((await app.fetch(request())).status, 200);
  assert.equal(observed, null);
  assert.equal(providerCalls, 0);
});

Deno.test("AC-F005-002 · a neutral provider supplies principal without changing route inputs", async () => {
  let observed: unknown;
  const app = createSecurityRouter([
    route(required(), ({ params, principal }) => {
      observed = { params, principal };
      return Response.json({ ok: true });
    }, requiredResponses()),
  ], {
    mode: "test",
    providers: {
      "project-auth": {
        challenge: "Bearer realm=project",
        authenticate: () =>
          Promise.resolve({
            id: "principal-1",
            type: "project-user",
            claims: { role: "reader" },
          }),
      },
    },
  });

  assert.equal((await app.fetch(request())).status, 200);
  assert.deepEqual(observed, {
    params: { itemId: "sleepy" },
    principal: {
      id: "principal-1",
      type: "project-user",
      claims: { role: "reader" },
    },
  });

  const diagnostics: SecurityDiagnostic[] = [];
  const malformed = createSecurityRouter([
    route(required(), () => Response.json({ ok: true }), requiredResponses()),
  ], {
    mode: "test",
    onDiagnostic: (item) => diagnostics.push(item as SecurityDiagnostic),
    providers: {
      "project-auth": {
        challenge: "Bearer",
        authenticate: () =>
          Promise.resolve(
            ({ id: "", type: "user", token: "provider-secret" }) as never,
          ),
      },
    },
  });
  assert.equal((await malformed.fetch(request())).status, 500);
  assert.equal(diagnostics[0]?.code, "SH_AUTH_PROVIDER_INVALID");
  assert.doesNotMatch(JSON.stringify(diagnostics), /provider-secret/);
});

Deno.test("AC-F005-003 · missing identity returns declared 401 and challenge", async () => {
  let handled = 0;
  const app = createSecurityRouter([
    route(required(), () => {
      handled += 1;
      return Response.json({ ok: true });
    }, requiredResponses()),
  ], {
    mode: "test",
    providers: {
      "project-auth": {
        challenge: 'Bearer realm="project"',
        authenticate: () => Promise.resolve(null),
      },
    },
  });

  const response = await app.fetch(
    request({ authorization: "Bearer missing" }),
  );
  const body = await json(response);
  assert.equal(response.status, 401);
  assert.equal(
    response.headers.get("www-authenticate"),
    'Bearer realm="project"',
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.title, "Unauthorized");
  assert.equal(handled, 0);
  assert.doesNotMatch(JSON.stringify(body), /missing/);
});

Deno.test("AC-F005-004 · a denied guard returns declared 403", async () => {
  let handled = 0;
  const app = createSecurityRouter([
    route(
      required({
        authorization: {
          name: "can-read-vault",
          requirementId: "AC-APP-015",
          guard: () => false,
        },
      }),
      () => {
        handled += 1;
        return Response.json({ ok: true });
      },
      requiredResponses({ 403: problemSchema }),
    ),
  ], {
    mode: "test",
    providers: {
      "project-auth": {
        challenge: "Bearer",
        authenticate: () => Promise.resolve({ id: "reader-1", type: "user" }),
      },
    },
  });

  const response = await app.fetch(request());
  assert.equal(response.status, 403);
  assert.equal((await json(response)).title, "Forbidden");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(handled, 0);
});

Deno.test("AC-F005-005 · protections complete in order before handler effects", async () => {
  const events: string[] = [];
  const limiter = {
    scope: "shared" as const,
    consume: () => {
      events.push("rate");
      return Promise.resolve({
        allowed: true,
        remaining: 1,
        resetAt: Date.now() + 1_000,
      });
    },
  };
  const app = createSecurityRouter([
    route(
      required({
        authorization: {
          name: "can-read-vault",
          requirementId: "AC-APP-015",
          guard: () => {
            events.push("authorize");
            return true;
          },
        },
        rateLimit: "standard-api",
      }),
      () => {
        events.push("handler");
        return Response.json({ ok: true });
      },
      requiredResponses({
        403: problemSchema,
        429: problemSchema,
        503: problemSchema,
      }),
    ),
  ], {
    mode: "test",
    providers: {
      "project-auth": {
        challenge: "Bearer",
        authenticate: () => {
          events.push("authenticate");
          return Promise.resolve({ id: "reader-1", type: "user" });
        },
      },
    },
    rateLimits: {
      "standard-api": {
        limit: 2,
        windowMs: 1_000,
        key: () => "client-1",
        limiter,
      },
    },
  });

  assert.equal((await app.fetch(request())).status, 200);
  assert.deepEqual(events, ["rate", "authenticate", "authorize", "handler"]);
});

Deno.test("AC-F005-006 · production configuration closes CORS and process-local gaps", async (test) => {
  const base = route(none(), () => Response.json({ ok: true }));

  await test.step("missing production CORS fails", () => {
    assert.throws(
      () => createSecurityRouter([base], { mode: "production" }),
      (error) =>
        error instanceof SecurityConfigurationError &&
        error.diagnostics.some((item) => item.code === "SH_CORS_REQUIRED"),
    );
  });
  await test.step("invalid explicit mode fails actionably", () => {
    assert.throws(
      () =>
        createSecurityRouter([base], {
          mode: "preview",
        } as unknown as SecurityOptions),
      (error) =>
        error instanceof SecurityConfigurationError &&
        error.diagnostics.some((item) =>
          item.code === "SH_SECURITY_MODE_INVALID"
        ),
    );
  });
  await test.step("malformed runtime CORS fails actionably", () => {
    assert.throws(
      () =>
        createSecurityRouter([base], {
          mode: "production",
          cors: { mode: "allow" },
        } as unknown as SecurityOptions),
      (error) =>
        error instanceof SecurityConfigurationError &&
        error.diagnostics.some((item) =>
          item.code === "SH_CORS_CONFIGURATION_INVALID"
        ),
    );
  });
  await test.step("credentialed wildcard fails", () => {
    assert.throws(
      () =>
        createSecurityRouter([base], {
          mode: "production",
          cors: {
            mode: "allow",
            origins: "*",
            methods: ["GET"],
            headers: [],
            credentials: true,
          },
        }),
      (error) =>
        error instanceof SecurityConfigurationError &&
        error.diagnostics.some((item) =>
          item.code === "SH_CORS_WILDCARD_CREDENTIALS"
        ),
    );
  });
  await test.step("process-local production limiter fails", () => {
    const limited = route(
      { ...none(), rateLimit: "standard-api" },
      () => Response.json({ ok: true }),
      { 200: okSchema, 429: problemSchema, 503: problemSchema },
    );
    assert.throws(
      () =>
        createSecurityRouter([limited], {
          mode: "production",
          cors: { mode: "deny" },
          rateLimits: {
            "standard-api": {
              limit: 2,
              windowMs: 1_000,
              key: () => "client-1",
              limiter: createMemoryRateLimiter({ maxKeys: 10 }),
            },
          },
        }),
      (error) =>
        error instanceof SecurityConfigurationError &&
        error.diagnostics.some((item) =>
          item.code === "SH_SECURITY_RATE_LIMIT_PROCESS_SCOPE"
        ),
    );
  });
  await test.step("exact origin and known preflight succeed", async () => {
    const app = createSecurityRouter([base], {
      mode: "production",
      cors: {
        mode: "allow",
        origins: ["https://app.test"],
        methods: ["GET"],
        headers: ["content-type"],
        credentials: true,
      },
    });
    const response = await app.fetch(
      new Request("https://api.test/vault/sleepy", {
        method: "OPTIONS",
        headers: {
          origin: "https://app.test",
          "access-control-request-method": "GET",
          "access-control-request-headers": "content-type",
        },
      }),
    );
    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://app.test",
    );
    assert.match(response.headers.get("vary") ?? "", /Origin/);

    for (
      const [path, method, origin] of [
        ["/missing", "GET", "https://app.test"],
        ["/vault/sleepy", "POST", "https://app.test"],
        ["/vault/sleepy", "GET", "https://evil.test"],
      ]
    ) {
      const rejected = await app.fetch(
        new Request(`https://api.test${path}`, {
          method: "OPTIONS",
          headers: {
            origin,
            "access-control-request-method": method,
          },
        }),
      );
      assert.notEqual(rejected.status, 204);
      assert.equal(rejected.headers.get("access-control-allow-origin"), null);
    }
  });
});

Deno.test("AC-F005-007 · redaction is recursive, cycle-safe, and request-safe", () => {
  const value: Record<string, unknown> = {
    safe: "route-context",
    authorization: "Bearer top-secret",
    nested: { apiKey: "key-secret", password: "password-secret" },
    request: new Request("https://api.test/path", {
      headers: { cookie: "session=secret", "x-safe": "also-secret-by-default" },
    }),
  };
  value.self = value;
  const redacted = redactSecurityData(value);
  const serialized = JSON.stringify(redacted);
  assert.match(serialized, /route-context/);
  assert.doesNotMatch(
    serialized,
    /top-secret|key-secret|password-secret|session=secret|also-secret/,
  );
  assert.match(serialized, /\[REDACTED\]|\[Circular\]/);
});

Deno.test("AC-F005-008 · fixed-window limiting is deterministic, bounded, and fail closed", async () => {
  let now = 1_000;
  const limiter = createMemoryRateLimiter({ maxKeys: 1, clock: () => now });
  const input = {
    policy: "standard-api",
    key: "client-1",
    limit: 2,
    windowMs: 1_000,
  };
  assert.deepEqual(await limiter.consume(input), {
    allowed: true,
    remaining: 1,
    resetAt: 2_000,
  });
  assert.deepEqual(await limiter.consume(input), {
    allowed: true,
    remaining: 0,
    resetAt: 2_000,
  });
  assert.deepEqual(await limiter.consume(input), {
    allowed: false,
    remaining: 0,
    resetAt: 2_000,
  });
  await assert.rejects(() => limiter.consume({ ...input, key: "client-2" }));
  now = 2_000;
  assert.equal(
    (await limiter.consume({ ...input, key: "client-2" })).allowed,
    true,
  );

  let authenticated = 0;
  const app = createSecurityRouter([
    route(
      required({ rateLimit: "standard-api" }),
      () => Response.json({ ok: true }),
      requiredResponses({ 429: problemSchema, 503: problemSchema }),
    ),
  ], {
    mode: "test",
    providers: {
      "project-auth": {
        challenge: "Bearer",
        authenticate: () => {
          authenticated += 1;
          return Promise.resolve({ id: "reader-1", type: "user" });
        },
      },
    },
    rateLimits: {
      "standard-api": {
        limit: 2,
        windowMs: 1_000,
        key: () => "client-1",
        limiter: createMemoryRateLimiter({ maxKeys: 10, clock: () => now }),
      },
    },
  });
  assert.equal((await app.fetch(request())).status, 200);
  assert.equal((await app.fetch(request())).status, 200);
  const rejected = await app.fetch(request());
  assert.equal(rejected.status, 429);
  assert.match(rejected.headers.get("retry-after") ?? "", /^\d+$/);
  assert.equal(rejected.headers.get("cache-control"), "no-store");
  assert.equal(authenticated, 2);

  const diagnostics: SecurityDiagnostic[] = [];
  const failed = createSecurityRouter([
    route(
      { ...none(), rateLimit: "failed" },
      () => Response.json({ ok: true }),
      { 200: okSchema, 429: problemSchema, 503: problemSchema },
    ),
  ], {
    mode: "test",
    onDiagnostic: (item) => diagnostics.push(item as SecurityDiagnostic),
    rateLimits: {
      failed: {
        limit: 1,
        windowMs: 1_000,
        key: () => "client-1",
        limiter: {
          scope: "shared",
          consume: () => Promise.reject(new Error("store secret")),
        },
      },
    },
  });
  const unavailable = await failed.fetch(request());
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("cache-control"), "no-store");
  assert.equal(diagnostics.at(-1)?.code, "SH_RATE_LIMIT_FAILED");
  assert.doesNotMatch(JSON.stringify(diagnostics), /store secret/);

  let rawKeyHandler = 0;
  const rawKey = createSecurityRouter([
    route(
      { ...none(), rateLimit: "raw-key" },
      () => {
        rawKeyHandler += 1;
        return Response.json({ ok: true });
      },
      { 200: okSchema, 429: problemSchema, 503: problemSchema },
    ),
  ], {
    mode: "test",
    rateLimits: {
      "raw-key": {
        limit: 1,
        windowMs: 1_000,
        key: (incoming) => incoming.headers.get("x-api-key") ?? "anonymous",
        limiter: {
          scope: "shared",
          consume: () =>
            Promise.resolve({
              allowed: true,
              remaining: 0,
              resetAt: 2_000,
            }),
        },
      },
    },
  });
  assert.equal(
    (await rawKey.fetch(request({ "x-api-key": "raw-key-secret" }))).status,
    503,
  );
  assert.equal(rawKeyHandler, 0);
});

Deno.test("AC-F005-009 · startup diagnostics and metadata expose every protection", () => {
  const diagnostics: SecurityDiagnostic[] = [];
  const secure = required({
    authorization: {
      name: "can-read-vault",
      requirementId: "AC-APP-015",
      guard: () => true,
    },
    rateLimit: "standard-api",
  });
  assert.throws(
    () =>
      createSecurityRouter([
        route(secure, () => Response.json({ ok: true }), { 200: okSchema }),
      ], {
        mode: "test",
        onDiagnostic: (item) => {
          if (
            "policy" in item || item.code.startsWith("SH_SECURITY")
          ) diagnostics.push(item as SecurityDiagnostic);
        },
      }),
    SecurityConfigurationError,
  );
  assert.ok(diagnostics.length > 0);

  const limiter = createMemoryRateLimiter({ maxKeys: 10 });
  const app = createSecurityRouter([
    route(
      secure,
      () => Response.json({ ok: true }),
      requiredResponses({
        403: problemSchema,
        429: problemSchema,
        503: problemSchema,
      }),
    ),
  ], {
    mode: "test",
    providers: {
      "project-auth": {
        challenge: "Bearer",
        authenticate: () => Promise.resolve({ id: "1", type: "user" }),
      },
    },
    rateLimits: {
      "standard-api": {
        limit: 10,
        windowMs: 1_000,
        key: () => "client-1",
        limiter,
      },
    },
  });
  assert.deepEqual(app.routes[0], {
    method: "GET",
    path: "/vault/:itemId",
    source: "api/vault/[itemId]/route.ts",
    authentication: "required",
    provider: "project-auth",
    authenticationRequirementId: "AC-APP-014",
    authorizationGuard: "can-read-vault",
    authorizationRequirementId: "AC-APP-015",
    rateLimitPolicy: "standard-api",
    corsMode: "deny",
    secureHeaders: true,
    requestId: true,
    bodyLimits: "SH-F003",
    boundedData: "SH-F004",
  });
});

Deno.test("AC-F005-010 · the framework security surface remains identity-model neutral", () => {
  const app = createSecurityRouter([
    route(none(), () => Response.json({ ok: true })),
  ], { mode: "test" });
  const surface = Object.keys(app).sort();
  assert.deepEqual(surface, ["fetch", "routes"]);
  assert.doesNotMatch(
    JSON.stringify(app.routes),
    /email|password|jwt|oidc|session|api.?key/i,
  );
});

Deno.test("AC-F005-011 · all responses carry secure headers and safe request IDs", async () => {
  const ids: string[] = [];
  const app = createSecurityRouter([
    route(none(), ({ requestId }) => {
      ids.push(requestId);
      return Response.json({ ok: true });
    }),
  ], { mode: "test", requestId: () => "generated-id" });

  const accepted = await app.fetch(request({ "x-request-id": "caller:123" }));
  const generated = await app.fetch(
    request({ "x-request-id": "bad secret/id" }),
  );
  const missing = await app.fetch(
    new Request("https://api.test/missing", {
      headers: { authorization: "Bearer never-reflect" },
    }),
  );
  assert.deepEqual(ids, ["caller:123", "generated-id"]);
  for (const response of [accepted, generated, missing]) {
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(
      response.headers.get("content-security-policy"),
      "default-src 'none'; frame-ancestors 'none'",
    );
    assert.match(
      response.headers.get("x-request-id") ?? "",
      /^[A-Za-z0-9._:-]{1,128}$/,
    );
    assert.doesNotMatch(
      [...response.headers].join(" "),
      /secret|never-reflect/,
    );
  }

  const fallback = createSecurityRouter([
    route(none(), () => Response.json({ ok: true })),
  ], {
    mode: "test",
    requestId: () => {
      throw new Error("generator secret");
    },
  });
  const fallbackResponse = await fallback.fetch(request());
  assert.equal(fallbackResponse.status, 200);
  assert.match(
    fallbackResponse.headers.get("x-request-id") ?? "",
    /^[A-Za-z0-9._:-]{1,128}$/,
  );
});

Deno.test("AC-F005-012 · a declared security module supplies frozen composition inputs", async () => {
  const declaration = defineSecurity({
    providers: {
      "project-auth": {
        challenge: "Bearer realm=project",
        authenticate: (incoming: Request) =>
          Promise.resolve(
            incoming.headers.get("authorization") === "Bearer good"
              ? { id: "principal-1", type: "project-user" }
              : null,
          ),
      },
    },
    rateLimits: {
      "standard-api": {
        limit: 5,
        windowMs: 1_000,
        key: () => "fixed",
        limiter: createMemoryRateLimiter({ maxKeys: 4, clock: () => 0 }),
      },
    },
    cors: { mode: "deny" as const },
  });

  assert.equal(Object.isFrozen(declaration), true);
  assert.throws(() => {
    (declaration as { cors: unknown }).cors = { mode: "allow" };
  });

  let loaded = "";
  const app = await composeProjectSecurity([
    route(
      required({ rateLimit: "standard-api" }),
      () => Response.json({ ok: true }),
      requiredResponses({ 429: problemSchema, 503: problemSchema }),
    ),
  ], {
    mode: "test",
    root: "/projects/vault",
    securityModule: "security.ts",
    load: (specifier) => {
      loaded = specifier;
      return Promise.resolve({ default: declaration });
    },
  });

  assert.match(loaded, /security\.ts$/);
  assert.equal((await app.fetch(request())).status, 401);
  assert.equal(
    (await app.fetch(request({ authorization: "Bearer good" }))).status,
    200,
  );
  assert.equal(app.routes[0].provider, "project-auth");
  assert.equal(app.routes[0].rateLimitPolicy, "standard-api");
  assert.equal(app.routes[0].corsMode, "deny");
});

Deno.test("AC-F005-013 · an absent module composes and an unresolvable one fails", async () => {
  const open = await composeProjectSecurity([
    route(none(), () => Response.json({ ok: true })),
  ], { mode: "test", root: "/projects/vault" });

  assert.equal((await open.fetch(request())).status, 200);
  assert.equal(open.routes[0].authentication, "none");

  const failure = await rejection(() =>
    composeProjectSecurity([
      route(none(), () => Response.json({ ok: true })),
    ], {
      mode: "test",
      root: "/projects/vault",
      securityModule: "security/missing.ts",
      load: () => Promise.reject(new Error("module not found")),
    })
  );

  assert.equal(failure.diagnostics.length > 0, true);
  const reported = failure.diagnostics
    .map((entry) => `${entry.summary} ${entry.source ?? ""}`)
    .join(" ");
  assert.match(reported, /security\/missing\.ts/);
});

Deno.test("AC-F005-014 · a required route without a resolvable provider fails at composition", async () => {
  let handlerCalls = 0;
  const failure = await rejection(() =>
    composeProjectSecurity([
      route(required(), () => {
        handlerCalls += 1;
        return Response.json({ ok: true });
      }, requiredResponses()),
    ], {
      mode: "test",
      root: "/projects/vault",
      securityModule: "security.ts",
      load: () => Promise.resolve({ default: defineSecurity({}) }),
    })
  );

  assert.equal(handlerCalls, 0);
  const reported = failure.diagnostics
    .map((entry) => `${entry.summary} ${entry.route ?? ""}`)
    .join(" ");
  assert.match(reported, /project-auth/);
  assert.match(reported, /GET \/vault\/:itemId/);
});
