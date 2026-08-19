import assert from "assert/strict";
import { z } from "zod";

import { createSecurityRouter } from "../security/mod.ts";
import {
  ConfigurationError,
  createJsonLogger,
  createOperationalRoutes,
  defineConfiguration,
  resolveConfiguration,
  type RuntimeMode,
} from "./mod.ts";

const logLevel = z.enum(["debug", "info", "warn", "error"]);

function baseDefinition() {
  return defineConfiguration({
    modes: {
      development: z.strictObject({
        LOG_LEVEL: logLevel.default("debug"),
        PORT: z.coerce.number().int().positive().default(8000),
      }),
      test: z.strictObject({
        LOG_LEVEL: logLevel.default("error"),
        PORT: z.coerce.number().int().positive().default(8001),
      }),
      preview: z.strictObject({
        LOG_LEVEL: logLevel.default("info"),
        PORT: z.coerce.number().int().positive(),
        DATABASE_URL: z.string().min(1),
      }),
      production: z.strictObject({
        LOG_LEVEL: logLevel.default("info"),
        PORT: z.coerce.number().int().positive(),
        DATABASE_URL: z.string().min(1),
      }),
    },
    sensitiveKeys: ["DATABASE_URL"],
  });
}

const json = async (response: Response) =>
  await response.json() as Record<string, unknown>;

test("AC-F012-001 · all runtime modes resolve typed values and safe metadata", async () => {
  const definition = baseDefinition();
  const inputs: Readonly<Record<RuntimeMode, Record<string, string>>> = {
    development: {},
    test: {},
    preview: { PORT: "9000", DATABASE_URL: "preview-secret" },
    production: { PORT: "443", DATABASE_URL: "production-secret" },
  };

  for (
    const mode of ["development", "test", "preview", "production"] as const
  ) {
    const resolved = await resolveConfiguration(definition, {
      mode,
      environment: inputs[mode],
    });
    assert.equal(resolved.mode, mode);
    assert.equal(typeof resolved.values.PORT, "number");
    assert.equal(resolved.metadata.mode, mode);
    assert.deepEqual(
      resolved.metadata.keys.map((item) => item.name),
      Object.keys(definition.modes[mode].shape).sort(),
    );
    assert.doesNotMatch(
      JSON.stringify(resolved.metadata),
      /preview-secret|production-secret/,
    );
  }
});

test("AC-F012-002 · invalid configuration fails with safe actionable diagnostics", async (test) => {
  await test.step("missing and malformed values", async () => {
    const definition = baseDefinition();
    await assert.rejects(
      () =>
        resolveConfiguration(definition, {
          mode: "production",
          environment: { PORT: "not-a-port", DATABASE_URL: "rejected-secret" },
        }),
      (error) => {
        assert.ok(error instanceof ConfigurationError);
        assert.ok(error.diagnostics.some((item) => item.key === "PORT"));
        assert.doesNotMatch(
          JSON.stringify(error.diagnostics),
          /not-a-port|rejected-secret/,
        );
        return true;
      },
    );
  });

  await test.step("undeclared sensitive key", () => {
    assert.throws(
      () =>
        defineConfiguration({
          modes: baseDefinition().modes,
          sensitiveKeys: ["UNKNOWN_SECRET"],
        }),
      (error) =>
        error instanceof ConfigurationError &&
        error.diagnostics.some((item) =>
          item.code === "SH_CONFIG_SENSITIVE_KEY_INVALID"
        ),
    );
  });

  await test.step("mode-incompatible local file", () => {
    assert.throws(
      () =>
        defineConfiguration({
          modes: baseDefinition().modes,
          localEnvFiles: { production: ".env.production" },
        } as never),
      (error) =>
        error instanceof ConfigurationError &&
        error.diagnostics.some((item) =>
          item.code === "SH_CONFIG_ENV_FILE_MODE_INVALID"
        ),
    );
  });
});

test("AC-F012-003 · local files are bounded, deterministic, and local-only", async () => {
  const definition = defineConfiguration({
    modes: baseDefinition().modes,
    localEnvFiles: { development: ".env.local" },
  });
  const paths: string[] = [];
  const resolved = await resolveConfiguration(definition, {
    mode: "development",
    environment: { PORT: "8123" },
    readTextFile: (path) => {
      paths.push(path);
      return Promise.resolve(`
# local values
LOG_LEVEL='warn'
PORT="9000"
`);
    },
  });
  assert.deepEqual(paths, [".env.local"]);
  assert.equal(resolved.values.LOG_LEVEL, "warn");
  assert.equal(resolved.values.PORT, 8123);
  assert.deepEqual(
    resolved.metadata.keys.map(({ name, source }) => ({ name, source })),
    [
      { name: "LOG_LEVEL", source: "env-file" },
      { name: "PORT", source: "environment" },
    ],
  );

  await assert.rejects(
    () =>
      resolveConfiguration(definition, {
        mode: "development",
        readTextFile: () => Promise.resolve("PORT=8000\nPORT=9000"),
      }),
    (error) =>
      error instanceof ConfigurationError &&
      error.diagnostics.some((item) => item.code === "SH_ENV_FILE_DUPLICATE"),
  );

  let productionReads = 0;
  await resolveConfiguration(definition, {
    mode: "production",
    environment: { PORT: "443", DATABASE_URL: "production-secret" },
    readTextFile: () => {
      productionReads += 1;
      return Promise.reject(new Error("must not read"));
    },
  });
  assert.equal(productionReads, 0);
});

test("AC-F012-004 · operational routes preserve or generate request IDs", async () => {
  const routes = createOperationalRoutes({ healthPath: "/_health" });
  const app = createSecurityRouter(routes, {
    mode: "test",
    requestId: () => "generated-config-id",
  });
  const accepted = await app.fetch(
    new Request("https://api.test/_health", {
      headers: { "x-request-id": "caller:config-1" },
    }),
  );
  const generated = await app.fetch(
    new Request("https://api.test/_health", {
      headers: { "x-request-id": "invalid request id" },
    }),
  );
  assert.equal(accepted.headers.get("x-request-id"), "caller:config-1");
  assert.equal(generated.headers.get("x-request-id"), "generated-config-id");
  assert.equal(accepted.headers.get("x-content-type-options"), "nosniff");
});

test("AC-F012-005 · logger records are deterministic structured JSON", () => {
  const lines: string[] = [];
  const logger = createJsonLogger({
    mode: "preview",
    sink: (line) => lines.push(line),
    clock: () => new Date("2026-08-07T15:00:00.000Z"),
  }).withRequest("request-123");
  logger.info("request.completed", {
    level: "attacker",
    timestamp: "attacker",
    event: "attacker",
    mode: "attacker",
    requestId: "attacker",
    count: 2,
  });
  assert.equal(lines.length, 1);
  const record = JSON.parse(lines[0]);
  assert.deepEqual(record, {
    count: 2,
    level: "info",
    timestamp: "2026-08-07T15:00:00.000Z",
    event: "request.completed",
    mode: "preview",
    requestId: "request-123",
  });
});

test("AC-F012-006 · logging redacts standard and configured sensitive data", () => {
  const lines: string[] = [];
  const logger = createJsonLogger({
    mode: "production",
    sink: (line) => lines.push(line),
    sensitiveFields: ["privateField"],
  });
  const context: Record<string, unknown> = {
    safe: "visible",
    authorization: "Bearer auth-secret",
    nested: { privateField: "private-secret", session: "session-secret" },
    request: new Request("https://api.test/path", {
      headers: { cookie: "cookie-secret", "x-other": "hidden-header" },
    }),
  };
  context.self = context;
  logger.error("request.failed", context);
  const serialized = lines[0];
  assert.match(serialized, /visible/);
  assert.doesNotMatch(
    serialized,
    /auth-secret|private-secret|session-secret|cookie-secret|hidden-header/,
  );
  assert.match(serialized, /\[REDACTED\]|\[Circular\]/);
});

test("AC-F012-007 · health routes expose only healthy or unhealthy state", async () => {
  let healthy = true;
  const app = createSecurityRouter(
    createOperationalRoutes({
      healthPath: "/_health",
      isHealthy: () => healthy,
    }),
    { mode: "test" },
  );
  const available = await app.fetch(new Request("https://api.test/_health"));
  assert.equal(available.status, 200);
  assert.deepEqual(await json(available), { status: "healthy" });
  healthy = false;
  const unavailable = await app.fetch(new Request("https://api.test/_health"));
  assert.equal(unavailable.status, 503);
  const unavailableBody = await json(unavailable);
  assert.deepEqual(unavailableBody, { status: "unhealthy" });
  assert.doesNotMatch(JSON.stringify(unavailableBody), /config|secret/i);
});

test("AC-F012-008 · readiness is conditional, concurrent, sorted, and bounded", async () => {
  assert.equal(
    createOperationalRoutes({ healthPath: "/_health" }).length,
    1,
  );
  let databaseReady = false;
  const starts: string[] = [];
  const routes = createOperationalRoutes({
    healthPath: "/_health",
    readinessPath: "/_ready",
    readiness: [
      {
        name: "queue",
        timeoutMs: 50,
        check: async () => {
          starts.push("queue");
          await Promise.resolve();
          return true;
        },
      },
      {
        name: "database",
        timeoutMs: 50,
        check: async () => {
          starts.push("database");
          await Promise.resolve();
          return databaseReady;
        },
      },
    ],
  });
  const app = createSecurityRouter(routes, { mode: "test" });
  const notReady = await app.fetch(new Request("https://api.test/_ready"));
  assert.equal(notReady.status, 503);
  assert.deepEqual(starts.sort(), ["database", "queue"]);
  assert.deepEqual(await json(notReady), {
    status: "not-ready",
    checks: [
      { name: "database", ready: false },
      { name: "queue", ready: true },
    ],
  });
  databaseReady = true;
  assert.equal(
    (await app.fetch(new Request("https://api.test/_ready"))).status,
    200,
  );

  let aborted = false;
  const timeoutApp = createSecurityRouter(
    createOperationalRoutes({
      healthPath: "/_health",
      readinessPath: "/_ready",
      readiness: [{
        name: "hung-service",
        timeoutMs: 5,
        check: (signal) =>
          new Promise((resolve) => {
            signal.addEventListener("abort", () => {
              aborted = true;
              resolve(false);
            });
          }),
      }],
    }),
    { mode: "test" },
  );
  const timedOut = await timeoutApp.fetch(
    new Request("https://api.test/_ready"),
  );
  assert.equal(timedOut.status, 503);
  assert.equal(aborted, true);
});

test("AC-F012-009 · normalized metadata exposes no resolved values", async () => {
  const resolved = await resolveConfiguration(baseDefinition(), {
    mode: "production",
    environment: { PORT: "443", DATABASE_URL: "metadata-secret" },
  });
  assert.deepEqual(Object.keys(resolved.metadata).sort(), ["keys", "mode"]);
  for (const item of resolved.metadata.keys) {
    assert.deepEqual(Object.keys(item).sort(), [
      "name",
      "present",
      "sensitive",
      "source",
    ]);
  }
  assert.doesNotMatch(JSON.stringify(resolved.metadata), /443|metadata-secret/);
});
