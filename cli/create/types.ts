export interface CreationDiagnostic {
  readonly code: string;
  readonly summary: string;
  readonly path?: string;
  readonly correction: string;
}

export interface CreationResult {
  readonly ok: true;
  readonly command: "create";
  readonly version: string;
  readonly projectPath: string;
  readonly createdFiles: readonly string[];
  readonly nextActions: readonly string[];
  readonly diagnostics: readonly [];
}

export class CreationError extends Error {
  constructor(readonly diagnostics: readonly CreationDiagnostic[]) {
    super(
      diagnostics.map((item) => `${item.code}: ${item.summary}`).join("\n"),
    );
    this.name = "CreationError";
  }
}

export interface CreateProjectOptions {
  readonly name: string;
  readonly directory: string;
}

export interface CliIo {
  readonly cwd: string;
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}
