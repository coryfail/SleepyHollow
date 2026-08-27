import { SkillError } from "./skill_error.ts";
import type { PersistencePlan, SkillDiagnostic } from "./types.ts";

/** Builds one planning diagnostic for an invalid persistence decision. */
function diagnostic(
  code: string,
  message: string,
  correction: string,
): SkillDiagnostic {
  return {
    code,
    path: "requirements/application.req.md",
    line: 1,
    column: 1,
    message,
    correction,
  };
}

/** Enforces Drizzle as the default for application data that must persist. */
export function persistencePlan(plan: PersistencePlan): void {
  const diagnostics: SkillDiagnostic[] = [];
  if (!plan.durableData) {
    if (plan.orm !== "none") {
      diagnostics.push(diagnostic(
        "SH_SKILL_PERSISTENCE_INCONSISTENT",
        "A plan without durable data cannot select a persistence ORM.",
        "Record orm as none, or record the durable data that requires persistence.",
      ));
    }
    if (diagnostics.length > 0) throw new SkillError(diagnostics);
    return;
  }

  if (plan.orm === "drizzle") {
    if (!plan.adapter) {
      diagnostics.push(diagnostic(
        "SH_SKILL_DATABASE_PROFILE_REQUIRED",
        "A durable Drizzle plan must choose the SQLite or PostgreSQL profile.",
        "Select the supported database profile before implementation.",
      ));
    }
  } else if (plan.orm === "none" || !plan.humanApprovedAlternative) {
    diagnostics.push(diagnostic(
      "SH_SKILL_DRIZZLE_REQUIRED",
      "Durable application data defaults to Drizzle.",
      "Use Drizzle, or obtain an explicit human decision approving a named alternative.",
    ));
  } else if (!plan.approvalSource?.trim()) {
    diagnostics.push(diagnostic(
      "SH_SKILL_PERSISTENCE_APPROVAL_SOURCE_REQUIRED",
      "A non-Drizzle persistence choice must identify the human approval source.",
      "Record the human's explicit alternative and confirmation in the application requirement.",
    ));
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
}
