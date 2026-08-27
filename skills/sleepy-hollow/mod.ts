import type { CheckResult } from "../../cli/check/mod.ts";
import type { RedStateResult } from "../../core/testing/mod.ts";
import { authenticationPlan, questions } from "./discovery.ts";
import { instructions, MANDATORY_CONSTRAINTS } from "./instructions.ts";
import { persistencePlan } from "./persistence.ts";
import { codeQuality } from "./quality.ts";
import { completion } from "./report.ts";
export { SkillError } from "./skill_error.ts";
import {
  applicationReview,
  deployment,
  implementation,
  repair,
  verification,
} from "./workflow.ts";
import type {
  AuthenticationPlan,
  CodeQualityVerification,
  CompletionInput,
  CompletionReport,
  DeploymentIntent,
  DiscoveryQuestion,
  EndpointWorkRequest,
  InstructionAudit,
  ProjectInspection,
  PersistencePlan,
  RepairRequest,
  SkillInstructionSource,
  WorkflowPhase,
} from "./types.ts";

export * from "./types.ts";
export { MANDATORY_CONSTRAINTS };

export function deriveDiscoveryQuestions(
  inspection: ProjectInspection,
  idea: string,
): readonly DiscoveryQuestion[] {
  return questions(inspection, idea);
}

export function validateAuthenticationPlan(plan: AuthenticationPlan): void {
  authenticationPlan(plan);
}

/** Validates the default-or-approved-exception persistence decision. */
export function validatePersistencePlan(plan: PersistencePlan): void {
  persistencePlan(plan);
}

/** Validates formatter and linter evidence collected for the current revision. */
export function validateCodeQualityVerification(
  evidence: CodeQualityVerification | undefined,
): void {
  codeQuality(evidence);
}

export function authorizeArtifactCreation(
  phase: WorkflowPhase,
  artifacts: readonly string[],
): void {
  applicationReview(phase, artifacts);
}

export function authorizeImplementation(
  request: EndpointWorkRequest,
  redState?: RedStateResult,
): void {
  implementation(request, redState);
}

export function authorizeRepair(request: RepairRequest): void {
  repair(request);
}

export function concludeVerification(
  check: CheckResult | undefined,
  quality: CodeQualityVerification | undefined,
): "verified" {
  return verification(check, quality);
}

export function authorizeDeployment(intent: DeploymentIntent): void {
  deployment(intent);
}

export function buildCompletionReport(
  input: CompletionInput,
): CompletionReport {
  return completion(input);
}

export function auditSkillInstructions(
  primary: SkillInstructionSource,
  references: readonly SkillInstructionSource[],
): InstructionAudit {
  return instructions(primary, references);
}
