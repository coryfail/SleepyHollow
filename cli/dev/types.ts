export interface DevDiagnostic {
  readonly code: string;
  readonly severity: "error";
  readonly summary: string;
  readonly correction: string;
  readonly files?: readonly string[];
  readonly routes?: readonly string[];
  readonly configuration?: readonly string[];
}

export interface DevEvent {
  readonly schema: "sleepy-hollow-dev-event/v1";
  readonly command: "dev";
  readonly sequence: number;
  readonly type: "startup" | "reload" | "diagnostic" | "shutdown";
  readonly state: "active" | "rejected" | "stopped";
  readonly generation: number;
  readonly mode: "development";
  readonly url?: string;
  readonly routeCount?: number;
  readonly changedFiles?: readonly string[];
  readonly reason?: "interrupt" | "termination" | "cancelled" | "failure";
  readonly diagnostics: readonly DevDiagnostic[];
}

export interface DevCommandIo {
  readonly cwd: string;
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}

export interface DevPrepareOptions {
  readonly projectRoot: string;
  readonly hostname: "127.0.0.1";
  readonly port: number;
  readonly mode: "development";
  readonly generation: number;
  readonly signal: AbortSignal;
}

export interface ActiveDevRuntime {
  readonly url: string;
  readonly routeCount: number;
  /** Rejects if a serving worker exits unexpectedly after activation. */
  readonly failure?: Promise<never>;
  stop(): void | Promise<void>;
}

export interface PreparedDevRuntime {
  readonly routeCount: number;
  activate(): ActiveDevRuntime | Promise<ActiveDevRuntime>;
  close?(): void | Promise<void>;
}

export interface DevWatcher extends AsyncIterable<readonly string[]> {
  close(): void | Promise<void>;
}

export interface DevDependencies {
  readonly prepare: (
    options: DevPrepareOptions,
  ) => PreparedDevRuntime | Promise<PreparedDevRuntime>;
  readonly watch: (options: {
    readonly projectRoot: string;
    readonly signal: AbortSignal;
  }) => DevWatcher | Promise<DevWatcher>;
  readonly signal?: AbortSignal;
  readonly dispose?: () => void | Promise<void>;
}

export class DevCommandError extends Error {
  constructor(readonly diagnostics: readonly DevDiagnostic[]) {
    super(
      diagnostics.map((item) => `${item.code}: ${item.summary}`).join("\n"),
    );
    this.name = "DevCommandError";
  }
}
