import { platform } from "#platform";
import assert from "assert/strict";
import { createHash } from "crypto";
import { join } from "path";

import { createTestApplication } from "../../core/testing/mod.ts";
import {
  createNodeTestInvocation,
  planTestRun,
  type RawTestEvent,
  runTestCommand,
  type TestCommandDiagnostic,
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

test("AC-F016-001 · full tests run natively in isolated test mode", async () => {
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
  const invocation = createNodeTestInvocation(observed!, {
    projectRoot: "/project",
    nodeExecutable: "/bin/node",
  });
  assert.equal(invocation.command, "/bin/node");
  assert.equal(invocation.cwd, "/project");
  assert.equal(invocation.env.SLEEPY_HOLLOW_MODE, "test");
  assert.deepEqual(invocation.args.slice(0, 3), [
    "./node_modules/vitest/vitest.mjs",
    "run",
    "--reporter=tap-flat",
  ]);
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

test("AC-NRF-008 · Node test runs use the Vitest invocation without runtime permission flags", () => {
  const plan = planTestRun(inventory(), { kind: "full" });
  const invocation = createNodeTestInvocation(plan, {
    projectRoot: "/project",
    nodeExecutable: "/bin/node",
  });
  assert.ok(!invocation.args.some((argument) => argument.startsWith("--allow-")));
});

test("AC-F016-002 · targets close dependencies without unrelated tests", async () => {
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

test("AC-F016-003 · failures retain mapped identity and bounded evidence", async () => {
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

test("AC-F016-004 · human output groups every status and criterion total", async () => {
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

test("AC-F016-005 · JSON is stable, deterministic, mapped, and redacted", async () => {
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

test("AC-F016-006 · isolation policies prevent accidental shared state", async () => {
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
  first.database.client.exec("CREATE TABLE state (value TEXT NOT NULL)");
  first.database.client.prepare("INSERT INTO state (value) VALUES (?)").run("first");
  await first.close();
  const second = await createTestApplication({
    create: () => ({ fetch: () => Response.json({ ok: true }) }),
  });
  assert.throws(() => second.database.client.prepare("SELECT value FROM state").get(), /no such table/);
  await second.close();
});

test("AC-F016-007 · passing tests cannot mutate verification state", async () => {
  const directory = await platform.makeTempDir({
    prefix: "sleepy-hollow-test-command-",
  });
  try {
    const requirementPath = join(directory, "feature.req.md");
    await platform.writeTextFile(
      requirementPath,
      "---\nstatus: approved\n---\n\n# Requirement\n",
    );
    const before = createHash("sha256").update(
      await platform.readFile(requirementPath),
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
      await platform.readFile(requirementPath),
    ).digest("hex");
    assert.equal(after, before);
    assert.equal(JSON.parse(stdout[0]).verificationStateChanged, false);
    assert.match(await platform.readTextFile(requirementPath), /status: approved/);
  } finally {
    await platform.remove(directory, { recursive: true });
  }
});

async function captureHarness(options: {
  readonly writeArtifact: boolean;
}): Promise<{
  readonly root: string;
  readonly stdout: string[];
  readonly stderr: string[];
  readonly code: number;
  readonly capturePath: string | undefined;
}> {
  const root = await platform.makeTempDir({ prefix: "sh-test-capture-" });
  await platform.mkdir(join(root, "generated"), { recursive: true });
  const stdout: string[] = [];
  const stderr: string[] = [];
  let capturePath: string | undefined;
  const code = await runTestCommand(
    ["--json"],
    {
      cwd: root,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    },
    () => inventory(),
    async (_plan, source) => {
      capturePath = source.captureArtifactPath;
      if (options.writeArtifact && capturePath) {
        await platform.writeTextFile(
          capturePath,
          JSON.stringify({
            schema: "sleepy-hollow-capture/v1",
            runner: "vitest",
            revision: "r1",
            requests: [],
            dataOperations: [],
            uncapturedRoutes: [],
          }),
        );
      }
      return {
        status: "passed" as const,
        durationMs: 1,
        events: [],
        evidence: "runner evidence",
      };
    },
  );
  return { root, stdout, stderr, code, capturePath };
}

test("AC-F016-008 · a run that executes tests persists a capture artifact", async () => {
  const harness = await captureHarness({ writeArtifact: true });
  assert.ok(harness.capturePath);
  assert.ok(harness.capturePath.endsWith("generated/capture.json"));
  const written = await platform.readTextFile(harness.capturePath);
  assert.equal(JSON.parse(written).schema, "sleepy-hollow-capture/v1");
  await platform.remove(harness.root, { recursive: true });
});

test("AC-F016-009 · enabling capture changes neither execution nor results", async () => {
  const persisted = await captureHarness({ writeArtifact: true });
  const absent = await captureHarness({ writeArtifact: false });

  const read = (h: typeof persisted) =>
    JSON.parse((h.code === 0 ? h.stdout[0] : h.stderr[0]) ?? "{}");
  const withArtifact = read(persisted);
  const withoutArtifact = read(absent);

  assert.equal(persisted.code, absent.code);
  assert.equal(withArtifact.ok, withoutArtifact.ok);
  assert.deepEqual(withArtifact.selectedTests, withoutArtifact.selectedTests);
  assert.deepEqual(withArtifact.criteria, withoutArtifact.criteria);
  assert.deepEqual(
    { ...withArtifact.summary, durationMs: 0 },
    { ...withoutArtifact.summary, durationMs: 0 },
  );

  const extra = (withoutArtifact.diagnostics ?? []).filter((item: {
    code: string;
  }) =>
    !(withArtifact.diagnostics ?? []).some((k: { code: string }) =>
      k.code === item.code
    )
  );
  assert.deepEqual(extra.map((item: { code: string }) => item.code), [
    "SH_TEST_CAPTURE_NOT_PERSISTED",
  ]);

  await platform.remove(persisted.root, { recursive: true });
  await platform.remove(absent.root, { recursive: true });
});

test("AC-F016-010 · a missing capture artifact is reported as a diagnostic", async () => {
  const harness = await captureHarness({ writeArtifact: false });
  const result = JSON.parse(
    (harness.code === 0 ? harness.stdout[0] : harness.stderr[0]) ?? "{}",
  );
  const diagnostics = (result.diagnostics ?? []) as { code: string }[];
  assert.ok(
    diagnostics.some((item) => item.code === "SH_TEST_CAPTURE_NOT_PERSISTED"),
    `expected capture diagnostic, saw ${JSON.stringify(diagnostics)}`,
  );
  await platform.remove(harness.root, { recursive: true });
});

function emptyInventory(): TestCommandInventory {
  return {
    projectRootDisplay: "/project",
    requirements: [],
    dependencyGraph: [],
    routes: [],
    manifest: { schema: "sleepy-hollow-test-manifest/v1", tests: [] },
    isolation: [],
  };
}

test("AC-F016-011 · a full-scope run with nothing governed reports success", async () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runTestCommand(
    ["--json"],
    {
      cwd: "/project",
      stdout: (v) => stdout.push(v),
      stderr: (v) => stderr.push(v),
    },
    () => emptyInventory(),
    () => {
      throw new Error("the runner must not be invoked with no governed tests");
    },
  );
  assert.equal(code, 0, `a new project must exit zero, saw ${stderr[0] ?? ""}`);
  const result = JSON.parse(stdout[0] ?? "{}");
  assert.equal(result.ok, true);

  const planned = planTestRun(emptyInventory(), { kind: "full" });
  assert.ok(
    !planned.diagnostics.some((item: TestCommandDiagnostic) =>
      item.severity === "error"
    ),
    `a new project must not fail: ${JSON.stringify(planned.diagnostics)}`,
  );
  assert.ok(
    planned.diagnostics.some((item: TestCommandDiagnostic) =>
      item.code === "SH_TEST_NO_GOVERNED_TESTS"
    ),
    "the run must state that nothing governed exists yet",
  );
});

test("AC-F016-012 · a targeted scope matching nothing still fails", () => {
  const planned = planTestRun(emptyInventory(), {
    kind: "requirement",
    requirementId: "EP-DOES-NOT-EXIST",
  });
  const failure = planned.diagnostics.find((item: TestCommandDiagnostic) =>
    item.severity === "error" && item.code === "SH_TEST_SELECTION_EMPTY"
  );
  assert.ok(failure, "an unmatched target must fail");
  assert.match(JSON.stringify(failure), /EP-DOES-NOT-EXIST/);
});
