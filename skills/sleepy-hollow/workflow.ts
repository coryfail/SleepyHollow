import type { CheckResult } from "../../cli/check/mod.ts";
import type { RedStateResult } from "../../core/testing/mod.ts";
import { SkillError } from "./skill_error.ts";
import type {
  DeploymentIntent,
  EndpointWorkRequest,
  RepairRequest,
  SkillDiagnostic,
  WorkflowPhase,
} from "./types.ts";

const artifactPhases: readonly WorkflowPhase[] = [
  "decomposition",
  "endpoint-review",
  "red-state",
  "implementation",
  "verification",
  "delivery",
];

const codePhases: readonly WorkflowPhase[] = [
  "red-state",
  "implementation",
  "verification",
  "delivery",
];

function diagnostic(
  code: string,
  path: string,
  message: string,
  correction: string,
): SkillDiagnostic {
  return { code, path, line: 1, column: 1, message, correction };
}

function isRequirement(artifact: string): boolean {
  return artifact.endsWith(".req.md");
}

export function applicationReview(
  phase: WorkflowPhase,
  artifacts: readonly string[],
): void {
  const diagnostics: SkillDiagnostic[] = [];
  for (const artifact of artifacts) {
    if (!artifactPhases.includes(phase)) {
      diagnostics.push(diagnostic(
        "SH_SKILL_APPLICATION_REVIEW_REQUIRED",
        artifact,
        "Endpoint artifacts require a reviewed and approved application requirement.",
        "Present the application requirement for review before creating endpoint artifacts.",
      ));
      continue;
    }
    if (!isRequirement(artifact) && !codePhases.includes(phase)) {
      diagnostics.push(diagnostic(
        "SH_SKILL_PREMATURE_CODE",
        artifact,
        "Decomposition proposes requirements only; it cannot create tests or implementation.",
        "Create endpoint code after the endpoint requirement is approved.",
      ));
    }
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
}

export function implementation(
  request: EndpointWorkRequest,
  redState: RedStateResult | undefined,
): void {
  const diagnostics: SkillDiagnostic[] = [];
  const path = `${request.path}/${request.requirementId}.req.md`;
  if (request.status === "draft" || !request.approvalValid) {
    diagnostics.push(diagnostic(
      "SH_SKILL_APPROVAL_REQUIRED",
      path,
      `Implementation of ${request.requirementId} requires valid approval bound to its own current content.`,
      "Obtain exact-content approval for this endpoint before implementing it.",
    ));
  }
  const mapped = new Set(request.mappedCriteria);
  for (const criterion of request.approvedCriteria) {
    if (!mapped.has(criterion)) {
      diagnostics.push(diagnostic(
        "SH_SKILL_CRITERION_UNMAPPED",
        path,
        `Approved criterion ${criterion} maps to no test.`,
        "Map every approved criterion to at least one test before implementing.",
      ));
    }
  }
  if (!redState) {
    diagnostics.push(diagnostic(
      "SH_SKILL_RED_STATE_REQUIRED",
      path,
      "Implementation requires recorded pre-implementation test evidence.",
      "Run the mapped tests against the current baseline before implementing.",
    ));
  } else if (redState.kind === "broken-baseline") {
    diagnostics.push(diagnostic(
      "SH_SKILL_BASELINE_BROKEN",
      path,
      "The baseline failed for an unrelated reason and cannot demonstrate missing behavior.",
      "Repair the baseline, then rerun the mapped tests before implementing.",
    ));
  } else if (!redState.valid) {
    diagnostics.push(diagnostic(
      "SH_SKILL_RED_STATE_INVALID",
      path,
      "Recorded pre-implementation evidence does not demonstrate the approved missing behavior.",
      "Correct the mapped tests so each failure identifies approved missing behavior.",
    ));
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
}

export function repair(request: RepairRequest): void {
  const diagnostics: SkillDiagnostic[] = [];
  if (request.changesApprovedBehavior) {
    diagnostics.push(diagnostic(
      "SH_SKILL_BEHAVIOR_CHANGE_REQUIRES_REVIEW",
      `${request.requirementId}`,
      "Bounded repair cannot change approved behavior.",
      "Return the requirement to review instead of altering approved behavior.",
    ));
  }
  if (request.weakensMappedTests) {
    diagnostics.push(diagnostic(
      "SH_SKILL_TEST_WEAKENED",
      `${request.requirementId}`,
      "Bounded repair cannot weaken a mapped acceptance test.",
      "Repair the implementation so the unchanged test passes.",
    ));
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
}

export function verification(check: CheckResult | undefined): "verified" {
  if (!check) {
    throw new SkillError([diagnostic(
      "SH_SKILL_CHECK_EVIDENCE_REQUIRED",
      "requirement.req.md",
      "Verification requires independent hollow check evidence.",
      "Run hollow check and record its result before declaring verification.",
    )]);
  }
  if (!check.ok) {
    throw new SkillError([diagnostic(
      "SH_SKILL_CHECK_FAILED",
      check.projectRoot,
      `Independent verification failed with ${check.summary.failed} failed checks.`,
      "Resolve every reported diagnostic and rerun hollow check.",
    )]);
  }
  return "verified";
}

export function deployment(intent: DeploymentIntent): void {
  const requiresConfirmation = intent.firstExternalDeployment ||
    intent.materiallyRisky;
  if (!requiresConfirmation) return;
  const diagnostics: SkillDiagnostic[] = [];
  if (!intent.confirmed) {
    diagnostics.push(diagnostic(
      "SH_SKILL_DEPLOY_CONFIRMATION_REQUIRED",
      intent.target,
      "The first external deployment or a materially risky change requires explicit confirmation.",
      "Present the deployment plan and obtain confirmation before deploying.",
    ));
  } else if (!intent.confirmationSource) {
    diagnostics.push(diagnostic(
      "SH_SKILL_DEPLOY_CONFIRMATION_SOURCE_REQUIRED",
      intent.target,
      "Recorded deployment confirmation must identify its decision source.",
      "Record who confirmed the deployment and where the decision was made.",
    ));
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
}
