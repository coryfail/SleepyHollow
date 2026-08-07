import { problem, testApplication } from "./application.ts";
import { createRegistry, manifest } from "./criterion.ts";
export { TestingError } from "./error.ts";
import { redState } from "./red_state.ts";
import { selection } from "./selection.ts";
import { traceability } from "./traceability.ts";
import type {
  BaselineCheck,
  CriterionTestRegistry,
  CriterionTestSpec,
  ProblemDetails,
  ProblemExpectation,
  RedStateResult,
  RedTestResult,
  RequirementDependency,
  RequirementEvidence,
  TestApplicationContext,
  TestApplicationOptions,
  TestExecutionResult,
  TestManifest,
  TestSelection,
  TraceabilityReport,
} from "./types.ts";

export * from "./types.ts";

export function createCriterionRegistry(options: {
  readonly requirements: readonly RequirementEvidence[];
  readonly register?: (definition: Deno.TestDefinition) => void;
}): CriterionTestRegistry {
  return createRegistry(options);
}

export function criterionTest(
  spec: CriterionTestSpec,
  options: {
    readonly requirements: readonly RequirementEvidence[];
    readonly register?: (definition: Deno.TestDefinition) => void;
  },
) {
  return createRegistry(options).criterionTest(spec);
}

export function createTestManifest(options: {
  readonly descriptors: ReturnType<CriterionTestRegistry["descriptors"]>;
  readonly sources: Readonly<Record<string, string>>;
}): TestManifest {
  return manifest(options);
}

export function createTraceabilityReport(options: {
  readonly requirements: readonly RequirementEvidence[];
  readonly manifest: TestManifest;
  readonly results: readonly TestExecutionResult[];
  readonly previousManifest?: TestManifest;
  readonly reviewedTestIds?: readonly string[];
}): TraceabilityReport {
  return traceability(options);
}

export function classifyRedState(options: {
  readonly requirement: RequirementEvidence;
  readonly baselineChecks: readonly BaselineCheck[];
  readonly tests: readonly RedTestResult[];
  readonly baselineRevision: string;
  readonly runner: string;
  readonly environment: string;
}): RedStateResult {
  return redState(options);
}

export function createTestApplication<
  Principal = unknown,
  Credentials = unknown,
>(
  options: TestApplicationOptions<Principal, Credentials>,
): Promise<TestApplicationContext> {
  return testApplication(options);
}

export function assertProblem(
  response: Response,
  expectation: ProblemExpectation,
): Promise<ProblemDetails> {
  return problem(response, expectation);
}

export function selectAffectedTests(options: {
  readonly targets: readonly string[];
  readonly requirements: readonly RequirementDependency[];
  readonly tests: readonly {
    readonly id: string;
    readonly requirementId: string;
  }[];
  readonly hasUnownedSharedChange?: boolean;
}): TestSelection {
  return selection(options);
}
