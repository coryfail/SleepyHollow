import { isAbsolute, normalize, sep } from "node:path";

import { selectAffectedTests } from "../../core/testing/mod.ts";
import type {
  RequestedTestScope,
  TestCommandDiagnostic,
  TestCommandInventory,
  TestCommandPlan,
  TestIsolationGroup,
} from "./types.ts";

const stableId = /^[A-Za-z][A-Za-z0-9._-]*$/;

function sorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

function diagnostic(
  code: string,
  severity: "warning" | "error",
  summary: string,
  correction: string,
  requirementId?: string,
): TestCommandDiagnostic {
  return {
    code,
    severity,
    summary,
    correction,
    ...(requirementId ? { requirementId } : {}),
  };
}

function safePath(path: string): boolean {
  const portable = path.split(sep).join("/");
  const normalized = normalize(path).split(sep).join("/");
  return !isAbsolute(path) && portable !== "" && portable !== ".." &&
    !portable.startsWith("../") && normalized === portable &&
    !portable.includes("\0");
}

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function plan(
  inventory: TestCommandInventory,
  requestedScope: RequestedTestScope,
): TestCommandPlan {
  const diagnostics: TestCommandDiagnostic[] = [];
  const requirements = new Map<string, number>();
  for (const requirement of inventory.requirements) {
    requirements.set(
      requirement.id,
      (requirements.get(requirement.id) ?? 0) + 1,
    );
  }
  const testIds = new Map<string, number>();
  const names = new Map<string, number>();
  for (const test of inventory.manifest.tests) {
    testIds.set(test.id, (testIds.get(test.id) ?? 0) + 1);
    names.set(test.registeredName, (names.get(test.registeredName) ?? 0) + 1);
    if (!safePath(test.sourcePath)) {
      diagnostics.push(diagnostic(
        "SH_TEST_SOURCE_UNSAFE",
        "error",
        `Test ${test.id} has an unsafe source path.`,
        "Use one normalized project-relative test source path.",
        test.requirementId,
      ));
    }
  }
  for (const [id, count] of requirements) {
    if (count > 1) {
      diagnostics.push(diagnostic(
        "SH_TEST_REQUIREMENT_DUPLICATE",
        requestedScope.kind === "full" ? "error" : "warning",
        `Requirement ${id} is duplicated in the test inventory.`,
        "Resolve requirement identity; the complete suite was selected.",
        id,
      ));
    }
  }
  for (const [id, count] of testIds) {
    if (count > 1) {
      diagnostics.push(diagnostic(
        "SH_TEST_ID_DUPLICATE",
        "error",
        `Test ${id} is duplicated in the manifest.`,
        "Give every governed test one stable unique ID.",
      ));
    }
  }
  for (const [name, count] of names) {
    if (count > 1) {
      diagnostics.push(diagnostic(
        "SH_TEST_NAME_DUPLICATE",
        "error",
        `Registered test name ${name} is duplicated.`,
        "Give every selected native test one unique registered name.",
      ));
    }
  }

  let targets: string[] = [];
  let escalate = requestedScope.kind === "full";
  if (requestedScope.kind === "requirement") {
    targets = [requestedScope.requirementId];
    if (!requirements.has(requestedScope.requirementId)) escalate = true;
  } else if (requestedScope.kind === "route") {
    const owners = inventory.routes.filter((route) =>
      route.method.toUpperCase() === requestedScope.method &&
      route.path === requestedScope.path
    ).map((route) => route.requirementId);
    if (owners.length === 1) targets = [owners[0]];
    else escalate = true;
  }

  const selection = requestedScope.kind === "full"
    ? undefined
    : selectAffectedTests({
      targets,
      requirements: inventory.dependencyGraph,
      tests: inventory.manifest.tests,
      hasUnownedSharedChange: inventory.hasUnownedSharedChange || escalate,
    });
  if (selection?.mode === "full") escalate = true;
  for (const item of selection?.diagnostics ?? []) {
    diagnostics.push(diagnostic(
      item.code,
      "warning",
      item.message,
      item.correction,
      item.subject,
    ));
  }
  if (requestedScope.kind !== "full" && escalate) {
    diagnostics.push(diagnostic(
      "SH_TEST_SCOPE_ESCALATED",
      "warning",
      "Targeted scope could not be proven complete; the full suite was selected.",
      "Resolve ownership and dependency diagnostics before relying on targeting.",
      targets[0],
    ));
  }
  const effectiveScope = requestedScope.kind !== "full" && !escalate
    ? "targeted"
    : "full";
  const selectedRequirements = effectiveScope === "targeted"
    ? [...selection!.requirementIds]
    : sorted(inventory.requirements.map((requirement) => requirement.id));
  const selectedTests = effectiveScope === "targeted"
    ? [...selection!.testIds]
    : sorted(inventory.manifest.tests.map((test) => test.id));
  if (selectedTests.length === 0) {
    const governedExists = inventory.manifest.tests.length > 0;
    if (requestedScope.kind === "full" && !governedExists) {
      diagnostics.push(diagnostic(
        "SH_TEST_NO_GOVERNED_TESTS",
        "warning",
        "This project declares no governed tests yet.",
        "Approve an endpoint requirement and map its criteria to tests to begin.",
      ));
    } else {
      diagnostics.push(diagnostic(
        "SH_TEST_SELECTION_EMPTY",
        "error",
        `The selected scope contains no governed tests: ${
          requestedScope.kind === "requirement"
            ? requestedScope.requirementId
            : requestedScope.kind === "route"
            ? `${requestedScope.method} ${requestedScope.path}`
            : "full scope"
        }.`,
        "Register mapped tests or correct the selected requirement or route.",
      ));
    }
  }

  const isolation = new Map<string, string[]>();
  for (const item of inventory.isolation) {
    if (!testIds.has(item.testId)) {
      diagnostics.push({
        code: "SH_TEST_ISOLATION_UNKNOWN",
        severity: "error",
        summary: `Isolation policy names unknown test ${item.testId}.`,
        correction:
          "Remove stale policy metadata or register the governed test.",
        testId: item.testId,
      });
    }
    const current = isolation.get(item.testId) ?? [];
    current.push(item.policy);
    isolation.set(item.testId, current);
  }
  const groups = new Map<
    string,
    { kind: "isolated" | "shared"; tests: string[] }
  >();
  for (const testId of selectedTests) {
    const policies = isolation.get(testId) ?? [];
    if (policies.length === 0) {
      diagnostics.push({
        code: "SH_TEST_ISOLATION_MISSING",
        severity: "error",
        summary: `Test ${testId} has no isolation policy.`,
        correction: "Declare isolated or one stable shared-fixture policy.",
        testId,
      });
      continue;
    }
    if (policies.length !== 1) {
      diagnostics.push({
        code: "SH_TEST_ISOLATION_CONFLICT",
        severity: "error",
        summary: `Test ${testId} has conflicting isolation policies.`,
        correction: "Declare exactly one isolation policy per test.",
        testId,
      });
      continue;
    }
    const policy = policies[0];
    if (policy === "isolated") {
      if (groups.has(testId)) {
        diagnostics.push({
          code: "SH_TEST_ISOLATION_CONFLICT",
          severity: "error",
          summary:
            `Isolated test ${testId} conflicts with a shared fixture identity.`,
          correction:
            "Use distinct stable identities for tests and shared fixtures.",
          testId,
        });
        continue;
      }
      groups.set(testId, { kind: "isolated", tests: [testId] });
      continue;
    }
    const fixture = policy.match(/^shared-fixture:([A-Za-z][A-Za-z0-9._-]*)$/)
      ?.[1];
    if (!fixture || !stableId.test(fixture)) {
      diagnostics.push({
        code: "SH_TEST_ISOLATION_INVALID",
        severity: "error",
        summary: `Test ${testId} has an invalid shared fixture identity.`,
        correction: "Use shared-fixture:<stable-id> or isolated.",
        testId,
      });
      continue;
    }
    const current = groups.get(fixture) ??
      { kind: "shared" as const, tests: [] };
    if (current.kind !== "shared") {
      diagnostics.push({
        code: "SH_TEST_ISOLATION_CONFLICT",
        severity: "error",
        summary: `Fixture ${fixture} conflicts with an isolated test identity.`,
        correction:
          "Use distinct stable identities for tests and shared fixtures.",
        testId,
      });
      continue;
    }
    current.tests.push(testId);
    groups.set(fixture, current);
  }
  const isolationGroups: TestIsolationGroup[] = [...groups].map((
    [id, group],
  ) => ({
    id,
    kind: group.kind,
    testIds: sorted(group.tests),
  })).sort((left, right) => left.id.localeCompare(right.id));

  const selectedEntries = inventory.manifest.tests.filter((test) =>
    selectedTests.includes(test.id)
  );
  const registeredNames = sorted(
    selectedEntries.map((test) => test.registeredName),
  );
  const filter = effectiveScope === "targeted"
    ? `^(?:${registeredNames.map(escaped).join("|")})$`
    : null;
  if (filter && filter.length > 32 * 1024) {
    diagnostics.push(diagnostic(
      "SH_TEST_FILTER_TOO_LARGE",
      "error",
      "The exact targeted native-test filter exceeds the bounded command size.",
      "Run the full suite or split the governed component into smaller targets.",
    ));
  }
  return Object.freeze({
    mode: "test",
    requestedScope,
    effectiveScope,
    selectedRequirements: Object.freeze(selectedRequirements),
    selectedTests: Object.freeze(selectedTests),
    files: Object.freeze(
      sorted(selectedEntries.map((test) => test.sourcePath)),
    ),
    registeredNames: Object.freeze(registeredNames),
    filter,
    isolationGroups: Object.freeze(isolationGroups),
    diagnostics: Object.freeze(diagnostics),
  });
}
