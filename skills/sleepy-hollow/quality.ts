import { SkillError } from "./skill_error.ts";
import type { CodeQualityVerification, SkillDiagnostic } from "./types.ts";

/** Builds one verification diagnostic for missing or failed style evidence. */
function diagnostic(
  code: string,
  message: string,
  correction: string,
): SkillDiagnostic {
  return {
    code,
    path: "package.json",
    line: 1,
    column: 1,
    message,
    correction,
  };
}

/** Requires current formatter and linter results before delivery verification. */
export function codeQuality(
  evidence: CodeQualityVerification | undefined,
): void {
  if (!evidence) {
    throw new SkillError([diagnostic(
      "SH_SKILL_CODE_QUALITY_EVIDENCE_REQUIRED",
      "Verification requires formatter and linter evidence for the current revision.",
      "Run the configured format check and linter before hollow check.",
    )]);
  }
  const diagnostics: SkillDiagnostic[] = [];
  if (evidence.formatter !== "passed") {
    diagnostics.push(diagnostic(
      evidence.formatter === "failed"
        ? "SH_SKILL_FORMAT_CHECK_FAILED"
        : "SH_SKILL_FORMAT_CHECK_REQUIRED",
      evidence.formatter === "failed"
        ? "The project formatter reported style violations."
        : "The project formatter has not run for the current revision.",
      "Format the changed source and rerun the formatter check.",
    ));
  }
  if (evidence.linter !== "passed") {
    diagnostics.push(diagnostic(
      evidence.linter === "failed" ? "SH_SKILL_LINT_FAILED" : "SH_SKILL_LINT_REQUIRED",
      evidence.linter === "failed"
        ? "The project linter reported code-quality violations."
        : "The project linter has not run for the current revision.",
      "Repair the reported code-quality violations and rerun the linter.",
    ));
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
}
