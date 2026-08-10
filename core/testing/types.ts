import type { NormalizedRoute } from "../routing/mod.ts";

/** How one test run ended. */
export type TestResultStatus = "passed" | "failed" | "skipped";

/** One acceptance criterion an approval covers. */
export interface ApprovedCriterion {
  /** The criterion's identifier, such as `AC-F020-001`. */
  readonly id: string;
}

/**
 * A requirement as the test layer needs to see it: its criteria, its status,
 * and the digest binding the approval to the exact content approved.
 */
export interface RequirementEvidence {
  /** The requirement's identifier, such as `SH-F020`. */
  readonly id: string;
  /** Where the requirement stands in its lifecycle. */
  readonly status: "draft" | "approved" | "verified";
  /** Digest of the governed content, which the approval binds to. */
  readonly governedContentDigest: string;
  /** Requirements this one builds on. */
  readonly dependsOn?: readonly string[];
  /** The acceptance criteria tests must map to. */
  readonly criteria: readonly ApprovedCriterion[];
  /** The recorded approval, and whether it still binds this content. */
  readonly approval?: {
    readonly valid: boolean;
    readonly digest: string;
    readonly criteria: readonly string[];
  };
}

/** A test, together with the criteria it claims to verify. */
export interface CriterionTestSpec {
  /** Stable identifier for this test. */
  readonly id: string;
  /** The requirement being verified. */
  readonly requirementId: string;
  /** The criteria within it this test verifies. */
  readonly criteria: readonly string[];
  /** Human-readable name. */
  readonly name: string;
  /** Path of the file the test is defined in. */
  readonly sourcePath: string;
  /** The test body. */
  readonly fn: Deno.TestDefinition["fn"];
  /** Skips the test while keeping its mapping visible. */
  readonly ignore?: boolean;
  /** Passed through to Deno's test runner. */
  readonly sanitizeExit?: boolean;
  /** Passed through to Deno's test runner. */
  readonly sanitizeOps?: boolean;
  /** Passed through to Deno's test runner. */
  readonly sanitizeResources?: boolean;
}

/** A registered test, as recorded for traceability. */
export interface CriterionTestDescriptor {
  /** Stable identifier for this test. */
  readonly id: string;
  /** The requirement being verified. */
  readonly requirementId: string;
  /** The criteria this test verifies. */
  readonly criteria: readonly string[];
  /** Human-readable name. */
  readonly name: string;
  /** Name the test was registered under with the runner. */
  readonly registeredName: string;
  /** Path of the file the test is defined in. */
  readonly sourcePath: string;
}

/** Registers criterion tests and remembers what was registered. */
export interface CriterionTestRegistry {
  /**
   * Registers one test against the criteria it verifies.
   *
   * @param spec The test, and what it claims to verify.
   * @returns The descriptor recorded for it.
   */
  criterionTest(spec: CriterionTestSpec): CriterionTestDescriptor;
  /**
   * Lists what has been registered.
   *
   * @returns Every descriptor, in registration order.
   */
  descriptors(): readonly CriterionTestDescriptor[];
}

/** A manifest entry: a test, and a digest of the source it was defined in. */
export interface TestManifestEntry extends CriterionTestDescriptor {
  /** Digest of the test's source, so a later edit is detectable. */
  readonly sourceDigest: string;
}

/**
 * The registered test suite, digested.
 *
 * Comparing manifests across revisions is what makes a weakened or deleted
 * test visible rather than silent.
 */
export interface TestManifest {
  /** Identifies the manifest format. */
  readonly schema: "sleepy-hollow-test-manifest/v1";
  /** Every registered test. */
  readonly tests: readonly TestManifestEntry[];
}

/** How one test actually ended when run. */
export interface TestExecutionResult {
  /** Identifier of the test. */
  readonly testId: string;
  /** How it ended. */
  readonly status: TestResultStatus;
  /** How long it took. */
  readonly durationMs?: number;
  /** Supporting output, such as a failure message. */
  readonly evidence?: string;
}

/** One criterion's verification state, and what determined it. */
export interface CriterionTrace {
  /** The requirement the criterion belongs to. */
  readonly requirementId: string;
  /** The criterion. */
  readonly criterionId: string;
  /** Tests mapped to it. */
  readonly testIds: readonly string[];
  /** Its state; `unmapped` means no test claims it. */
  readonly status: "passing" | "failing" | "skipped" | "unmapped";
}

/**
 * Which criteria are verified, which are not, and what changed since the last
 * run. `eligibleForVerification` is the gate: it is false whenever a criterion
 * is unmapped, a test was removed, or a mapping was weakened.
 */
export interface TraceabilityReport {
  /** Identifies the report format. */
  readonly schema: "sleepy-hollow-traceability/v1";
  /** Every criterion, with its state. */
  readonly criteria: readonly CriterionTrace[];
  /** Criteria whose mapped tests all passed. */
  readonly passingCriteria: readonly string[];
  /** Criteria with at least one failing test. */
  readonly failingCriteria: readonly string[];
  /** Criteria whose tests were skipped. */
  readonly skippedCriteria: readonly string[];
  /** Criteria no test claims. */
  readonly unmappedCriteria: readonly string[];
  /** Tests claiming no criterion. */
  readonly unmappedTests: readonly string[];
  /** Tests present in the previous manifest and now gone. */
  readonly removedTests: readonly string[];
  /** Tests whose source changed since the previous manifest. */
  readonly changedTests: readonly string[];
  /** Mappings that now cover fewer criteria than before. */
  readonly weakenedMappings: readonly string[];
  /** Whether this run may support a claim of verification. */
  readonly eligibleForVerification: boolean;
}

/** One baseline check proving the tree was otherwise healthy. */
export interface BaselineCheck {
  /** Identifier of the check. */
  readonly id: string;
  /** Whether it passed. */
  readonly status: "passed" | "failed";
  /** What was checked. */
  readonly kind: "type" | "startup" | "dependency" | "unaffected-test";
  /** Supporting output. */
  readonly evidence?: string;
}

/**
 * One test's result during a red-state run, and why it failed.
 *
 * The failure kind is what separates credible red state from a broken tree: a
 * test failing for `missing-behavior` is evidence, one failing to `compile` or
 * for `permission` reasons is not.
 */
export interface RedTestResult {
  /** Identifier of the test. */
  readonly testId: string;
  /** The criteria it maps to. */
  readonly criterionIds: readonly string[];
  /** Digest of the test source, so the run binds to what was executed. */
  readonly testDigest: string;
  /** How it ended. */
  readonly status: TestResultStatus;
  /** Why it failed; only `missing-behavior` counts as expected red. */
  readonly failureKind?:
    | "missing-behavior"
    | "compile"
    | "assertion"
    | "permission"
    | "startup"
    | "dependency"
    | "unrelated";
  /** Supporting output. */
  readonly evidence?: string;
  /** Why this failure was expected, when it was. */
  readonly expectedReason?: string;
}

/**
 * The classification of a red-state run: credible evidence that the behaviour
 * is genuinely absent, a broken baseline, or an invalid claim.
 */
export interface RedStateResult {
  /** What the run amounts to. */
  readonly kind: "expected-red" | "broken-baseline" | "invalid-red";
  /** Whether it is usable as red-state evidence. */
  readonly valid: boolean;
  /** The requirement being implemented. */
  readonly requirementId: string;
  /** Digest of the requirement's governed content at the time of the run. */
  readonly requirementDigest: string;
  /** Revision the run was performed against. */
  readonly baselineRevision: string;
  /** What performed the run. */
  readonly runner: string;
  /** Where it ran. */
  readonly environment: string;
  /** The criteria the run covers. */
  readonly criteria: readonly string[];
  /** Each test's result. */
  readonly tests: readonly RedTestResult[];
  /** Why the run was rejected, when it was. */
  readonly diagnostics: readonly TestingDiagnostic[];
}

/** One reason a testing artifact was refused. */
export interface TestingDiagnostic {
  /** Stable machine-readable identifier for this kind of fault. */
  readonly code: string;
  /** What is wrong, in one sentence. */
  readonly message: string;
  /** What the fault concerns, such as a test or criterion. */
  readonly subject?: string;
  /** What to change to resolve it. */
  readonly correction: string;
}

/** What a test application factory is given to build the application. */
export interface TestApplicationFactoryContext<Principal, Credentials> {
  /** An isolated store for this test. */
  readonly kv: Deno.Kv;
  /** The caller the test acts as, when it declares one. */
  readonly principal?: Principal;
  /** Credentials the test authenticates with, when it declares any. */
  readonly credentials?: Credentials;
}

/** The application under test, reduced to what a test needs of it. */
export interface TestApplication {
  /**
   * Answers one request.
   *
   * @param request The request to answer.
   * @returns The response.
   */
  fetch(request: Request): Response | Promise<Response>;
}

/** Where to load the project's security module from, under test. */
export interface TestApplicationSecurityOptions {
  /** Project root the security module is resolved against. */
  readonly root: string;
  /** Path to the security module; defaults to the conventional location. */
  readonly securityModule?: string;
  /** Imports the module; supply your own to compose without disk access. */
  readonly load?: (specifier: string) => Promise<unknown>;
}

/** Builds the application under test. */
export type TestApplicationFactory<Principal, Credentials> = (
  context: TestApplicationFactoryContext<Principal, Credentials>,
) => TestApplication | Promise<TestApplication>;

/** The caller, the seed data, and the teardown a test runs with. */
export interface TestApplicationFixtures<Principal, Credentials> {
  /** The caller the test acts as. */
  readonly principal?: Principal;
  /** Credentials the test authenticates with. */
  readonly credentials?: Credentials;
  /** Populates the store before the test body runs. */
  readonly seed?: (context: {
    readonly kv: Deno.Kv;
    readonly application: TestApplication;
  }) => void | Promise<void>;
  /** Runs after the test, before the store is closed. */
  readonly cleanup?: () => void | Promise<void>;
  /** Origin requests are addressed to; defaults to a local placeholder. */
  readonly origin?: string;
}

/**
 * A test application is built either from an application factory or from a
 * route inventory the framework composes security over, never from neither and
 * never from both. The union makes the invalid combinations unrepresentable
 * rather than leaving them to a runtime diagnostic.
 */
export type TestApplicationOptions<Principal, Credentials> =
  & TestApplicationFixtures<Principal, Credentials>
  & (
    | {
      readonly create: TestApplicationFactory<Principal, Credentials>;
      readonly routes?: undefined;
      readonly security?: undefined;
    }
    | {
      readonly routes: readonly NormalizedRoute[];
      readonly security?: TestApplicationSecurityOptions;
      readonly create?: undefined;
    }
  );

/** One JSON request a test makes. */
export interface JsonRequestOptions<Body> {
  /** The HTTP method; defaults to `GET`. */
  readonly method?: string;
  /** Path to call, relative to the application's origin. */
  readonly path: string;
  /** Additional headers. */
  readonly headers?: HeadersInit;
  /** Body to send as JSON. */
  readonly body?: Body;
}

/** A response, with its JSON body already parsed. */
export interface JsonTestResponse<Body> {
  /** The response itself. */
  readonly response: Response;
  /** Its parsed body. */
  readonly body: Body;
}

/** What a test asserts about a problem-details response. */
export interface ProblemExpectation {
  /** Expected status. */
  readonly status: number;
  /** Expected problem type. */
  readonly type?: string;
  /** Expected title. */
  readonly title?: string;
  /** Expected additional members. */
  readonly extensions?: Readonly<Record<string, unknown>>;
}

/** A problem-details response body, as defined by RFC 9457. */
export interface ProblemDetails {
  /** Identifies the problem type. */
  readonly type: string;
  /** Short human-readable summary. */
  readonly title: string;
  /** The HTTP status. */
  readonly status: number;
  /** Detail specific to this occurrence. */
  readonly detail?: string;
  /** Identifies this occurrence. */
  readonly instance?: string;
  /** Additional members the problem type defines. */
  readonly [key: string]: unknown;
}

/**
 * A running application under test, with its store.
 *
 * It implements `AsyncDisposable`, so `await using` closes the store and runs
 * cleanup even when the test body throws.
 */
export interface TestApplicationContext {
  /** The isolated store this test runs against. */
  readonly kv: Deno.Kv;
  /** The application under test. */
  readonly application: TestApplication;
  /**
   * Calls the application directly.
   *
   * @param input The request, URL, or path to call.
   * @param init Request options.
   * @returns The response.
   */
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  /**
   * Calls the application with a JSON body and parses the JSON response.
   *
   * @param options The method, path, headers, and body.
   * @returns The response, and its parsed body.
   */
  request<RequestBody = undefined, ResponseBody = unknown>(
    options: JsonRequestOptions<RequestBody>,
  ): Promise<JsonTestResponse<ResponseBody>>;
  /**
   * Asserts a response is the expected problem, and returns it parsed.
   *
   * @param response The response to check.
   * @param expectation What the problem must be.
   * @returns The parsed problem details.
   */
  assertProblem(
    response: Response,
    expectation: ProblemExpectation,
  ): Promise<ProblemDetails>;
  /** Runs cleanup and closes the store. */
  close(): Promise<void>;
  /** Closes the context at the end of an `await using` block. */
  [Symbol.asyncDispose](): Promise<void>;
}

/** One requirement's place in the dependency graph. */
export interface RequirementDependency {
  /** The requirement's identifier. */
  readonly id: string;
  /** Requirements it builds on. */
  readonly dependsOn: readonly string[];
}

/**
 * Which tests a change requires running.
 *
 * Selection falls back to `full` whenever targeting cannot be justified, so an
 * unattributable change runs everything rather than silently running less.
 */
export interface TestSelection {
  /** Whether a subset suffices, or everything must run. */
  readonly mode: "targeted" | "full";
  /** Requirements implicated by the change. */
  readonly requirementIds: readonly string[];
  /** Tests to run. */
  readonly testIds: readonly string[];
  /** Why each requirement was implicated. */
  readonly reasons: Readonly<Record<string, readonly string[]>>;
  /** Why targeting was refused, when it was. */
  readonly diagnostics: readonly TestingDiagnostic[];
}
