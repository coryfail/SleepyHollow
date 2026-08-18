import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { renderContractArtifacts } from "../../cli/generate/mod.ts";
import {
  createServiceClientOptions,
  normalizeServiceArchitecture,
  openOwnedServiceKv,
  scaffoldServiceWorkspaces,
  ServiceArchitectureError,
  ServiceBoundaryError,
  ServiceCancelledError,
  ServiceDeadlineError,
  ServiceUnavailableError,
  verifyServiceBoundaries,
} from "./mod.ts";
import type {
  DeadlineScheduler,
  ServiceArchitecture,
  ServiceDefinition,
} from "./types.ts";

function dependency(serviceId: string) {
  return {
    serviceId,
    requirementsPath: `services/caller/requirements/${serviceId}.req.md`,
    authenticationRequirementId: `AUTH-${serviceId.toUpperCase()}`,
    failureCriteria: {
      timeout: "AC-CALLER-001",
      unavailable: "AC-CALLER-002",
      nonSuccess: "AC-CALLER-003",
      partialFailure: "AC-CALLER-004",
    },
    partialFailure: { strategy: "compensate" as const, atomic: false as const },
  };
}

function service(
  id: string,
  dependencies: ServiceDefinition["dependencies"] = [],
): ServiceDefinition {
  const root = `services/${id}`;
  return {
    id,
    root,
    requirementsPath: `${root}/requirements/application.req.md`,
    configPath: `${root}/sleepyhollow.config.ts`,
    apiRoot: `${root}/api`,
    testsRoot: `${root}/tests`,
    generatedRoot: `${root}/generated`,
    deploymentConfigPath: `${root}/deployment.json`,
    kvBinding: `${id}-kv`,
    dependencies,
  };
}

function multiArchitecture(): ServiceArchitecture {
  return {
    choice: "multi-service",
    rationale: "Independent regulated ownership and deployment lifecycle.",
    services: [service("accounts", [dependency("ledger")]), service("ledger")],
  };
}

function singleArchitecture(): ServiceArchitecture {
  return { choice: "single-service", services: [service("application")] };
}

async function temporary<T>(run: (path: string) => Promise<T>): Promise<T> {
  const path = await Deno.makeTempDir({ prefix: "sleepy-hollow-services-" });
  try {
    return await run(path);
  } finally {
    await Deno.remove(path, { recursive: true });
  }
}

let importSequence = 0;
async function generatedClient(): Promise<Record<string, unknown>> {
  const artifacts = renderContractArtifacts({
    serviceId: "ledger",
    title: "Ledger",
    version: "1.0.0",
    operations: [{
      operationId: "getBalance",
      method: "GET",
      path: "/balances/:id",
      source: "services/ledger/api/balances/[id]/route.ts",
      summary: "Read balance",
      request: {
        params: {
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["id"],
            properties: { id: { type: "string" } },
          },
        },
      },
      responses: {
        200: {
          description: "Balance",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["amount"],
            properties: { amount: { type: "number" } },
          },
        },
      },
      security: { mode: "required", scheme: "serviceAuth" },
    }],
    securitySchemes: {
      serviceAuth: { type: "apiKey", in: "header", name: "authorization" },
    },
  });
  const source =
    artifacts.artifacts.find((item) => item.path === "client.ts")!.content;
  const directory = await Deno.makeTempDir({
    prefix: "sleepy-hollow-service-client-",
  });
  const path = join(directory, "client.ts");
  await Deno.writeTextFile(path, source);
  importSequence += 1;
  return await import(`${pathToFileURL(path).href}?service=${importSequence}`);
}

Deno.test("AC-F014-001 · architecture choices are normalized and justified", () => {
  const normalized = normalizeServiceArchitecture(multiArchitecture());
  assert.deepEqual(normalized.services.map((item) => item.id), [
    "accounts",
    "ledger",
  ]);
  assert.throws(
    () =>
      normalizeServiceArchitecture({ ...multiArchitecture(), rationale: "" }),
    ServiceArchitectureError,
  );
  assert.equal(
    normalizeServiceArchitecture(singleArchitecture()).choice,
    "single-service",
  );
});

Deno.test("AC-F014-002 · approved service workspaces are separate and atomic", () =>
  temporary(async (projectRoot) => {
    const architecture = multiArchitecture();
    const result = await scaffoldServiceWorkspaces({
      architecture,
      projectRoot,
      requirements: {
        accounts: "# Accounts requirements\n",
        ledger: "# Ledger requirements\n",
      },
    });
    assert.deepEqual(result.services.map((item) => item.id), [
      "accounts",
      "ledger",
    ]);
    for (const definition of architecture.services) {
      for (
        const path of [
          definition.requirementsPath,
          definition.configPath,
          definition.apiRoot,
          definition.testsRoot,
          definition.generatedRoot,
          definition.deploymentConfigPath,
        ]
      ) {
        assert.ok(
          (await Deno.stat(join(projectRoot, path))).isFile ||
            (await Deno.stat(join(projectRoot, path))).isDirectory,
        );
      }
    }

    const collisionRoot = join(projectRoot, "collision");
    await Deno.mkdir(join(collisionRoot, "services", "ledger"), {
      recursive: true,
    });
    await assert.rejects(
      () =>
        scaffoldServiceWorkspaces({
          architecture,
          projectRoot: collisionRoot,
          requirements: { accounts: "A", ledger: "L" },
        }),
      ServiceArchitectureError,
    );
    await assert.rejects(
      () => Deno.stat(join(collisionRoot, "services", "accounts")),
      Deno.errors.NotFound,
    );
  }));

Deno.test("AC-F014-003 · static and runtime boundaries reject foreign persistence", async () => {
  const architecture = normalizeServiceArchitecture(multiArchitecture());
  assert.deepEqual(verifyServiceBoundaries({ architecture, sources: [] }), {
    ok: true,
    checkedSources: 0,
    checkedCapabilities: 0,
  });
  assert.throws(
    () =>
      verifyServiceBoundaries({
        architecture,
        sources: [{
          serviceId: "accounts",
          path: "services/accounts/api/route.ts",
          content:
            'import "../../ledger/core/kv.ts";\nawait Deno.openKv("ledger-kv");',
        }],
      }),
    ServiceBoundaryError,
  );
  let opened = 0;
  await assert.rejects(
    () =>
      openOwnedServiceKv({
        architecture,
        ownerServiceId: "ledger",
        requesterServiceId: "accounts",
        bindingId: "ledger-kv",
        open: () => ++opened,
      }),
    ServiceBoundaryError,
  );
  assert.equal(opened, 0);
});

Deno.test("AC-F014-004 · declared generated-client calls compose neutral authentication", async () => {
  const module = await generatedClient();
  let request: Request | undefined;
  const options = createServiceClientOptions({
    architecture: multiArchitecture(),
    callerServiceId: "accounts",
    targetServiceId: "ledger",
    baseUrl: "https://ledger.internal",
    requestId: "req-service-1",
    timeoutMs: 1_000,
    authenticate: ({ request }) => {
      const headers = new Headers(request.headers);
      headers.set("authorization", "approved-service-proof");
      return new Request(request, { headers });
    },
    fetch: (value) => {
      request = value;
      return Promise.resolve(Response.json({ amount: 42 }));
    },
  });
  const client = (module.createClient as (options: unknown) => {
    getBalance(input: unknown): Promise<unknown>;
  })(options);
  await client.getBalance({ path: { id: "acct-1" } });
  assert.equal(request?.headers.get("authorization"), "approved-service-proof");
  assert.equal(request?.headers.get("x-request-id"), "req-service-1");
});

Deno.test("AC-F014-005 · service transport propagates request IDs, deadline, and cancellation", async () => {
  let callback: (() => void) | undefined;
  let cleared = 0;
  const scheduler: DeadlineScheduler = {
    set(next) {
      callback = next;
      return "timer";
    },
    clear(handle) {
      assert.equal(handle, "timer");
      cleared += 1;
    },
  };
  let seen: Request | undefined;
  const options = createServiceClientOptions({
    architecture: multiArchitecture(),
    callerServiceId: "accounts",
    targetServiceId: "ledger",
    baseUrl: "https://ledger.internal",
    requestId: "req-fixed",
    timeoutMs: 50,
    scheduler,
    fetch: (request) => {
      seen = request;
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  });
  const authenticated = await options.authenticate({
    operationId: "health",
    request: new Request("https://ledger.internal/health", {
      headers: { "x-request-id": "replace-me" },
    }),
  });
  await options.fetch(authenticated);
  assert.equal(seen?.headers.get("x-request-id"), "req-fixed");
  assert.equal(cleared, 1);
  assert.ok(callback);
});

Deno.test("AC-F014-006 · caller evidence and transport failures remain distinct", async () => {
  const architecture = normalizeServiceArchitecture(multiArchitecture());
  assert.equal(
    architecture.services[0].dependencies[0].failureCriteria.timeout,
    "AC-CALLER-001",
  );
  const unavailable = createServiceClientOptions({
    architecture,
    callerServiceId: "accounts",
    targetServiceId: "ledger",
    baseUrl: "https://ledger.internal",
    requestId: "req-failure",
    timeoutMs: 10,
    fetch: () => Promise.reject(new TypeError("network detail")),
  });
  await assert.rejects(
    () => unavailable.fetch(new Request("https://ledger.internal")),
    ServiceUnavailableError,
  );

  const parent = new AbortController();
  parent.abort();
  const cancelled = createServiceClientOptions({
    architecture,
    callerServiceId: "accounts",
    targetServiceId: "ledger",
    baseUrl: "https://ledger.internal",
    requestId: "req-cancelled",
    timeoutMs: 10,
    parentSignal: parent.signal,
    fetch: () => Promise.reject(new DOMException("aborted", "AbortError")),
  });
  await assert.rejects(
    () => cancelled.fetch(new Request("https://ledger.internal")),
    ServiceCancelledError,
  );

  const deadline = createServiceClientOptions({
    architecture,
    callerServiceId: "accounts",
    targetServiceId: "ledger",
    baseUrl: "https://ledger.internal",
    requestId: "req-deadline",
    timeoutMs: 10,
    scheduler: {
      set(callback) {
        callback();
        return "expired";
      },
      clear() {},
    },
    fetch: (request) =>
      request.signal.aborted
        ? Promise.reject(new DOMException("aborted", "AbortError"))
        : Promise.resolve(new Response()),
  });
  await assert.rejects(
    () => deadline.fetch(new Request("https://ledger.internal")),
    ServiceDeadlineError,
  );
});

Deno.test("AC-F014-007 · partial failures preserve caller-owned recovery semantics", async () => {
  const architecture = normalizeServiceArchitecture(multiArchitecture());
  assert.equal(
    architecture.services[0].dependencies[0].partialFailure.atomic,
    false,
  );
  let localState = "written";
  const options = createServiceClientOptions({
    architecture,
    callerServiceId: "accounts",
    targetServiceId: "ledger",
    baseUrl: "https://ledger.internal",
    requestId: "req-partial",
    timeoutMs: 10,
    fetch: () => Promise.reject(new TypeError("offline")),
  });
  try {
    await options.fetch(new Request("https://ledger.internal"));
  } catch (error) {
    assert.ok(error instanceof ServiceUnavailableError);
    localState = "compensated";
  }
  assert.equal(localState, "compensated");
});

Deno.test("AC-F014-008 · service tests and contracts require no unrelated runtime", () =>
  temporary(async (projectRoot) => {
    const architecture = multiArchitecture();
    await scaffoldServiceWorkspaces({
      architecture,
      projectRoot,
      requirements: { accounts: "Accounts", ledger: "Ledger" },
    });
    const rendered = renderContractArtifacts({
      serviceId: "accounts",
      title: "Accounts",
      version: "1.0.0",
      operations: [],
    });
    assert.ok(rendered.artifacts.some((item) => item.path === "openapi.json"));
  }));

Deno.test("AC-F014-009 · single-service projects activate no distributed infrastructure", () => {
  const architecture = normalizeServiceArchitecture(singleArchitecture());
  assert.equal(architecture.choice, "single-service");
  assert.equal(architecture.rationale, undefined);
  assert.deepEqual(architecture.services[0].dependencies, []);
  assert.doesNotMatch(
    JSON.stringify(architecture),
    /registry|token exchange|orchestrator/i,
  );
});
