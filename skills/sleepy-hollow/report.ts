import { SkillError } from "./skill_error.ts";
import type { CompletionInput, CompletionReport } from "./types.ts";

export function completion(input: CompletionInput): CompletionReport {
  if (input.approvedCriteria.length === 0) {
    throw new SkillError([{
      code: "SH_SKILL_REPORT_CRITERIA_REQUIRED",
      path: input.requirementId,
      line: 1,
      column: 1,
      message: "A completion report must cover every approved criterion.",
      correction: "Report the approved criteria for the selected work.",
    }]);
  }
  const mapped = new Set(input.mappedCriteria);
  const evidence: string[] = [];
  if (input.redState) {
    evidence.push(
      `red state ${input.redState.kind} at baseline ${input.redState.baselineRevision} via ${input.redState.runner}`,
    );
  }
  if (input.check) {
    evidence.push(
      `hollow check ${
        input.check.ok ? "passed" : "failed"
      } with ${input.check.summary.passed} passed and ${input.check.summary.failed} failed`,
    );
  }
  return {
    schema: "sleepy-hollow-completion-report/v1",
    requirementId: input.requirementId,
    changedFiles: [...input.changedFiles],
    criterionCoverage: input.approvedCriteria.map((criterionId) => ({
      criterionId,
      covered: mapped.has(criterionId),
    })),
    verification: {
      status: input.check ? (input.check.ok ? "passed" : "failed") : "not-run",
      evidence,
    },
    contractArtifacts: [...input.contractArtifacts],
    ...(input.deployment ? { deployment: input.deployment } : {}),
    residualRisks: [...input.residualRisks],
  };
}
