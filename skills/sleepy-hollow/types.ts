import type { CheckResult } from "../../cli/check/mod.ts";
import type { RedStateResult } from "../../core/testing/mod.ts";

export type DiscoveryTopic =
  | "resources"
  | "persistence"
  | "authentication"
  | "authorization"
  | "consumers"
  | "operations"
  | "deployment"
  | "service-architecture";

export interface SkillDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly correction: string;
}

export interface ProjectInspection {
  readonly path: string;
  readonly exists: boolean;
  readonly resolvedTopics: readonly DiscoveryTopic[];
  readonly declaredServices: readonly string[];
}

export interface DiscoveryQuestion {
  readonly topic: DiscoveryTopic;
  readonly prompt: string;
  readonly rationale: string;
}

export interface AuthenticationPlan {
  readonly required: boolean;
  readonly actors: readonly string[];
  readonly trustBoundaries: readonly string[];
  readonly credential: "none" | "session" | "token" | "api-key" | "external";
  readonly expiration?: string;
  readonly revocation?: string;
  readonly transport?: string;
  readonly csrf?: string;
  readonly unauthenticatedBehavior?: string;
  readonly unauthorizedBehavior?: string;
}

export type WorkflowPhase =
  | "discovery"
  | "application-review"
  | "decomposition"
  | "endpoint-review"
  | "red-state"
  | "implementation"
  | "verification"
  | "delivery";

export interface EndpointWorkRequest {
  readonly requirementId: string;
  readonly path: string;
  readonly status: "draft" | "approved" | "verified";
  readonly approvalValid: boolean;
  readonly approvedCriteria: readonly string[];
  readonly mappedCriteria: readonly string[];
}

export interface RepairRequest {
  readonly requirementId: string;
  readonly changedFiles: readonly string[];
  readonly changesApprovedBehavior: boolean;
  readonly weakensMappedTests: boolean;
}

export interface DeploymentIntent {
  readonly target: string;
  readonly firstExternalDeployment: boolean;
  readonly materiallyRisky: boolean;
  readonly confirmed: boolean;
  readonly confirmationSource?: string;
}

export interface CompletionInput {
  readonly requirementId: string;
  readonly changedFiles: readonly string[];
  readonly approvedCriteria: readonly string[];
  readonly mappedCriteria: readonly string[];
  readonly redState?: RedStateResult;
  readonly check?: CheckResult;
  readonly contractArtifacts: readonly string[];
  readonly deployment?: {
    readonly target: string;
    readonly url: string;
    readonly revision: string;
  };
  readonly residualRisks: readonly string[];
}

export interface CompletionReport {
  readonly schema: "sleepy-hollow-completion-report/v1";
  readonly requirementId: string;
  readonly changedFiles: readonly string[];
  readonly criterionCoverage: readonly {
    readonly criterionId: string;
    readonly covered: boolean;
  }[];
  readonly verification: {
    readonly status: "passed" | "failed" | "not-run";
    readonly evidence: readonly string[];
  };
  readonly contractArtifacts: readonly string[];
  readonly deployment?: {
    readonly target: string;
    readonly url: string;
    readonly revision: string;
  };
  readonly residualRisks: readonly string[];
}

export interface SkillInstructionSource {
  readonly path: string;
  readonly source: string;
}

export interface InstructionAudit {
  readonly mandatoryConstraints: readonly string[];
  readonly referencePaths: readonly string[];
}
