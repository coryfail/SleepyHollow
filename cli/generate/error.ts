import type { GenerationDiagnostic } from "./types.ts";

export class GenerationError extends Error {
  constructor(readonly diagnostics: readonly GenerationDiagnostic[]) {
    super("Sleepy Hollow contract generation failed");
    this.name = "GenerationError";
  }
}
