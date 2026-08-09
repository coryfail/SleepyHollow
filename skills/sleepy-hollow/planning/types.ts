export type RequirementKind = "application" | "endpoint";
export type RequirementStatus = "draft" | "approved" | "verified";

export interface PlanningDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly correction: string;
}

export interface AcceptanceCriterion {
  readonly id: string;
  readonly text: string;
  readonly line: number;
}

export interface RequirementApproval {
  readonly approver: string;
  readonly approvedAt: string;
  readonly criteria: readonly string[];
  readonly digest: string;
  readonly decisionSource: string;
  readonly valid: boolean;
}

export interface ParsedRequirement {
  readonly kind: RequirementKind;
  readonly path: string;
  readonly source: string;
  readonly body: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly id: string;
  readonly status: RequirementStatus;
  readonly dependsOn: readonly string[];
  readonly criteria: readonly AcceptanceCriterion[];
  readonly sections: ReadonlyMap<string, string>;
  readonly governedContentDigest: string;
  readonly approval?: RequirementApproval;
}

export interface EndpointProposal {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly methods: readonly string[];
  readonly service: string;
  readonly dependsOn?: readonly string[];
  readonly purpose: string;
  readonly inputs: string;
  readonly successResponses: string;
  readonly errors: string;
  readonly security: string;
  readonly dataAccess: string;
  readonly sideEffects: string;
  readonly abuseConsiderations: string;
  readonly assumptions: string;
  readonly acceptanceCriteria: readonly {
    readonly id: string;
    readonly text: string;
  }[];
  readonly sourceSections: readonly string[];
  readonly conflicts?: readonly {
    readonly applicationText: string;
    readonly proposedText: string;
  }[];
}

export interface ProposedRequirementFile {
  readonly path: string;
  readonly source: string;
  readonly requirementId: string;
}

export interface DecompositionPlan {
  readonly directories: readonly string[];
  readonly files: readonly ProposedRequirementFile[];
  readonly dependencyOrder: readonly string[];
}

export interface PlanningDocument {
  readonly path: string;
  readonly source: string;
}

export interface PlanningDecision {
  readonly action: "approve" | "revise" | "defer" | "reject";
  readonly requirementIds: readonly string[];
  readonly actor: string;
  readonly at: string;
  readonly decisionSource: string;
  readonly rationale?: string;
}

export interface PlanningDecisionResult {
  readonly documents: readonly PlanningDocument[];
  readonly changedRequirementIds: readonly string[];
  readonly reviewRequired: readonly string[];
}
