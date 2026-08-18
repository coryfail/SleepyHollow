import { parseRequirementDocument } from "./parser.ts";
export { PlanningError } from "./planning_error.ts";
import { applyDecision, decompose, validateApplication } from "./workflow.ts";
import type {
  DecompositionPlan,
  EndpointProposal,
  ParsedRequirement,
  PlanningDecision,
  PlanningDecisionResult,
  PlanningDocument,
  RequirementKind,
} from "./types.ts";

export * from "./types.ts";

export function parseRequirement(
  source: string,
  path: string,
  kind: RequirementKind,
): ParsedRequirement {
  return parseRequirementDocument(source, path, kind);
}

export function validateApplicationRequirement(
  source: string,
  path = "requirements/application.req.md",
): ParsedRequirement {
  return validateApplication(source, path);
}

export function decomposeApplication(
  application: PlanningDocument,
  endpoints: readonly EndpointProposal[],
): DecompositionPlan {
  return decompose(application, endpoints);
}

export function applyPlanningDecision(
  documents: readonly PlanningDocument[],
  decision: PlanningDecision,
): PlanningDecisionResult {
  return applyDecision(documents, decision);
}
