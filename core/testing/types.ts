import type { NormalizedRoute } from "../routing/mod.ts";

export type TestResultStatus = "passed" | "failed" | "skipped";

export interface ApprovedCriterion {
  readonly id: string;
}

export interface RequirementEvidence {
  readonly id: string;
  readonly status: "draft" | "approved" | "verified";
  readonly governedContentDigest: string;
  readonly dependsOn?: readonly string[];
  readonly criteria: readonly ApprovedCriterion[];
  readonly approval?: {
    readonly valid: boolean;
    readonly digest: string;
    readonly criteria: readonly string[];
  };
}

export interface CriterionTestSpec {
  readonly id: string;
  readonly requirementId: string;
  readonly criteria: readonly string[];
  readonly name: string;
  readonly sourcePath: string;
  readonly fn: Deno.TestDefinition["fn"];
  readonly ignore?: boolean;
  readonly sanitizeExit?: boolean;
  readonly sanitizeOps?: boolean;
  readonly sanitizeResources?: boolean;
}

export interface CriterionTestDescriptor {
  readonly id: string;
  readonly requirementId: string;
  readonly criteria: readonly string[];
  readonly name: string;
  readonly registeredName: string;
  readonly sourcePath: string;
}

export interface CriterionTestRegistry {
  criterionTest(spec: CriterionTestSpec): CriterionTestDescriptor;
  descriptors(): readonly CriterionTestDescriptor[];
}

export interface TestManifestEntry extends CriterionTestDescriptor {
  readonly sourceDigest: string;
}

export interface TestManifest {
  readonly schema: "sleepy-hollow-test-manifest/v1";
  readonly tests: readonly TestManifestEntry[];
}

export interface TestExecutionResult {
  readonly testId: string;
  readonly status: TestResultStatus;
  readonly durationMs?: number;
  readonly evidence?: string;
}

export interface CriterionTrace {
  readonly requirementId: string;
  readonly criterionId: string;
  readonly testIds: readonly string[];
  readonly status: "passing" | "failing" | "skipped" | "unmapped";
}

export interface TraceabilityReport {
  readonly schema: "sleepy-hollow-traceability/v1";
  readonly criteria: readonly CriterionTrace[];
  readonly passingCriteria: readonly string[];
  readonly failingCriteria: readonly string[];
  readonly skippedCriteria: readonly string[];
  readonly unmappedCriteria: readonly string[];
  readonly unmappedTests: readonly string[];
  readonly removedTests: readonly string[];
  readonly changedTests: readonly string[];
  readonly weakenedMappings: readonly string[];
  readonly eligibleForVerification: boolean;
}

export interface BaselineCheck {
  readonly id: string;
  readonly status: "passed" | "failed";
  readonly kind: "type" | "startup" | "dependency" | "unaffected-test";
  readonly evidence?: string;
}

export interface RedTestResult {
  readonly testId: string;
  readonly criterionIds: readonly string[];
  readonly testDigest: string;
  readonly status: TestResultStatus;
  readonly failureKind?:
    | "missing-behavior"
    | "compile"
    | "assertion"
    | "permission"
    | "startup"
    | "dependency"
    | "unrelated";
  readonly evidence?: string;
  readonly expectedReason?: string;
}

export interface RedStateResult {
  readonly kind: "expected-red" | "broken-baseline" | "invalid-red";
  readonly valid: boolean;
  readonly requirementId: string;
  readonly requirementDigest: string;
  readonly baselineRevision: string;
  readonly runner: string;
  readonly environment: string;
  readonly criteria: readonly string[];
  readonly tests: readonly RedTestResult[];
  readonly diagnostics: readonly TestingDiagnostic[];
}

export interface TestingDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly subject?: string;
  readonly correction: string;
}

export interface TestApplicationFactoryContext<Principal, Credentials> {
  readonly kv: Deno.Kv;
  readonly principal?: Principal;
  readonly credentials?: Credentials;
}

export interface TestApplication {
  fetch(request: Request): Response | Promise<Response>;
}

export interface TestApplicationSecurityOptions {
  readonly root: string;
  readonly securityModule?: string;
  readonly load?: (specifier: string) => Promise<unknown>;
}

export type TestApplicationFactory<Principal, Credentials> = (
  context: TestApplicationFactoryContext<Principal, Credentials>,
) => TestApplication | Promise<TestApplication>;

export interface TestApplicationFixtures<Principal, Credentials> {
  readonly principal?: Principal;
  readonly credentials?: Credentials;
  readonly seed?: (context: {
    readonly kv: Deno.Kv;
    readonly application: TestApplication;
  }) => void | Promise<void>;
  readonly cleanup?: () => void | Promise<void>;
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

export interface JsonRequestOptions<Body> {
  readonly method?: string;
  readonly path: string;
  readonly headers?: HeadersInit;
  readonly body?: Body;
}

export interface JsonTestResponse<Body> {
  readonly response: Response;
  readonly body: Body;
}

export interface ProblemExpectation {
  readonly status: number;
  readonly type?: string;
  readonly title?: string;
  readonly extensions?: Readonly<Record<string, unknown>>;
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly [key: string]: unknown;
}

export interface TestApplicationContext {
  readonly kv: Deno.Kv;
  readonly application: TestApplication;
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  request<RequestBody = undefined, ResponseBody = unknown>(
    options: JsonRequestOptions<RequestBody>,
  ): Promise<JsonTestResponse<ResponseBody>>;
  assertProblem(
    response: Response,
    expectation: ProblemExpectation,
  ): Promise<ProblemDetails>;
  close(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;
}

export interface RequirementDependency {
  readonly id: string;
  readonly dependsOn: readonly string[];
}

export interface TestSelection {
  readonly mode: "targeted" | "full";
  readonly requirementIds: readonly string[];
  readonly testIds: readonly string[];
  readonly reasons: Readonly<Record<string, readonly string[]>>;
  readonly diagnostics: readonly TestingDiagnostic[];
}
