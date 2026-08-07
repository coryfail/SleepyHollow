import type { z } from "zod";

export const RUNTIME_MODES = [
  "development",
  "test",
  "preview",
  "production",
] as const;

export type RuntimeMode = (typeof RUNTIME_MODES)[number];
export type ModeSchemas = Readonly<Record<RuntimeMode, z.ZodObject>>;

export interface ConfigurationDefinition<Schemas extends ModeSchemas> {
  readonly modes: Schemas;
  readonly sensitiveKeys?: readonly string[];
  readonly localEnvFiles?: Readonly<
    Partial<Record<"development" | "test", string>>
  >;
}

export interface ConfigurationDiagnostic {
  readonly code: string;
  readonly severity: "error";
  readonly mode?: RuntimeMode;
  readonly key?: string;
  readonly expected: string;
  readonly correction: string;
}

export class ConfigurationError extends Error {
  constructor(readonly diagnostics: readonly ConfigurationDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.key ?? diagnostic.expected}`
      ).join("\n"),
    );
    this.name = "ConfigurationError";
  }
}

export interface ConfigurationKeyMetadata {
  readonly name: string;
  readonly source: "absent" | "default" | "env-file" | "environment";
  readonly present: boolean;
  readonly sensitive: boolean;
}

export interface ConfigurationMetadata<M extends RuntimeMode = RuntimeMode> {
  readonly mode: M;
  readonly keys: readonly ConfigurationKeyMetadata[];
}

export interface ResolveConfigurationOptions<M extends RuntimeMode> {
  readonly mode: M;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly readTextFile?: (path: string) => Promise<string>;
}

export interface ResolvedConfiguration<M extends RuntimeMode, Values> {
  readonly mode: M;
  readonly values: Readonly<Values>;
  readonly metadata: ConfigurationMetadata<M>;
}

export type ConfigurationValues<
  Definition extends ConfigurationDefinition<ModeSchemas>,
  M extends RuntimeMode,
> = z.output<Definition["modes"][M]>;

export type LogLevel = "debug" | "error" | "info" | "warn";

export interface JsonLoggerOptions {
  readonly mode: RuntimeMode;
  readonly sink: (line: string) => void;
  readonly clock?: () => Date;
  readonly sensitiveFields?: readonly string[];
}

export interface JsonLogger {
  debug(event: string, context?: unknown): void;
  info(event: string, context?: unknown): void;
  warn(event: string, context?: unknown): void;
  error(event: string, context?: unknown): void;
  withRequest(requestId: string): JsonLogger;
}

export interface ReadinessCheck {
  readonly name: string;
  readonly timeoutMs: number;
  check(signal: AbortSignal): Promise<boolean>;
}

export interface OperationalRouteOptions {
  readonly healthPath: string;
  readonly isHealthy?: () => boolean;
  readonly readinessPath?: string;
  readonly readiness?: readonly ReadinessCheck[];
}
