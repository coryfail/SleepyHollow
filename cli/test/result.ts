import { platform } from "#platform";
import { createHash } from "crypto";

import { createTraceabilityReport } from "../../core/testing/mod.ts";
import type {
  RawTestEvent,
  TestCommandDiagnostic,
  TestCommandInventory,
  TestCommandPlan,
  TestCommandResult,
  TestCommandTestResult,
  TestRunnerResult,
} from "./types.ts";

const MAX_EVIDENCE = 8 * 1024;

function safe(value: string): string {
  return value
    .replace(
      /((?:api[-_]?key|token|secret|password|credential|authorization)\s*[=:]\s*)\S+/gi,
      "$1<redacted>",
    )
    .replace(
      /(?:[A-Za-z]:\\|\/(?:Users|home|private|tmp)\/)[^\s,;]+/g,
      "<host-path>",
    )
    .slice(0, MAX_EVIDENCE);
}

function safeName(value: string): string {
  return safe(value).slice(0, 500);
}

function safeFile(value: string): string {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)
    ? "<host-path>"
    : safeName(value);
}

function duration(value: number | undefined): number | null {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

function eventKey(event: Pick<RawTestEvent, "file" | "name">): string {
  return `${event.file}\0${event.name}`;
}

function unmappedId(event: RawTestEvent): string {
  return `unmapped:${
    createHash("sha256").update(eventKey(event)).digest("hex").slice(0, 12)
  }`;
}

export function normalizeRunnerResult(
  plan: TestCommandPlan,
  inventory: TestCommandInventory,
  runner: TestRunnerResult,
): TestCommandResult {
  const diagnostics: TestCommandDiagnostic[] = [...plan.diagnostics];
  const selectedEntries = inventory.manifest.tests.filter((test) =>
    plan.selectedTests.includes(test.id)
  );
  const byEvent = new Map(selectedEntries.map((test) => [
    eventKey({ file: test.sourcePath, name: test.registeredName }),
    test,
  ]));
  const seen = new Set<string>();
  const tests: TestCommandTestResult[] = [];
  const orderedEvents = [...runner.events].sort((left, right) =>
    left.file.localeCompare(right.file) || left.name.localeCompare(right.name)
  );
  for (const event of orderedEvents) {
    const mapped = byEvent.get(eventKey(event));
    if (!mapped) {
      const evidence = event.evidence ? safe(event.evidence) : undefined;
      const id = unmappedId(event);
      tests.push({
        id,
        file: safeFile(event.file),
        name: safeName(event.name),
        criteria: [],
        status: "unmapped",
        durationMs: duration(event.durationMs),
        ...(evidence ? { evidence } : {}),
      });
      diagnostics.push({
        code: "SH_TEST_UNMAPPED",
        severity: "error",
        summary: `Native test ${
          safeName(event.name)
        } is absent from the governed manifest.`,
        correction:
          "Register the test against approved criteria before relying on it.",
        testId: id,
        file: safeFile(event.file),
        criteria: [],
      });
      continue;
    }
    if (seen.has(mapped.id)) {
      diagnostics.push({
        code: "SH_TEST_RESULT_DUPLICATE",
        severity: "error",
        summary: `Runner output repeats selected test ${mapped.id}.`,
        correction:
          "Repair the native result stream before accepting test evidence.",
        testId: mapped.id,
        file: mapped.sourcePath,
        criteria: [...mapped.criteria].sort(),
      });
      continue;
    }
    seen.add(mapped.id);
    const evidence = event.evidence ? safe(event.evidence) : undefined;
    tests.push({
      id: mapped.id,
      file: mapped.sourcePath,
      name: mapped.registeredName,
      criteria: [...mapped.criteria].sort(),
      status: event.status,
      durationMs: duration(event.durationMs),
      ...(evidence ? { evidence } : {}),
    });
    if (event.status !== "passed") {
      diagnostics.push({
        code: event.status === "failed" ? "SH_TEST_FAILED" : "SH_TEST_SKIPPED",
        severity: "error",
        summary: event.status === "failed"
          ? `Test ${mapped.id} failed.`
          : `Required test ${mapped.id} was skipped.`,
        correction: event.status === "failed"
          ? "Correct the behavior or approved test fixture and rerun."
          : "Run every selected required test without skipping it.",
        testId: mapped.id,
        file: mapped.sourcePath,
        criteria: [...mapped.criteria].sort(),
        requirementId: mapped.requirementId,
      });
    }
  }
  for (const mapped of selectedEntries) {
    if (seen.has(mapped.id)) continue;
    tests.push({
      id: mapped.id,
      file: mapped.sourcePath,
      name: mapped.registeredName,
      criteria: [...mapped.criteria].sort(),
      status: "skipped",
      durationMs: null,
    });
    diagnostics.push({
      code: "SH_TEST_RESULT_MISSING",
      severity: "error",
      summary: `Selected test ${mapped.id} is missing from runner output.`,
      correction:
        "Repair filtering or runner output and execute the selected test.",
      testId: mapped.id,
      file: mapped.sourcePath,
      criteria: [...mapped.criteria].sort(),
      requirementId: mapped.requirementId,
    });
  }
  if (runner.status === "failed") {
    diagnostics.push({
      code: "SH_TEST_RUNNER_FAILED",
      severity: "error",
      summary: "The native platform test runner did not complete successfully.",
      correction:
        "Inspect bounded test diagnostics and retry after correction.",
    });
  }
  tests.sort((left, right) => left.id.localeCompare(right.id));
  const selectedRequirements = inventory.requirements.filter((requirement) =>
    plan.selectedRequirements.includes(requirement.id)
  );
  const selectedManifest = {
    schema: "sleepy-hollow-test-manifest/v1" as const,
    tests: selectedEntries,
  };
  const traceability = createTraceabilityReport({
    requirements: selectedRequirements,
    manifest: selectedManifest,
    results: tests.filter((test) => !test.id.startsWith("unmapped:")).map((
      test,
    ) => ({
      testId: test.id,
      status: test.status === "unmapped" ? "failed" : test.status,
      ...(test.durationMs === null ? {} : { durationMs: test.durationMs }),
      ...(test.evidence ? { evidence: test.evidence } : {}),
    })),
  });
  const criteria = [...traceability.criteria].sort((left, right) =>
    left.requirementId.localeCompare(right.requirementId) ||
    left.criterionId.localeCompare(right.criterionId)
  );
  const count = (status: TestCommandTestResult["status"]) =>
    tests.filter((test) => test.status === status).length;
  const criterionCount = (status: typeof criteria[number]["status"]) =>
    criteria.filter((criterion) => criterion.status === status).length;
  const normalizedDuration =
    Number.isFinite(runner.durationMs) && runner.durationMs >= 0
      ? Math.round(runner.durationMs)
      : 0;
  diagnostics.sort((left, right) =>
    left.code.localeCompare(right.code) ||
    (left.requirementId ?? "").localeCompare(right.requirementId ?? "") ||
    (left.testId ?? "").localeCompare(right.testId ?? "") ||
    (left.file ?? "").localeCompare(right.file ?? "") ||
    left.summary.localeCompare(right.summary)
  );
  const ok = runner.status === "passed" &&
    tests.length === selectedEntries.length &&
    tests.every((test) => test.status === "passed") &&
    !diagnostics.some((item) => item.severity === "error") &&
    criteria.length > 0 &&
    criteria.every((criterion) => criterion.status === "passing");
  return Object.freeze({
    schema: "sleepy-hollow-test-result/v1",
    ok,
    command: "test",
    requestedScope: plan.requestedScope,
    effectiveScope: plan.effectiveScope,
    selectedRequirements: Object.freeze([...plan.selectedRequirements]),
    selectedTests: Object.freeze([...plan.selectedTests]),
    tests: Object.freeze(tests),
    criteria: Object.freeze(criteria),
    diagnostics: Object.freeze(diagnostics),
    summary: Object.freeze({
      passed: count("passed"),
      failed: count("failed"),
      skipped: count("skipped"),
      unmapped: count("unmapped"),
      passingCriteria: criterionCount("passing"),
      failingCriteria: criterionCount("failing"),
      skippedCriteria: criterionCount("skipped"),
      unmappedCriteria: criterionCount("unmapped"),
      durationMs: normalizedDuration,
    }),
    verificationStateChanged: false,
  });
}

export function failedWithoutRunner(
  plan: TestCommandPlan,
  inventory: TestCommandInventory,
): TestCommandResult {
  return normalizeRunnerResult(plan, inventory, {
    status: "failed",
    durationMs: 0,
    events: [],
  });
}
