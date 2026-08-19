import type {
  RequirementDependency,
  RequirementEvidence,
  TestExecutionResult,
  TestManifest,
} from "../../core/testing/mod.ts";
import type { ContractChange, GenerationResult } from "../generate/mod.ts";

export type CheckPhase =
  | "governance"
  | "runner"
  | "traceability"
  | "routes"
  | "schemas"
  | "security"
  | "data"
  | "configuration"
  | "generated"
  | "changes"
  | "eligibility";

export type RequestedCheckScope =
  | { readonly kind: "full" }
  | { readonly kind: "requirement"; readonly requirementId: string }
  | { readonly kind: "route"; readonly method: string; readonly path: string };

export interface CheckLocation {
  readonly path?: string;
  readonly route?: string;
  readonly requirementId?: string;
  readonly criterionId?: string;
  readonly field?: string;
  readonly operation?: string;
  readonly configKey?: string;
}

export interface CheckDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly phase: CheckPhase;
  readonly summary: string;
  readonly location: CheckLocation;
  readonly evidence: Readonly<Record<string, unknown>>;
  readonly correction: string;
}

export interface VerificationCheck {
  readonly id: string;
  readonly phase: CheckPhase;
  readonly status: "passed" | "failed" | "skipped";
  readonly evidence: readonly string[];
}

export interface CheckRequirement extends RequirementEvidence {
  readonly path: string;
  readonly routePath?: string;
  readonly methods?: readonly string[];
  readonly requiresAuthorization?: boolean;
  readonly redStateValid: boolean;
}

export interface CheckRoute {
  readonly requirementId: string;
  readonly method: string;
  readonly path: string;
  readonly source: string;
  readonly requestSchemaLocations: readonly (
    | "params"
    | "query"
    | "headers"
    | "body"
  )[];
  readonly requiredRequestLocations: readonly (
    | "params"
    | "query"
    | "headers"
    | "body"
  )[];
  readonly responseSchemaStatuses: readonly number[];
  readonly requiredResponseStatuses: readonly number[];
  readonly authentication: "none" | "required";
  readonly authorizationRequirementId?: string;
  readonly authorizationGuard?: string;
  readonly captured?: boolean;
}

export interface CheckDataOperation {
  readonly id: string;
  readonly requirementId: string;
  readonly source: string;
  readonly resource: string;
  readonly kind: "get" | "query" | "read-modify-write" | "raw";
  readonly index?: string;
  readonly declaredIndexes: readonly string[];
  readonly limit?: number;
  readonly versionstampCheck?: boolean;
  readonly atomic?: boolean;
  readonly rawJustification?: string;
  readonly ownerServiceId?: string;
  readonly requesterServiceId?: string;
}

export interface CaptureEvidence {
  readonly present: boolean;
  readonly stale?: boolean;
  readonly unreadable?: boolean;
  readonly uncapturedRoutes: readonly {
    readonly method: string;
    readonly path: string;
    readonly requirementId?: string;
    readonly justification?: string;
  }[];
}

export interface VerificationInventory {
  readonly capture?: CaptureEvidence;
  readonly projectRootDisplay: string;
  readonly requestedScope: RequestedCheckScope;
  readonly requirements: readonly CheckRequirement[];
  readonly dependencyGraph: readonly RequirementDependency[];
  readonly testManifest: TestManifest;
  readonly previousTestManifest?: TestManifest;
  readonly testResults: readonly TestExecutionResult[];
  readonly reviewedTestIds?: readonly string[];
  readonly routes: readonly CheckRoute[];
  readonly dataOperations: readonly CheckDataOperation[];
  readonly typecheck: {
    readonly status: "passed" | "failed";
    readonly evidence: string;
  };
  readonly testRunner: {
    readonly status: "passed" | "failed";
    readonly evidence: string;
  };
  readonly configurationDiagnostics: readonly {
    readonly code: string;
    readonly key?: string;
    readonly summary: string;
    readonly correction: string;
  }[];
  readonly generation?: GenerationResult;
  readonly contractChanges?: readonly ContractChange[];
  readonly reviewedContractChangeCodes?: readonly string[];
  readonly reviewedContractChanges?: readonly {
    readonly code: string;
    readonly operationId: string;
    readonly element: string;
    readonly previousContractDigest: string;
    readonly currentContractDigest: string;
  }[];
  readonly previousContractDigest?: string;
  readonly currentContractDigest?: string;
  readonly pendingDataDecisions?: readonly {
    readonly requirementId: string;
    readonly summary: string;
  }[];
  readonly hasUnownedSharedChange?: boolean;
  readonly sourceClaims?: Readonly<Record<string, unknown>>;
}

export interface CheckResult {
  readonly schema: "sleepy-hollow-check-result/v1";
  readonly ok: boolean;
  readonly command: "check";
  readonly projectRoot: string;
  readonly requestedScope: RequestedCheckScope;
  readonly effectiveScope: "full" | "targeted";
  readonly selectedRequirements: readonly string[];
  readonly selectedTests: readonly string[];
  readonly checks: readonly VerificationCheck[];
  readonly diagnostics: readonly CheckDiagnostic[];
  readonly summary: {
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
    readonly errors: number;
    readonly warnings: number;
  };
}

export interface NodeVerificationRunnerOptions {
  readonly projectRoot: string;
  readonly typecheckFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly nodeExecutable?: string;
}

export interface NodeVerificationRunnerResult {
  readonly typecheck: {
    readonly status: "passed" | "failed";
    readonly evidence: string;
  };
  readonly testRunner: {
    readonly status: "passed" | "failed";
    readonly evidence: string;
  };
  readonly testOutput: string;
}

export interface CheckCommandIo {
  readonly cwd: string;
  stdout(value: string): void;
  stderr(value: string): void;
}
