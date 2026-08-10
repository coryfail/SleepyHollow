import type {
  CriterionTrace,
  RequirementEvidence,
  TestExecutionResult,
  TestManifest,
  TraceabilityReport,
} from "./types.ts";

const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

export function traceability(options: {
  readonly requirements: readonly RequirementEvidence[];
  readonly manifest: TestManifest;
  readonly results: readonly TestExecutionResult[];
  readonly previousManifest?: TestManifest;
  readonly reviewedTestIds?: readonly string[];
}): TraceabilityReport {
  const requirements = new Map(
    options.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const results = new Map(
    options.results.map((result) => [result.testId, result]),
  );
  const testsByCriterion = new Map<string, string[]>();
  const unmappedTests: string[] = [];

  for (const test of options.manifest.tests) {
    const requirement = requirements.get(test.requirementId);
    const approved = new Set(requirement?.approval?.criteria ?? []);
    let mapped = Boolean(requirement && test.criteria.length > 0);
    for (const id of test.criteria) {
      if (!approved.has(id)) mapped = false;
      const key = `${test.requirementId}\0${id}`;
      const current = testsByCriterion.get(key) ?? [];
      current.push(test.id);
      testsByCriterion.set(key, current);
    }
    if (!mapped) unmappedTests.push(test.id);
  }

  const traces: CriterionTrace[] = [];
  for (
    const requirement of [...options.requirements].sort((left, right) =>
      left.id.localeCompare(right.id)
    )
  ) {
    for (
      const criterion of [...requirement.criteria].sort((left, right) =>
        left.id.localeCompare(right.id)
      )
    ) {
      const testIds = sorted(
        testsByCriterion.get(`${requirement.id}\0${criterion.id}`) ?? [],
      );
      const statuses = testIds.map((id) =>
        results.get(id)?.status ?? "skipped"
      );
      const status = testIds.length === 0
        ? "unmapped"
        : statuses.includes("failed")
        ? "failing"
        : statuses.includes("skipped")
        ? "skipped"
        : "passing";
      traces.push(Object.freeze({
        requirementId: requirement.id,
        criterionId: criterion.id,
        testIds: Object.freeze(testIds),
        status,
      }));
    }
  }

  const previous = new Map(
    (options.previousManifest?.tests ?? []).map((test) => [test.id, test]),
  );
  const current = new Map(
    options.manifest.tests.map((test) => [test.id, test]),
  );
  const reviewed = new Set(options.reviewedTestIds ?? []);
  const removedTests = sorted(
    [...previous.keys()].filter((id) => !current.has(id)),
  );
  const changedTests = sorted(
    [...current].filter(([id, test]) => {
      const prior = previous.get(id);
      return prior && prior.sourceDigest !== test.sourceDigest &&
        !reviewed.has(id);
    }).map(([id]) => id),
  );
  const weakenedMappings = sorted(
    [...current].filter(([id, test]) => {
      const prior = previous.get(id);
      if (!prior) return false;
      const mappings = new Set(test.criteria);
      return prior.criteria.some((criterion) => !mappings.has(criterion));
    }).map(([id]) => id),
  );
  const passingCriteria = traces.filter((item) => item.status === "passing")
    .map(
      (item) => item.criterionId,
    );
  const failingCriteria = traces.filter((item) => item.status === "failing")
    .map(
      (item) => item.criterionId,
    );
  const skippedCriteria = traces.filter((item) => item.status === "skipped")
    .map(
      (item) => item.criterionId,
    );
  const unmappedCriteria = traces.filter((item) => item.status === "unmapped")
    .map(
      (item) => item.criterionId,
    );
  const eligibleForVerification = traces.length > 0 &&
    traces.every((item) => item.status === "passing") &&
    unmappedTests.length === 0 && removedTests.length === 0 &&
    changedTests.length === 0 && weakenedMappings.length === 0;

  return Object.freeze({
    schema: "sleepy-hollow-traceability/v1",
    criteria: Object.freeze(traces),
    passingCriteria: Object.freeze(passingCriteria),
    failingCriteria: Object.freeze(failingCriteria),
    skippedCriteria: Object.freeze(skippedCriteria),
    unmappedCriteria: Object.freeze(unmappedCriteria),
    unmappedTests: Object.freeze(sorted(unmappedTests)),
    removedTests: Object.freeze(removedTests),
    changedTests: Object.freeze(changedTests),
    weakenedMappings: Object.freeze(weakenedMappings),
    eligibleForVerification,
  });
}
