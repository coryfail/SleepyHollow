import type { PlanningDiagnostic } from "./types.ts";

export class PlanningError extends Error {
  readonly diagnostics: readonly PlanningDiagnostic[];

  constructor(diagnostics: readonly PlanningDiagnostic[]) {
    super("Sleepy Hollow planning validation failed");
    this.name = "PlanningError";
    this.diagnostics = [...diagnostics].sort((left, right) =>
      left.path.localeCompare(right.path) || left.line - right.line ||
      left.column - right.column || left.code.localeCompare(right.code)
    );
  }
}
