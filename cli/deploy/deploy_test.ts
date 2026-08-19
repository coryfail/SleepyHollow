import assert from "assert/strict";

import type { CheckResult } from "../check/mod.ts";
import {
  buildDeployPlan,
  createFlyAdapter,
  DEPLOY_TARGET_KINDS,
  resolveDeployToken,
  runDeployment,
} from "./mod.ts";
import type { DeployAdapter, DeployInventory, SmokeTestDefinition } from "./types.ts";

const TOKEN = "fly_test_token";
const smokeTests: readonly SmokeTestDefinition[] = [{
  id: "SMOKE-HEALTH", description: "service answers a read", method: "GET",
  path: "/bookmarks", expectedStatus: 200, required: true,
}];

function check(ok = true): CheckResult {
  return {
    schema: "sleepy-hollow-check-result/v1", ok, command: "check", projectRoot: ".",
    requestedScope: { kind: "full" }, effectiveScope: "full", selectedRequirements: [], selectedTests: [], checks: [],
    diagnostics: ok ? [] : [{ code: "SH_CHECK_TEST_FAILED", severity: "error", phase: "traceability", summary: "test failed", location: {}, evidence: {}, correction: "repair" }],
    summary: { passed: 1, failed: ok ? 0 : 1, skipped: 0, errors: 0, warnings: 0 },
  };
}

function inventory(overrides: Partial<DeployInventory> = {}): DeployInventory {
  return {
    projectRootDisplay: ".", target: { kind: "fly", project: "bookmarks" }, revision: "96670b3",
    verification: check(), environmentKeys: ["DATABASE_URL"], deployedEnvironmentKeys: [], contractChanges: [],
    openApiPath: "generated/openapi.json", documentationPath: "generated/docs.html", smokeTests,
    firstExternalDeployment: false, ...overrides,
  };
}

function adapter(): DeployAdapter & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    upload: ({ target, revision, token }) => {
      assert.equal(token, TOKEN); calls.push(`upload:${target.project}:${revision}`);
      return { url: "https://bookmarks.fly.dev", revision };
    },
    health: () => { calls.push("health"); return { id: "HEALTH", status: "passed", observedStatus: 200, evidence: "GET / returned 200" }; },
    smoke: ({ test }) => { calls.push(`smoke:${test.id}`); return { id: test.id, status: "passed", observedStatus: 200, evidence: "passed" }; },
  };
}

const request = (overrides: Partial<Parameters<typeof runDeployment>[0]> = {}) =>
  ({ inventory: inventory(), token: TOKEN, confirmed: true, confirmationSource: "owner", ...overrides });
const now = () => "2026-08-19T00:00:00Z";

test("AC-F013-001 · failed verification blocks a Fly upload", async () => {
  const deployed = adapter();
  const result = await runDeployment(request({ inventory: inventory({ verification: check(false) }) }), deployed, now);
  assert.equal(result.outcome, "blocked");
  assert.deepEqual(deployed.calls, []);
  assert.ok(result.diagnostics.some((item) => item.code === "SH_DEPLOY_VERIFICATION_FAILED"));
});

test("AC-F013-002 · the plan contains target names and never environment values", () => {
  const plan = buildDeployPlan(inventory());
  assert.equal(plan.target.kind, "fly");
  assert.ok(JSON.stringify(plan).includes("DATABASE_URL"));
  assert.ok(!JSON.stringify(plan).includes(TOKEN));
});

test("AC-F013-003 · a first external deployment requires confirmation", async () => {
  const deployed = adapter();
  const result = await runDeployment(request({ inventory: inventory({ firstExternalDeployment: true }), confirmed: false, confirmationSource: undefined }), deployed, now);
  assert.equal(result.outcome, "confirmation-required");
  assert.deepEqual(deployed.calls, []);
});

test("AC-F013-005 · a Fly upload is followed by health and smoke checks", async () => {
  const deployed = adapter();
  const result = await runDeployment(request(), deployed, now);
  assert.equal(result.ok, true);
  assert.equal(result.url, "https://bookmarks.fly.dev");
  assert.deepEqual(deployed.calls, ["upload:bookmarks:96670b3", "health", "smoke:SMOKE-HEALTH"]);
});

test("AC-F013-008 · unchanged verified revisions do not upload", async () => {
  const deployed = adapter();
  const result = await runDeployment(request({ inventory: inventory({ deployedRevision: "96670b3", deployedEnvironmentKeys: ["DATABASE_URL"] }) }), deployed, now);
  assert.equal(result.outcome, "unchanged");
  assert.deepEqual(deployed.calls, []);
});

test("AC-F013-009 · Fly is the registered production target", () => {
  assert.deepEqual(DEPLOY_TARGET_KINDS, ["fly"]);
});

test("AC-F013-010 · missing Fly tokens fail before a command is invoked", () => {
  assert.throws(() => resolveDeployToken({}), /FLY_API_TOKEN/);
  assert.throws(() => resolveDeployToken({ FLY_API_TOKEN: "has whitespace" }), /single token/);
});

test("AC-F013-011 · the Fly adapter passes its token only through child environment", async () => {
  let command: readonly string[] | undefined;
  let environment: Readonly<Record<string, string>> | undefined;
  const deployed = createFlyAdapter({
    runner: { run: async (input) => { command = input.command; environment = input.environment; return { stdout: "revision-1", stderr: "" }; } },
    transport: async () => new Response(null, { status: 200 }),
  });
  const upload = await deployed.upload({ target: { kind: "fly", project: "bookmarks" }, revision: "source", token: TOKEN });
  assert.deepEqual(command, ["flyctl", "deploy", "--app", "bookmarks", "--remote-only"]);
  assert.deepEqual(environment, { FLY_API_TOKEN: TOKEN });
  assert.equal(upload.url, "https://bookmarks.fly.dev");
});

test("AC-F013-013 · Fly health and smoke failures remain failed deployment evidence", async () => {
  const deployed = createFlyAdapter({
    runner: { run: async () => ({ stdout: "", stderr: "" }) },
    transport: async () => new Response("unavailable", { status: 503 }),
  });
  assert.equal((await deployed.health({ url: "https://bookmarks.fly.dev" })).status, "failed");
  assert.equal((await deployed.smoke({ url: "https://bookmarks.fly.dev", test: smokeTests[0] })).status, "failed");
});
