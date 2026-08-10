import type { EvidenceDiagnostic } from "./types.ts";

export class EvidenceError extends Error {
  readonly diagnostics: readonly EvidenceDiagnostic[];

  constructor(diagnostics: readonly EvidenceDiagnostic[]) {
    super("Sleepy Hollow repository evidence could not be loaded");
    this.name = "EvidenceError";
    this.diagnostics = [...diagnostics].sort((left, right) =>
      left.path.localeCompare(right.path) ||
      (left.line ?? 0) - (right.line ?? 0) ||
      left.code.localeCompare(right.code)
    );
  }
}
