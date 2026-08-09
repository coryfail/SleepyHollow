/**
 * Test utilities that bind tests to acceptance criteria.
 *
 * A criterion test carries the identifier of the criterion it verifies, which
 * makes traceability a property of the test suite rather than a document kept
 * beside it. The same registry produces the manifest, the traceability report,
 * and the red-state classification that gate a change.
 *
 * @module
 */
import { problem, testApplication } from "./application.ts";
import { createRegistry, manifest } from "./criterion.ts";
export { TestingError } from "./error.ts";
import { redState } from "./red_state.ts";
import { selection } from "./selection.ts";
import { traceability } from "./traceability.ts";
import type {
  BaselineCheck,
  CriterionTestDescriptor,
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

/**
 * Builds a registry that registers tests against approved criteria.
 *
 * A test claiming a criterion the requirement does not have, or one whose
 * approval no longer binds, is refused at registration rather than counted.
 *
 * @param options The requirements to check against, and the registrar to use.
 * @returns A registry.
 * @throws {TestingError} When the supplied requirements are inconsistent.
 */
export function createCriterionRegistry(options: {
  readonly requirements: readonly RequirementEvidence[];
  readonly register?: (definition: Deno.TestDefinition) => void;
}): CriterionTestRegistry {
  return createRegistry(options);
}

/**
 * Registers one criterion test without holding a registry.
 *
 * @param spec The test, and the criteria it verifies.
 * @param options The requirements to check against, and the registrar to use.
 * @returns The descriptor recorded for it.
 * @throws {TestingError} When the test claims a criterion it may not.
 */
export function criterionTest(
  spec: CriterionTestSpec,
  options: {
    readonly requirements: readonly RequirementEvidence[];
    readonly register?: (definition: Deno.TestDefinition) => void;
  },
): CriterionTestDescriptor {
  return createRegistry(options).criterionTest(spec);
}

/**
 * Digests the registered suite into a manifest.
 *
 * Comparing manifests across revisions is what makes a deleted or weakened
 * test visible instead of silent.
 *
 * @param options The registered descriptors, and the sources they came from.
 * @returns The manifest.
 * @throws {TestingError} When a descriptor's source is missing.
 */
export function createTestManifest(options: {
  readonly descriptors: ReturnType<CriterionTestRegistry["descriptors"]>;
  readonly sources: Readonly<Record<string, string>>;
}): TestManifest {
  return manifest(options);
}

/**
 * Maps criteria to the tests that verify them, and reports what changed.
 *
 * Supply the previous manifest to detect removed, changed, and weakened
 * mappings; without it, only the current run's coverage is reported.
 *
 * @param options The requirements, the manifest, the results, and optionally
 * the previous manifest and the tests a reviewer accepted.
 * @returns The report, including whether the run supports verification.
 * @throws {TestingError} When results and manifest disagree.
 */
export function createTraceabilityReport(options: {
  readonly requirements: readonly RequirementEvidence[];
  readonly manifest: TestManifest;
  readonly results: readonly TestExecutionResult[];
  readonly previousManifest?: TestManifest;
  readonly reviewedTestIds?: readonly string[];
}): TraceabilityReport {
  return traceability(options);
}

/**
 * Decides whether a failing run is credible evidence that behaviour is absent.
 *
 * A test failing because the behaviour is missing is evidence; one failing to
 * compile, or against a broken baseline, is not, and is classified as such
 * rather than accepted.
 *
 * @param options The requirement, the baseline checks, the test results, and
 * the revision, runner, and environment the run was performed in.
 * @returns The classification, and why it was reached.
 */
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

/**
 * Starts an application against an isolated store, for one test.
 *
 * Supply either `create` or `routes`, never both. The context is disposable,
 * so `await using` closes the store and runs cleanup even on failure.
 *
 * ```ts
 * import { createTestApplication } from "@sleepy-hollow/framework/testing";
 *
 * await using app = await createTestApplication({ routes: [] });
 * const { response } = await app.request({ path: "/widgets/w_1" });
 * ```
 *
 * @param options The application to build, and the fixtures to build it with.
 * @returns The running application, and its store.
 */
export function createTestApplication<
  Principal = unknown,
  Credentials = unknown,
>(
  options: TestApplicationOptions<Principal, Credentials>,
): Promise<TestApplicationContext> {
  return testApplication(options);
}

/**
 * Asserts a response is the expected problem, and returns it parsed.
 *
 * @param response The response to check.
 * @param expectation The status, type, title, and members required of it.
 * @returns The parsed problem details.
 */
export function assertProblem(
  response: Response,
  expectation: ProblemExpectation,
): Promise<ProblemDetails> {
  return problem(response, expectation);
}

/**
 * Decides which tests a change requires running.
 *
 * Targeting is a claim that the rest cannot be affected, so selection falls
 * back to running everything whenever a changed file cannot be attributed to a
 * requirement.
 *
 * @param options The changed targets, the requirement graph, the tests, and
 * whether a shared file no requirement owns was changed.
 * @returns The tests to run, and why.
 */
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
