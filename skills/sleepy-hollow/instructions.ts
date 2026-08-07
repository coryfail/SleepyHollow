import { SkillError } from "./skill_error.ts";
import type {
  InstructionAudit,
  SkillDiagnostic,
  SkillInstructionSource,
} from "./types.ts";

export const MANDATORY_CONSTRAINTS: readonly string[] = [
  "Do not implement an endpoint before its requirement is approved.",
  "Generate mapped tests and observe the expected failure before implementation.",
  "Report an unexpected baseline failure instead of treating it as red state.",
  "Repair implementation only; return behavioral change to requirement review.",
  "Declare verification only from independent `hollow check` evidence.",
  "Confirm the first external deployment or a materially risky change.",
];

export function instructions(
  primary: SkillInstructionSource,
  references: readonly SkillInstructionSource[],
): InstructionAudit {
  const diagnostics: SkillDiagnostic[] = [];
  for (const constraint of MANDATORY_CONSTRAINTS) {
    if (primary.source.includes(constraint)) continue;
    const carrier = references.find((reference) =>
      reference.source.includes(constraint)
    );
    diagnostics.push({
      code: "SH_SKILL_CONSTRAINT_NOT_PRIMARY",
      path: carrier?.path ?? primary.path,
      line: 1,
      column: 1,
      message: carrier
        ? `Mandatory constraint "${constraint}" appears only in ${carrier.path}.`
        : `Mandatory constraint "${constraint}" is absent from the skill instructions.`,
      correction:
        "State every mandatory workflow constraint in the primary skill instructions.",
    });
  }
  for (const reference of references) {
    if (primary.source.includes(reference.path.split("/").pop() ?? "")) {
      continue;
    }
    diagnostics.push({
      code: "SH_SKILL_REFERENCE_UNROUTED",
      path: reference.path,
      line: 1,
      column: 1,
      message:
        `The primary skill instructions do not route to ${reference.path}.`,
      correction: "Link every reference from the primary skill instructions.",
    });
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
  return {
    mandatoryConstraints: [...MANDATORY_CONSTRAINTS],
    referencePaths: references.map((reference) => reference.path),
  };
}
