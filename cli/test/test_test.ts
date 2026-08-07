import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { createTestApplication } from "../../core/testing/mod.ts";
import {
  createDenoTestInvocation,
  type RawTestEvent,
  runTestCommand,
  type TestCommandInventory,
  type TestCommandPlan,
  type TestRunner,
  type TestRunnerResult,
} from "./mod.ts";

function inventory(): TestCommandInventory {
  const requirements = [
    {
      id: "REQ-BASE",
      status: "approved" as const,
      governedContentDigest: "base-digest",
      criteria: [{ id: "AC-BASE-001" }],
      approval: {
        valid: true,
        digest: "base-digest",
        criteria: ["AC-BASE-001"],
      },
    },
    {
      id: "REQ-ITEMS",
      status: "approved" as const,
      governedContentDigest: "items-digest",
      dependsOn: ["REQ-BASE"],
      criteria: [{ id: "AC-ITEMS-001" }],
      approval: {
        valid: true,
        digest: "items-digest",
        criteria: ["AC-ITEMS-001"],
      },
    },
    {
      id: "REQ-OTHER",
      status: "approved" as const,
      governedContentDigest: "other-digest",
      criteria: [{ id: "AC-OTHER-001" }],
      approval: {
        valid: true,
        digest: "other-digest",
        criteria: ["AC-OTHER-001"],
      },
    },
  ];
  const tests = [
    {
      id: "test-base",
      requirementId: "REQ-BASE",
      criteria: ["AC-BASE-001"],
      name: "base behavior",
      registeredName: "AC-BASE-001 · base behavior",
      sourcePath: "tests/base_test.ts",
      sourceDigest: "base-test-digest",
    },
    {
      id: "test-items",
      requirementId: "REQ-ITEMS",
      criteria: ["AC-ITEMS-001"],
      name: "items behavior",
      registeredName: "AC-ITEMS-001 · items behavior",
      sourcePath: "tests/items_test.ts",
      sourceDigest: "items-test-digest",
    },
    {
      id: "test-other",
      requirementId: "REQ-OTHER",
      criteria: ["AC-OTHER-001"],
      name: "other behavior",
      registeredName: "AC-OTHER-001 · other behavior",
      sourcePath: "tests/items_test.ts",
      sourceDigest: "other-test-digest",
    },
  ];
  return {
    projectRootDisplay: ".",
    requirements,
    dependencyGraph: [
      { id: "REQ-BASE", dependsOn: [] },
      { id: "REQ-ITEMS", dependsOn: ["REQ-BASE"] },
      { id: "REQ-OTHER", dependsOn: [] },
    ],
    routes: [{
      method: "GET",
      path: "/items/:id",
      requirementId: "REQ-ITEMS",
    }],
    manifest: {
      schema: "sleepy-hollow-test-manifest/v1",
      tests,
    },
    isolation: tests.map((test) => ({
      testId: test.id,
      policy: "isolated" as const,
    })),
  };
}

function passingEvents(source = inventory()): RawTestEvent[] {
  return source.manifest.tests.map((test, index) => ({
    file: test.sourcePath,
    name: test.registeredName,
    status: "passed",
    durationMs: index + 1,
  }));
}

function runner(
  run: (plan: TestCommandPlan) => TestRunnerResult | Promise<TestRunnerResult>,
): TestRunner {
  return (plan) => run(plan);
}

async function invoke(
  args: readonly string[],
  source = inventory(),
  execute: TestRunner = runner(() => ({
    status: "passed",
    durationMs: 12,
    events: passingEvents(source),
  })),
) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runTestCommand(
    args,
    {
      cwd: "/project",
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    },
    () => source,
    execute,
  );
  return { code, stdout, stderr };
}

Deno.test("AC-F016-001 · full tests run natively in isolated test mode", async () => {
  let observed: TestCommandPlan | undefined;
  const output = await invoke(
    ["--json"],
    inventory(),
    runner((plan) => {
      observed = plan;
      return { status: "passed", durationMs: 12, events: passingEvents() };
    }),
  );
  assert.equal(output.code, 0);
  assert.equal(observed?.mode, "test");
  assert.equal(observed?.effectiveScope, "full");
  assert.deepEqual(observed?.selectedTests, [
    "test-base",
    "test-items",
    "test-other",
  ]);
  const invocation = createDenoTestInvocation(observed!, {
    projectRoot: "/project",
    denoExecutable: "/bin/deno",
    permissions: { read: ["tests"], unstableKv: true },
  });
  assert.equal(invocation.command, "/bin/deno");
  assert.equal(invocation.cwd, "/project");
  assert.equal(invocation.env.SLEEPY_HOLLOW_MODE, "test");
  assert.deepEqual(invocation.args.slice(0, 5), [
    "test",
    "--cached-only",
    "--frozen",
    "--no-prompt",
    "--reporter=tap",
  ]);
  assert.ok(invocation.args.includes("--unstable-kv"));
  assert.ok(invocation.args.includes("tests/base_test.ts"));

  const failed = await invoke(
    ["--json"],
    inventory(),
    runner(() => ({
      status: "failed",
      durationMs: 3,
      events: [{
        file: "tests/base_test.ts",
        name: "AC-BASE-001 · base behavior",
        status: "failed",
        evidence: "expected true but received false",
      }],
    })),
  );
  assert.equal(failed.code, 1);
});

Deno.test("AC-F016-002 · targets close dependencies without unrelated tests", async () => {
  const plans: TestCommandPlan[] = [];
  const execute = runner((plan) => {
    plans.push(plan);
    return {
      status: "passed",
      durationMs: 4,
      events: passingEvents().filter((event) =>
        plan.registeredNames.includes(event.name)
      ),
    };
  });
  assert.equal(
    (await invoke(
      ["--requirement", "REQ-ITEMS", "--json"],
      inventory(),
      execute,
    )).code,
    0,
  );
  assert.equal(
    (await invoke(
      ["--route", "get", "/items/:id", "--json"],
      inventory(),
      execute,
    )).code,
    0,
  );
  for (const plan of plans) {
    assert.equal(plan.effectiveScope, "targeted");
    assert.deepEqual(plan.selectedRequirements, ["REQ-BASE", "REQ-ITEMS"]);
    assert.deepEqual(plan.selectedTests, ["test-base", "test-items"]);
    assert.doesNotMatch(plan.filter ?? "", /other behavior/);
    assert.match(plan.filter ?? "", /^\^\(\?:/);
    assert.match(plan.filter ?? "", /\)\$$/);
  }

  const unsafe = { ...inventory(), hasUnownedSharedChange: true };
  let escalated: TestCommandPlan | undefined;
  const result = await invoke(
    ["--requirement", "REQ-ITEMS", "--json"],
    unsafe,
    runner((plan) => {
      escalated = plan;
      return { status: "passed", durationMs: 5, events: passingEvents() };
    }),
  );
  assert.equal(result.code, 0);
  assert.equal(escalated?.effectiveScope, "full");
  assert.deepEqual(escalated?.selectedTests, [
    "test-base",
    "test-items",
    "test-other",
  ]);
  assert.match(result.stdout[0], /SH_TEST_SCOPE_ESCALATED/);
});

Deno.test("AC-F016-003 · failures retain mapped identity and bounded evidence", async () => {
  const longEvidence = `token=fixture-secret /Users/person/project ${
    "x".repeat(9000)
  }`;
  const output = await invoke(
    ["--json"],
    inventory(),
    runner(() => ({
      status: "failed",
      durationMs: 7,
      events: [{
        file: "tests/items_test.ts",
        name: "AC-ITEMS-001 · items behavior",
        status: "failed",
        durationMs: 6,
        evidence: longEvidence,
      }],
    })),
  );
  assert.equal(output.code, 1);
  const parsed = JSON.parse(output.stderr[0]);
  const failed = parsed.tests.find((test: { id: string }) =>
    test.id === "test-items"
  );
  assert.equal(failed.file, "tests/items_test.ts");
  assert.equal(failed.name, "AC-ITEMS-001 · items behavior");
  assert.deepEqual(failed.criteria, ["AC-ITEMS-001"]);
  assert.equal(failed.status, "failed");
  assert.ok(failed.evidence.length <= 8192);
  assert.doesNotMatch(failed.evidence, /fixture-secret|\/Users\//);
  assert.ok(
    parsed.diagnostics.some((item: { code: string; testId?: string }) =>
      item.code === "SH_TEST_FAILED" && item.testId === "test-items"
    ),
  );
});

Deno.test("AC-F016-004 · human output groups every status and criterion total", async () => {
  const output = await invoke(
    [],
    inventory(),
    runner(() => ({
      status: "failed",
      durationMs: 9,
      events: [
        {
          file: "tests/base_test.ts",
          name: "AC-BASE-001 · base behavior",
          status: "passed",
          durationMs: 1,
        },
        {
          file: "tests/items_test.ts",
          name: "AC-ITEMS-001 · items behavior",
          status: "failed",
          evidence: "fixture failure",
        },
        {
          file: "tests/items_test.ts",
          name: "AC-OTHER-001 · other behavior",
          status: "skipped",
        },
        {
          file: "tests/items_test.ts",
          name: "unregistered behavior",
          status: "passed",
        },
      ],
    })),
  );
  assert.equal(output.code, 1);
  const human = output.stderr[0];
  assert.match(human, /Passed \(1\)/);
  assert.match(human, /Failed \(1\)/);
  assert.match(human, /Skipped \(1\)/);
  assert.match(human, /Unmapped \(1\)/);
  assert.match(human, /Criteria: 1 passing, 1 failing, 1 skipped, 0 unmapped/);
});

Deno.test("AC-F016-005 · JSON is stable, deterministic, mapped, and redacted", async () => {
  const source = inventory();
  const output = await invoke(
    ["--json"],
    source,
    runner(() => ({
      status: "passed",
      durationMs: 23,
      events: [...passingEvents(source)].reverse(),
      evidence: "credential=do-not-render",
    })),
  );
  assert.equal(output.code, 0);
  const parsed = JSON.parse(output.stdout[0]);
  assert.equal(parsed.schema, "sleepy-hollow-test-result/v1");
  assert.deepEqual(Object.keys(parsed).sort(), [
    "command",
    "criteria",
    "diagnostics",
    "effectiveScope",
    "ok",
    "requestedScope",
    "schema",
    "selectedRequirements",
    "selectedTests",
    "summary",
    "tests",
    "verificationStateChanged",
  ]);
  assert.deepEqual(parsed.tests.map((test: { id: string }) => test.id), [
    "test-base",
    "test-items",
    "test-other",
  ]);
  assert.equal(parsed.summary.durationMs, 23);
  assert.deepEqual(
    parsed.criteria.map((item: { criterionId: string }) => item.criterionId),
    ["AC-BASE-001", "AC-ITEMS-001", "AC-OTHER-001"],
  );
  assert.doesNotMatch(JSON.stringify(parsed), /do-not-render|\/Users\//);
});

Deno.test("AC-F016-006 · isolation policies prevent accidental shared state", async () => {
  const missing = {
    ...inventory(),
    isolation: inventory().isolation.slice(1),
  };
  let calls = 0;
  const rejected = await invoke(
    ["--json"],
    missing,
    runner(() => {
      calls++;
      return { status: "passed", durationMs: 0, events: [] };
    }),
  );
  assert.equal(rejected.code, 1);
  assert.equal(calls, 0);
  assert.match(rejected.stderr[0], /SH_TEST_ISOLATION_MISSING/);

  const shared = {
    ...inventory(),
    isolation: [
      { testId: "test-base", policy: "shared-fixture:items" as const },
      { testId: "test-items", policy: "shared-fixture:items" as const },
      { testId: "test-other", policy: "isolated" as const },
    ],
  };
  let plan: TestCommandPlan | undefined;
  assert.equal(
    (await invoke(
      ["--json"],
      shared,
      runner((value) => {
        plan = value;
        return { status: "passed", durationMs: 3, events: passingEvents() };
      }),
    )).code,
    0,
  );
  assert.deepEqual(plan?.isolationGroups, [
    { id: "items", kind: "shared", testIds: ["test-base", "test-items"] },
    { id: "test-other", kind: "isolated", testIds: ["test-other"] },
  ]);

  const first = await createTestApplication({
    create: () => ({ fetch: () => Response.json({ ok: true }) }),
  });
  await first.kv.set(["state"], "first");
  await first.close();
  const second = await createTestApplication({
    create: () => ({ fetch: () => Response.json({ ok: true }) }),
  });
  assert.equal((await second.kv.get(["state"])).value, null);
  await second.close();
});

Deno.test("AC-F016-007 · passing tests cannot mutate verification state", async () => {
  const directory = await Deno.makeTempDir({
    prefix: "sleepy-hollow-test-command-",
  });
  try {
    const requirementPath = join(directory, "requirements.md");
    await Deno.writeTextFile(
      requirementPath,
      "---\nstatus: approved\n---\n\n# Requirement\n",
    );
    const before = createHash("sha256").update(
      await Deno.readFile(requirementPath),
    ).digest("hex");
    const stdout: string[] = [];
    const code = await runTestCommand(
      ["--json"],
      {
        cwd: directory,
        stdout: (value) => stdout.push(value),
        stderr: () => undefined,
      },
      () => inventory(),
      runner(() => ({
        status: "passed",
        durationMs: 4,
        events: passingEvents(),
      })),
    );
    assert.equal(code, 0);
    const after = createHash("sha256").update(
      await Deno.readFile(requirementPath),
    ).digest("hex");
    assert.equal(after, before);
    assert.equal(JSON.parse(stdout[0]).verificationStateChanged, false);
    assert.match(await Deno.readTextFile(requirementPath), /status: approved/);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
