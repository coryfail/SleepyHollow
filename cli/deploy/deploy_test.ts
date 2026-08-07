import assert from "node:assert/strict";

import type { CheckResult } from "../check/mod.ts";
import {
  buildDeployPlan,
  DEPLOY_TARGET_KINDS,
  exitCodeForDeploy,
  renderHumanDeployResult,
  renderJsonDeployResult,
  runDeployment,
} from "./mod.ts";
import type {
  DeployAdapter,
  DeployInventory,
  SmokeTestDefinition,
  SmokeTestOutcome,
} from "./types.ts";

const TOKEN = "ddp_supersecrettokenvalue";

const smokeTests: readonly SmokeTestDefinition[] = [
  {
    id: "SMOKE-HEALTH",
    description: "service answers a representative read",
    method: "GET",
    path: "/bookmarks",
    expectedStatus: 200,
    required: true,
  },
];

function checkResult(ok: boolean): CheckResult {
  return {
    schema: "sleepy-hollow-check-result/v1",
    ok,
    command: "check",
    projectRoot: "./bookmarks",
    requestedScope: { kind: "full" },
    effectiveScope: "full",
    selectedRequirements: ["EP-BOOKMARKS-CREATE"],
    selectedTests: ["T-001"],
    checks: [],
    diagnostics: ok ? [] : [{
      code: "SH_CHECK_TEST_FAILED",
      severity: "error",
      phase: "traceability",
      summary: "A mapped acceptance test failed.",
      location: { requirementId: "EP-BOOKMARKS-CREATE" },
      evidence: { test: "T-001" },
      correction: "Repair the implementation and rerun hollow check.",
    }],
    summary: {
      passed: ok ? 11 : 10,
      failed: ok ? 0 : 1,
      skipped: 0,
      errors: ok ? 0 : 1,
      warnings: 0,
    },
  };
}

function inventory(
  overrides: Partial<DeployInventory> = {},
): DeployInventory {
  return {
    projectRootDisplay: "./bookmarks",
    target: { kind: "deno-deploy", project: "bookmarks" },
    revision: "96670b3",
    verification: checkResult(true),
    environmentKeys: ["BOOKMARKS_KV_URL", "BOOKMARKS_SIGNING_KEY"],
    deployedEnvironmentKeys: ["BOOKMARKS_KV_URL"],
    contractChanges: [],
    openApiPath: "generated/openapi.json",
    documentationPath: "generated/docs.html",
    smokeTests,
    firstExternalDeployment: false,
    ...overrides,
  };
}

function recordingAdapter(
  overrides: Partial<{
    health: SmokeTestOutcome;
    smoke: SmokeTestOutcome;
  }> = {},
): DeployAdapter & { readonly calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    upload(options) {
      calls.push(`upload:${options.target.project}:${options.revision}`);
      assert.equal(options.token, TOKEN);
      return { url: "https://bookmarks.deno.dev", revision: options.revision };
    },
    health(_options) {
      calls.push("health");
      return overrides.health ?? {
        id: "HEALTH",
        status: "passed",
        observedStatus: 200,
        evidence: "GET / returned 200",
      };
    },
    smoke(options) {
      calls.push(`smoke:${options.test.id}`);
      return overrides.smoke ?? {
        id: options.test.id,
        status: "passed",
        observedStatus: 200,
        evidence: "GET /bookmarks returned 200",
      };
    },
  };
}

function request(
  overrides: Partial<Parameters<typeof runDeployment>[0]> = {},
) {
  return {
    inventory: inventory(),
    token: TOKEN,
    confirmed: true,
    confirmationSource: "owner approval in session",
    ...overrides,
  };
}

const now = () => "2026-08-07T23:00:00Z";

Deno.test("AC-F013-001 · failed verification blocks upload with check evidence", async () => {
  const adapter = recordingAdapter();
  const result = await runDeployment(
    request({
      inventory: inventory({ verification: checkResult(false) }),
    }),
    adapter,
    now,
  );
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "blocked");
  assert.deepEqual(adapter.calls, []);
  assert.equal(exitCodeForDeploy(result), 1);
  const blocking = result.diagnostics.find((item) =>
    item.code === "SH_DEPLOY_VERIFICATION_FAILED"
  );
  assert.ok(blocking);
  assert.ok(
    blocking.evidence.some((item) => item.includes("SH_CHECK_TEST_FAILED")),
  );
});

Deno.test("AC-F013-002 · the plan names targets and env keys without values", () => {
  const built = buildDeployPlan(inventory({
    deployedRevision: "71b3e4d",
    contractChanges: [],
  }));
  assert.equal(built.target.kind, "deno-deploy");
  assert.equal(built.revision, "96670b3");
  assert.equal(built.deployedRevision, "71b3e4d");
  assert.deepEqual(built.environmentKeyChanges, [
    { key: "BOOKMARKS_SIGNING_KEY", change: "added" },
  ]);
  assert.deepEqual(built.smokeTests.map((test) => test.id), ["SMOKE-HEALTH"]);
  const serialized = JSON.stringify(built);
  assert.ok(!serialized.includes(TOKEN));
  assert.ok(serialized.includes("BOOKMARKS_SIGNING_KEY"));
});

Deno.test("AC-F013-003 · the first external deployment pauses for confirmation", async () => {
  const adapter = recordingAdapter();
  const result = await runDeployment(
    request({
      inventory: inventory({ firstExternalDeployment: true }),
      confirmed: false,
      confirmationSource: undefined,
    }),
    adapter,
    now,
  );
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "confirmation-required");
  assert.equal(result.plan.requiresConfirmation, true);
  assert.deepEqual(adapter.calls, []);
  assert.ok(
    result.diagnostics.some((item) =>
      item.code === "SH_DEPLOY_CONFIRMATION_REQUIRED"
    ),
  );
});

Deno.test("AC-F013-004 · credentials never reach results, output, or diagnostics", async () => {
  const adapter = recordingAdapter();
  const emitted: string[] = [];
  const result = await runDeployment(request(), adapter, now);
  emitted.push(renderHumanDeployResult(result), renderJsonDeployResult(result));
  emitted.push(JSON.stringify(result));
  for (const value of emitted) {
    assert.ok(value.length > 0);
    assert.ok(!value.includes(TOKEN));
    assert.ok(!value.includes("ddp_"));
  }
});

Deno.test("AC-F013-005 · a successful upload runs health and representative smoke tests", async () => {
  const adapter = recordingAdapter();
  const result = await runDeployment(request(), adapter, now);
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "deployed");
  assert.deepEqual(adapter.calls, [
    "upload:bookmarks:96670b3",
    "health",
    "smoke:SMOKE-HEALTH",
  ]);
  assert.equal(result.health?.status, "passed");
  assert.deepEqual(result.smokeResults.map((item) => item.status), ["passed"]);
});

Deno.test("AC-F013-006 · a failed required smoke test is not reported as success", async () => {
  const adapter = recordingAdapter({
    smoke: {
      id: "SMOKE-HEALTH",
      status: "failed",
      observedStatus: 500,
      evidence: "GET /bookmarks returned 500",
    },
  });
  const result = await runDeployment(request(), adapter, now);
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "smoke-failed");
  assert.equal(result.deployedRevision, "96670b3");
  assert.equal(result.url, "https://bookmarks.deno.dev");
  const failure = result.diagnostics.find((item) =>
    item.code === "SH_DEPLOY_SMOKE_FAILED"
  );
  assert.ok(failure);
  assert.ok(failure.evidence.some((item) => item.includes("500")));
});

Deno.test("AC-F013-007 · successful results carry every required location and time", async () => {
  const result = await runDeployment(request(), recordingAdapter(), now);
  assert.equal(result.url, "https://bookmarks.deno.dev");
  assert.equal(result.deployedRevision, "96670b3");
  assert.equal(result.openApiPath, "generated/openapi.json");
  assert.equal(result.documentationPath, "generated/docs.html");
  assert.equal(result.completedAt, "2026-08-07T23:00:00Z");
  const rendered = renderHumanDeployResult(result);
  for (
    const expected of [
      "https://bookmarks.deno.dev",
      "96670b3",
      "generated/openapi.json",
      "generated/docs.html",
      "2026-08-07T23:00:00Z",
    ]
  ) {
    assert.ok(rendered.includes(expected), `human output omits ${expected}`);
  }
  const parsed = JSON.parse(renderJsonDeployResult(result));
  assert.equal(parsed.schema, "sleepy-hollow-deploy-result/v1");
  assert.equal(parsed.url, "https://bookmarks.deno.dev");
  assert.equal(parsed.completedAt, "2026-08-07T23:00:00Z");
});

Deno.test("AC-F013-008 · redeploying an unchanged verified revision does not upload", async () => {
  const adapter = recordingAdapter();
  const result = await runDeployment(
    request({
      inventory: inventory({
        deployedRevision: "96670b3",
        deployedEnvironmentKeys: [
          "BOOKMARKS_KV_URL",
          "BOOKMARKS_SIGNING_KEY",
        ],
      }),
    }),
    adapter,
    now,
  );
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "unchanged");
  assert.equal(result.plan.unchanged, true);
  assert.deepEqual(adapter.calls, []);
  assert.equal(exitCodeForDeploy(result), 0);
});

Deno.test("AC-F013-009 · Deno Deploy is the only supported production target", async () => {
  assert.deepEqual([...DEPLOY_TARGET_KINDS], ["deno-deploy"]);
  const adapter = recordingAdapter();
  const result = await runDeployment(
    request({
      inventory: inventory({
        target: {
          kind: "fly-io" as unknown as "deno-deploy",
          project: "bookmarks",
        },
      }),
    }),
    adapter,
    now,
  );
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "blocked");
  assert.deepEqual(adapter.calls, []);
  assert.ok(
    result.diagnostics.some((item) =>
      item.code === "SH_DEPLOY_TARGET_UNSUPPORTED"
    ),
  );
});
