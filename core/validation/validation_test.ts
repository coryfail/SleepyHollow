import assert from "assert/strict";
import { z } from "zod";

import type {
  NormalizedRoute,
  RouteHandlerContext,
  RouteOperation,
} from "../routing/mod.ts";
import {
  createValidatedRouter,
  formatValidationDiagnostic,
  SchemaNormalizationError,
  type ValidationDiagnostic,
  validationDiagnosticResult,
} from "./mod.ts";

type ValidationContext =
  & Omit<
    RouteHandlerContext<unknown>,
    "query" | "headers" | "body"
  >
  & {
    readonly query: Readonly<Record<string, unknown>>;
    readonly headers: Readonly<Record<string, unknown>>;
    readonly body: unknown;
  };

interface RouteSchemas {
  readonly params?: z.ZodType;
  readonly query?: z.ZodType;
  readonly headers?: z.ZodType;
  readonly body?: {
    readonly schema: z.ZodType;
    readonly maxBytes: number;
  };
  readonly responses: Readonly<Record<number, z.ZodType | null>>;
}

const route = (
  schemas: RouteSchemas,
  handler: (context: ValidationContext) => Response | Promise<Response>,
  overrides: Partial<Pick<NormalizedRoute, "method" | "path" | "source">> = {},
): NormalizedRoute => ({
  method: overrides.method ?? "POST",
  path: overrides.path ?? "/collections/:collectionId/bookmarks",
  source: overrides.source ??
    "api/collections/[collectionId]/bookmarks/route.ts",
  parameterNames: ["collectionId"],
  operation: {
    schemas,
    security: { authentication: { mode: "none" } },
    contract: { summary: "Create a bookmark" },
    handler: handler as RouteOperation["handler"],
  },
});

const responseSchema = z.strictObject({
  collectionId: z.string(),
  notify: z.boolean(),
  idempotencyKey: z.string(),
  title: z.string(),
});

const validSchemas = (): RouteSchemas => ({
  params: z.strictObject({ collectionId: z.string() }),
  query: z.strictObject({ notify: z.stringbool().optional().default(false) }),
  headers: z.object({ "idempotency-key": z.string().min(1) }),
  body: {
    schema: z.strictObject({ url: z.url(), title: z.string().min(1) }),
    maxBytes: 1024,
  },
  responses: { 201: responseSchema },
});

const validRequest = (body: unknown = {
  url: "https://example.test/story",
  title: "The Legend",
}) =>
  new Request(
    "https://api.test/collections/fiction/bookmarks?notify=true",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "request-123",
        "user-agent": "ambient-transport-header",
      },
      body: JSON.stringify(body),
    },
  );

const json = async (response: Response) =>
  await response.json() as Record<string, unknown>;

test("AC-F003-001 · typed request locations reach the handler", async () => {
  let handled = 0;
  const app = createValidatedRouter([
    route(validSchemas(), ({ params, query, headers, body }) => {
      handled += 1;
      const parsedBody = body as { title: string };
      return Response.json({
        collectionId: params.collectionId,
        notify: query.notify,
        idempotencyKey: headers["idempotency-key"],
        title: parsedBody.title,
      }, { status: 201 });
    }),
  ]);

  const response = await app.fetch(validRequest());
  assert.equal(response.status, 201);
  assert.equal(handled, 1);
  assert.deepEqual(await json(response), {
    collectionId: "fiction",
    notify: true,
    idempotencyKey: "request-123",
    title: "The Legend",
  });
});

test("AC-F003-002 · invalid input returns field-specific Problem Details before side effects", async () => {
  let handled = 0;
  const app = createValidatedRouter([
    route(validSchemas(), () => {
      handled += 1;
      return Response.json({}, { status: 201 });
    }),
  ]);

  const response = await app.fetch(validRequest({
    url: "not-a-url",
    title: "The Legend",
  }));
  const problem = await json(response);

  assert.equal(response.status, 400);
  assert.equal(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  assert.equal(handled, 0);
  assert.equal(
    problem.type,
    "https://sleepyhollow.dev/problems/request-validation",
  );
  assert.equal(problem.title, "Request validation failed");
  assert.deepEqual(problem.errors, [{
    location: "body",
    path: ["url"],
    code: "invalid_format",
    message: "Invalid URL",
  }]);
});

test("AC-F003-003 · unknown application fields are rejected by default", async () => {
  const app = createValidatedRouter([
    route(validSchemas(), () => Response.json({}, { status: 201 })),
  ]);
  const response = await app.fetch(validRequest({
    url: "https://example.test/story",
    title: "The Legend",
    secretAdminOverride: true,
  }));
  const problem = await json(response);

  assert.equal(response.status, 400);
  assert.deepEqual(problem.errors, [{
    location: "body",
    path: ["secretAdminOverride"],
    code: "unrecognized_keys",
    message: "Unrecognized key",
  }]);
  assert.doesNotMatch(JSON.stringify(problem), /true/);
});

test("AC-F003-004 · body limits reject declared and streamed overflow", async (test) => {
  let handled = 0;
  const schemas = validSchemas();
  const body = schemas.body!;
  const limited = { ...schemas, body: { ...body, maxBytes: 8 } };
  const app = createValidatedRouter([
    route(limited, () => {
      handled += 1;
      return Response.json({}, { status: 201 });
    }),
  ]);

  await test.step("declared Content-Length", async () => {
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new TextEncoder().encode('{"large":true}'));
        controller.close();
      },
    }, { highWaterMark: 0 });
    const request = new Request(
      "https://api.test/collections/fiction/bookmarks",
      {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": "99" },
        body: stream,
        duplex: "half",
      },
    );
    const response = await app.fetch(request);
    assert.equal(response.status, 413);
    assert.equal(pulls, 0);
  });

  await test.step("streamed bytes", async () => {
    let cancelled = false;
    const chunks = ['{"title"', ':"too large"}'];
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks.shift();
        if (chunk) controller.enqueue(new TextEncoder().encode(chunk));
        else controller.close();
      },
      cancel() {
        cancelled = true;
      },
    }, { highWaterMark: 0 });
    const request = new Request(
      "https://api.test/collections/fiction/bookmarks",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: stream,
        duplex: "half",
      },
    );
    const response = await app.fetch(request);
    assert.equal(response.status, 413);
    assert.equal(cancelled, true);
  });

  assert.equal(handled, 0);
});

test("AC-F003-005 · invalid handler responses become internal failures", async () => {
  const diagnostics: ValidationDiagnostic[] = [];
  const app = createValidatedRouter([
    route(
      validSchemas(),
      () => Response.json({ accepted: "wrong" }, { status: 201 }),
    ),
  ], {
    mode: "production",
    onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  });

  const response = await app.fetch(validRequest());
  const problem = await json(response);
  assert.equal(response.status, 500);
  assert.equal(problem.title, "Internal Server Error");
  assert.doesNotMatch(JSON.stringify(problem), /accepted|wrong/);
  assert.equal(diagnostics[0]?.code, "SH_RESPONSE_SCHEMA_INVALID");
  assert.equal(diagnostics[0]?.schemaLocation, "response.201");
});

test("AC-F003-006 · production failures redact implementation and secret data", async () => {
  const app = createValidatedRouter([
    route(validSchemas(), () => {
      throw new Error(
        "Bearer secret-token at kv:[users,123]\nprivate stack line",
      );
    }),
  ], { mode: "production" });

  const response = await app.fetch(validRequest());
  const serialized = JSON.stringify(await json(response));
  assert.equal(response.status, 500);
  assert.doesNotMatch(serialized, /secret-token|kv:|users|stack|Bearer/);
});

test("AC-F003-006 · schema-authored messages cannot reflect rejected secrets", async () => {
  const secret = "private-customer-token";
  const schemas = validSchemas();
  const app = createValidatedRouter([
    route({
      ...schemas,
      body: {
        schema: z.strictObject({
          url: z.url(),
          title: z.string().refine(
            () => false,
            { message: `Rejected value ${secret}` },
          ),
        }),
        maxBytes: 1024,
      },
    }, () => Response.json({}, { status: 201 })),
  ]);

  const response = await app.fetch(validRequest({
    url: "https://example.test/story",
    title: secret,
  }));
  const serialized = JSON.stringify(await json(response));

  assert.equal(response.status, 400);
  assert.doesNotMatch(serialized, new RegExp(secret));
  assert.match(serialized, /Value does not satisfy the declared schema/);
});

test("AC-F003-007 · human and JSON diagnostics identify safe correction context", async () => {
  const diagnostics: ValidationDiagnostic[] = [];
  const app = createValidatedRouter([
    route(
      validSchemas(),
      () => Response.json({ accepted: false }, { status: 201 }),
    ),
  ], { onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
  await app.fetch(validRequest());

  const diagnostic = diagnostics[0];
  const human = formatValidationDiagnostic(diagnostic);
  const structured = validationDiagnosticResult(diagnostics) as Record<
    string,
    unknown
  >;
  assert.match(human, /SH_RESPONSE_SCHEMA_INVALID/);
  assert.match(human, /POST \/collections\/:collectionId\/bookmarks/);
  assert.match(human, /response\.201/);
  assert.match(
    human,
    /api\/collections\/\[collectionId\]\/bookmarks\/route\.ts/,
  );
  assert.match(human, /Return a response matching the declared schema/);
  assert.equal(structured.version, 1);
  assert.deepEqual(structured.diagnostics, diagnostics);
});

test("AC-F003-008 · runtime and contracts share one normalized schema inventory", async () => {
  const Body = z.strictObject({ title: z.string() });
  const app = createValidatedRouter([
    route({
      body: { schema: Body, maxBytes: 128 },
      responses: { 201: z.strictObject({ title: z.string() }) },
    }, ({ body }) => Response.json(body, { status: 201 })),
  ]);

  const normalized = app.routes[0] as {
    readonly schemas: {
      readonly body: {
        readonly runtime: z.ZodType;
        readonly contract: Record<string, unknown>;
      };
    };
  };
  assert.equal(normalized.schemas.body.runtime, Body);
  assert.deepEqual(normalized.schemas.body.contract, {
    type: "object",
    properties: { title: { type: "string" } },
    required: ["title"],
    additionalProperties: false,
  });

  const response = await app.fetch(
    new Request(
      "https://api.test/collections/fiction/bookmarks",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "shared" }),
      },
    ),
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await json(response), { title: "shared" });
});

test("AC-F003-008 · unrepresentable schemas fail normalization", () => {
  assert.throws(
    () =>
      createValidatedRouter([
        route({
          body: { schema: z.bigint(), maxBytes: 64 },
          responses: { 201: z.strictObject({ ok: z.boolean() }) },
        }, () => Response.json({ ok: true }, { status: 201 })),
      ]),
    (error: unknown) => {
      assert.ok(error instanceof SchemaNormalizationError);
      assert.equal(error.diagnostics[0]?.code, "SH_SCHEMA_UNREPRESENTABLE");
      assert.equal(error.diagnostics[0]?.schemaLocation, "body");
      return true;
    },
  );
});
