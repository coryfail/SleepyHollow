import type { SkillDiagnostic } from "./types.ts";

export class SkillError extends Error {
  readonly diagnostics: readonly SkillDiagnostic[];

  constructor(diagnostics: readonly SkillDiagnostic[]) {
    super("Sleepy Hollow skill workflow validation failed");
    this.name = "SkillError";
    this.diagnostics = [...diagnostics].sort((left, right) =>
      left.path.localeCompare(right.path) || left.line - right.line ||
      left.column - right.column || left.code.localeCompare(right.code)
    );
  }
}
