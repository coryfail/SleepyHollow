import { testingDiagnostic } from "./error.ts";
import type {
  BaselineCheck,
  RedStateResult,
  RedTestResult,
  RequirementEvidence,
  TestingDiagnostic,
} from "./types.ts";

export function redState(options: {
  readonly requirement: RequirementEvidence;
  readonly baselineChecks: readonly BaselineCheck[];
  readonly tests: readonly RedTestResult[];
  readonly baselineRevision: string;
  readonly runner: string;
  readonly environment: string;
}): RedStateResult {
  const criteria = [...options.requirement.criteria.map((item) => item.id)]
    .sort();
  const base = {
    requirementId: options.requirement.id,
    requirementDigest: options.requirement.governedContentDigest,
    baselineRevision: options.baselineRevision,
    runner: options.runner,
    environment: options.environment,
    criteria: Object.freeze(criteria),
    tests: Object.freeze([...options.tests]),
  };
  const failedBaseline = options.baselineChecks.filter((check) =>
    check.status === "failed"
  );
  if (failedBaseline.length > 0) {
    return Object.freeze({
      ...base,
      kind: "broken-baseline",
      valid: false,
      diagnostics: Object.freeze(
        failedBaseline.map((check) =>
          testingDiagnostic(
            "SH_TEST_BASELINE_BROKEN",
            `Baseline ${check.kind} check ${check.id} failed${
              check.evidence ? `: ${check.evidence}` : ""
            }.`,
            "Repair or isolate the unrelated baseline failure before recording red evidence.",
            check.id,
          )
        ),
      ),
    });
  }

  const diagnostics: TestingDiagnostic[] = [];
  const approval = options.requirement.approval;
  if (
    options.requirement.status === "draft" || !approval?.valid ||
    approval.digest !== options.requirement.governedContentDigest
  ) {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_RED_APPROVAL_INVALID",
      `Requirement ${options.requirement.id} lacks approval for current content.`,
      "Obtain current exact-content approval before treating failures as governed red evidence.",
      options.requirement.id,
    ));
  }
  const reached = new Set<string>();
  for (const test of options.tests) {
    if (
      test.status !== "failed" || test.failureKind !== "missing-behavior" ||
      !test.expectedReason?.trim() || !test.evidence?.trim() ||
      !test.testDigest.trim()
    ) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_RED_FAILURE_INVALID",
        `Test ${test.testId} did not fail solely for documented missing approved behavior.`,
        "Separate compile, assertion, permission, startup, dependency, unrelated, passing, and skipped outcomes from expected red evidence.",
        test.testId,
      ));
      continue;
    }
    test.criterionIds.forEach((id) => reached.add(id));
  }
  for (const criterion of criteria) {
    if (!reached.has(criterion)) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_RED_CRITERION_MISSING",
        `Criterion ${criterion} has no expected missing-behavior failure.`,
        "Run at least one mapped acceptance test before implementation and record its expected failure.",
        criterion,
      ));
    }
  }
  return Object.freeze({
    ...base,
    kind: diagnostics.length === 0 ? "expected-red" : "invalid-red",
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics),
  });
}
