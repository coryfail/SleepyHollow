import { testingDiagnostic } from "./error.ts";
import type {
  RequirementDependency,
  TestingDiagnostic,
  TestSelection,
} from "./types.ts";

const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

export function selection(options: {
  readonly targets: readonly string[];
  readonly requirements: readonly RequirementDependency[];
  readonly tests: readonly {
    readonly id: string;
    readonly requirementId: string;
  }[];
  readonly hasUnownedSharedChange?: boolean;
}): TestSelection {
  const diagnostics: TestingDiagnostic[] = [];
  const requirements = new Map<string, RequirementDependency>();
  for (const requirement of options.requirements) {
    if (requirements.has(requirement.id)) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_SELECTION_REQUIREMENT_DUPLICATE",
        `Requirement ${requirement.id} is duplicated.`,
        "Resolve requirement identity before targeted selection.",
        requirement.id,
      ));
    }
    requirements.set(requirement.id, requirement);
  }
  const testIds = new Set<string>();
  for (const test of options.tests) {
    if (testIds.has(test.id)) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_SELECTION_TEST_DUPLICATE",
        `Test ${test.id} is duplicated.`,
        "Resolve test identity before targeted selection.",
        test.id,
      ));
    }
    testIds.add(test.id);
    if (!requirements.has(test.requirementId)) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_SELECTION_TEST_UNMAPPED",
        `Test ${test.id} names unknown requirement ${test.requirementId}.`,
        "Map every governed test to a known requirement or run the full suite.",
        test.id,
      ));
    }
  }
  for (const target of options.targets) {
    if (!requirements.has(target)) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_SELECTION_TARGET_UNKNOWN",
        `Target requirement ${target} is unknown.`,
        "Choose a requirement from the parsed inventory.",
        target,
      ));
    }
  }
  for (const requirement of requirements.values()) {
    for (const dependency of requirement.dependsOn) {
      if (!requirements.has(dependency)) {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_SELECTION_DEPENDENCY_MISSING",
          `Requirement ${requirement.id} has missing dependency ${dependency}.`,
          "Resolve the dependency graph before targeted selection.",
          requirement.id,
        ));
      }
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id) || !requirements.has(id)) return;
    if (visiting.has(id)) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_SELECTION_DEPENDENCY_CYCLE",
        `Requirement dependency cycle includes ${id}.`,
        "Resolve the cycle before targeted selection.",
        id,
      ));
      return;
    }
    visiting.add(id);
    for (const dependency of requirements.get(id)?.dependsOn ?? []) {
      visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
  };
  requirements.forEach((_value, id) => visit(id));
  if (options.hasUnownedSharedChange) {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_SELECTION_SHARED_OWNER_UNKNOWN",
      "A changed shared artifact has no complete requirement ownership mapping.",
      "Run the full relevant suite and define ownership before future targeting.",
    ));
  }

  const allRequirements = sorted(requirements.keys());
  const allTests = sorted(options.tests.map((test) => test.id));
  if (diagnostics.length > 0 || options.targets.length === 0) {
    if (options.targets.length === 0) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_SELECTION_TARGET_REQUIRED",
        "Targeted selection requires at least one requirement ID.",
        "Name a target or run the full suite explicitly.",
      ));
    }
    return Object.freeze({
      mode: "full",
      requirementIds: Object.freeze(allRequirements),
      testIds: Object.freeze(allTests),
      reasons: Object.freeze(Object.fromEntries(
        allRequirements.map((
          id,
        ) => [id, Object.freeze(["full-suite-escalation"])]),
      )),
      diagnostics: Object.freeze(diagnostics),
    });
  }

  const selected = new Set(options.targets);
  const reasons = new Map<string, Set<string>>();
  options.targets.forEach((id) => reasons.set(id, new Set(["target"])));
  let changed = true;
  while (changed) {
    changed = false;
    for (const requirement of requirements.values()) {
      if (selected.has(requirement.id)) {
        for (const dependency of requirement.dependsOn) {
          if (!selected.has(dependency)) changed = true;
          selected.add(dependency);
          const current = reasons.get(dependency) ?? new Set<string>();
          current.add(`dependency-of:${requirement.id}`);
          reasons.set(dependency, current);
        }
      }
      if (
        !selected.has(requirement.id) &&
        requirement.dependsOn.some((dependency) => selected.has(dependency))
      ) {
        selected.add(requirement.id);
        changed = true;
        const current = reasons.get(requirement.id) ?? new Set<string>();
        for (const dependency of requirement.dependsOn) {
          if (selected.has(dependency)) {
            current.add(`dependent-of:${dependency}`);
          }
        }
        reasons.set(requirement.id, current);
      }
    }
  }
  const requirementIds = sorted(selected);
  const selectedTests = sorted(
    options.tests.filter((test) => selected.has(test.requirementId)).map((
      test,
    ) => test.id),
  );
  return Object.freeze({
    mode: "targeted",
    requirementIds: Object.freeze(requirementIds),
    testIds: Object.freeze(selectedTests),
    reasons: Object.freeze(Object.fromEntries(
      requirementIds.map((
        id,
      ) => [id, Object.freeze(sorted(reasons.get(id) ?? []))]),
    )),
    diagnostics: Object.freeze([]),
  });
}
