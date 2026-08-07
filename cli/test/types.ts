import type {
  RequirementDependency,
  RequirementEvidence,
  TestManifest,
} from "../../core/testing/mod.ts";

export type RequestedTestScope =
  | { readonly kind: "full" }
  | { readonly kind: "requirement"; readonly requirementId: string }
  | { readonly kind: "route"; readonly method: string; readonly path: string };

export interface TestRouteOwner {
  readonly method: string;
  readonly path: string;
  readonly requirementId: string;
}

export interface TestIsolationPolicy {
  readonly testId: string;
  readonly policy: "isolated" | `shared-fixture:${string}`;
}

export interface TestRunnerPermissions {
  readonly read?: readonly string[];
  readonly write?: readonly string[];
  readonly run?: readonly string[];
  readonly env?: readonly string[];
  readonly net?: readonly string[];
  readonly unstableKv?: boolean;
}

export interface TestCommandInventory {
  readonly projectRootDisplay: string;
  readonly requirements: readonly RequirementEvidence[];
  readonly dependencyGraph: readonly RequirementDependency[];
  readonly routes: readonly TestRouteOwner[];
  readonly manifest: TestManifest;
  readonly isolation: readonly TestIsolationPolicy[];
  readonly hasUnownedSharedChange?: boolean;
  readonly permissions?: TestRunnerPermissions;
  readonly timeoutMs?: number;
  readonly denoExecutable?: string;
}

export interface TestCommandDiagnostic {
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly summary: string;
  readonly correction: string;
  readonly testId?: string;
  readonly file?: string;
  readonly criteria?: readonly string[];
  readonly requirementId?: string;
}

export interface TestIsolationGroup {
  readonly id: string;
  readonly kind: "isolated" | "shared";
  readonly testIds: readonly string[];
}

export interface TestCommandPlan {
  readonly mode: "test";
  readonly requestedScope: RequestedTestScope;
  readonly effectiveScope: "full" | "targeted";
  readonly selectedRequirements: readonly string[];
  readonly selectedTests: readonly string[];
  readonly files: readonly string[];
  readonly registeredNames: readonly string[];
  readonly filter: string | null;
  readonly isolationGroups: readonly TestIsolationGroup[];
  readonly diagnostics: readonly TestCommandDiagnostic[];
}

export interface RawTestEvent {
  readonly file: string;
  readonly name: string;
  readonly status: "passed" | "failed" | "skipped";
  readonly durationMs?: number;
  readonly evidence?: string;
}

export interface TestRunnerResult {
  readonly status: "passed" | "failed";
  readonly durationMs: number;
  readonly events: readonly RawTestEvent[];
  readonly evidence?: string;
}

export interface TestCommandIo {
  readonly cwd: string;
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}

export interface DenoTestInvocation {
  readonly command: string;
  readonly cwd: string;
  readonly args: readonly string[];
  readonly env: Readonly<Record<string, string>>;
}

export interface DenoTestInvocationOptions {
  readonly projectRoot: string;
  readonly denoExecutable?: string;
  readonly permissions?: TestRunnerPermissions;
}

export interface DenoTestRunnerOptions extends DenoTestInvocationOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export interface TestCommandTestResult {
  readonly id: string;
  readonly file: string;
  readonly name: string;
  readonly criteria: readonly string[];
  readonly status: "passed" | "failed" | "skipped" | "unmapped";
  readonly durationMs: number | null;
  readonly evidence?: string;
}

export interface TestCommandCriterionResult {
  readonly requirementId: string;
  readonly criterionId: string;
  readonly testIds: readonly string[];
  readonly status: "passing" | "failing" | "skipped" | "unmapped";
}

export interface TestCommandResult {
  readonly schema: "sleepy-hollow-test-result/v1";
  readonly ok: boolean;
  readonly command: "test";
  readonly requestedScope: RequestedTestScope;
  readonly effectiveScope: "full" | "targeted";
  readonly selectedRequirements: readonly string[];
  readonly selectedTests: readonly string[];
  readonly tests: readonly TestCommandTestResult[];
  readonly criteria: readonly TestCommandCriterionResult[];
  readonly diagnostics: readonly TestCommandDiagnostic[];
  readonly summary: {
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
    readonly unmapped: number;
    readonly passingCriteria: number;
    readonly failingCriteria: number;
    readonly skippedCriteria: number;
    readonly unmappedCriteria: number;
    readonly durationMs: number;
  };
  readonly verificationStateChanged: false;
}

export type TestInventoryLoader = (options: {
  readonly projectRoot: string;
  readonly scope: RequestedTestScope;
}) => TestCommandInventory | Promise<TestCommandInventory>;

export type TestRunner = (
  plan: TestCommandPlan,
  inventory: TestCommandInventory,
) => TestRunnerResult | Promise<TestRunnerResult>;
