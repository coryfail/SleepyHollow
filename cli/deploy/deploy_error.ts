import type { DeployDiagnostic } from "./types.ts";

export class DeployError extends Error {
  readonly diagnostics: readonly DeployDiagnostic[];

  constructor(diagnostics: readonly DeployDiagnostic[]) {
    super("Sleepy Hollow deployment validation failed");
    this.name = "DeployError";
    this.diagnostics = [...diagnostics].sort((left, right) =>
      left.code.localeCompare(right.code)
    );
  }
}
