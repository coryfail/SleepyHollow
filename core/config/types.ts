import type { z } from "zod";

/** The runtime modes a project may be configured for. */
export const RUNTIME_MODES = [
  "development",
  "test",
  "preview",
  "production",
] as const;

/** One of the {@linkcode RUNTIME_MODES} a process may run in. */
export type RuntimeMode = (typeof RUNTIME_MODES)[number];

/** One schema per runtime mode: what configuration that mode requires. */
export type ModeSchemas = Readonly<Record<RuntimeMode, z.ZodObject>>;

/**
 * A project's configuration contract.
 *
 * Each mode carries its own schema, so production can demand values that
 * development supplies a default for, and the difference is stated rather than
 * discovered on deployment.
 */
export interface ConfigurationDefinition<Schemas extends ModeSchemas> {
  /** The schema each runtime mode must satisfy. */
  readonly modes: Schemas;
  /** Keys whose values are redacted from metadata and logs. */
  readonly sensitiveKeys?: readonly string[];
  /** Env files read in the named modes; never consulted in production. */
  readonly localEnvFiles?: Readonly<
    Partial<Record<"development" | "test", string>>
  >;
}

/** One reason configuration could not be resolved. */
export interface ConfigurationDiagnostic {
  /** Stable machine-readable identifier for this kind of fault. */
  readonly code: string;
  /** Configuration faults are always fatal; there are no warnings. */
  readonly severity: "error";
  /** The mode being resolved, when the fault is specific to one. */
  readonly mode?: RuntimeMode;
  /** The configuration key concerned; omitted for whole-shape faults. */
  readonly key?: string;
  /** What was required of the value. */
  readonly expected: string;
  /** What to change to resolve it. */
  readonly correction: string;
}

/**
 * Thrown when configuration cannot be resolved.
 *
 * Raised at startup rather than at first use, so a missing value stops the
 * process instead of failing the first request that happens to need it. The
 * message names keys but never their values, which may be secrets.
 */
export class ConfigurationError extends Error {
  /**
   * Builds an error whose message lists every diagnostic, one per line.
   *
   * @param diagnostics Every fault found, in the order detected.
   */
  constructor(readonly diagnostics: readonly ConfigurationDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.key ?? diagnostic.expected}`
      ).join("\n"),
    );
    this.name = "ConfigurationError";
  }
}

/** Where one configuration key's value came from, without the value. */
export interface ConfigurationKeyMetadata {
  /** The key's name. */
  readonly name: string;
  /** Which source supplied it, or `absent` when nothing did. */
  readonly source: "absent" | "default" | "env-file" | "environment";
  /** Whether a value was supplied at all. */
  readonly present: boolean;
  /** Whether the key was declared sensitive, and so never reported. */
  readonly sensitive: boolean;
}

/**
 * Provenance for a resolved configuration: which keys were set and from where,
 * safe to log because it carries no values.
 */
export interface ConfigurationMetadata<M extends RuntimeMode = RuntimeMode> {
  /** The mode this configuration was resolved for. */
  readonly mode: M;
  /** One entry per declared key. */
  readonly keys: readonly ConfigurationKeyMetadata[];
}

/** How to resolve configuration, and where to read it from. */
export interface ResolveConfigurationOptions<M extends RuntimeMode> {
  /** The mode to resolve for. */
  readonly mode: M;
  /** Environment to read; defaults to the process environment. */
  readonly environment?: Readonly<Record<string, string | undefined>>;
  /** Reads env files; supply your own to resolve without disk access. */
  readonly readTextFile?: (path: string) => Promise<string>;
}

/** Configuration after resolution: the values, and where they came from. */
export interface ResolvedConfiguration<M extends RuntimeMode, Values> {
  /** The mode these values were resolved for. */
  readonly mode: M;
  /** The parsed values, typed by that mode's schema. */
  readonly values: Readonly<Values>;
  /** Provenance for each key, without values. */
  readonly metadata: ConfigurationMetadata<M>;
}

/** The value type a definition yields in a given mode. */
export type ConfigurationValues<
  Definition extends ConfigurationDefinition<ModeSchemas>,
  M extends RuntimeMode,
> = z.output<Definition["modes"][M]>;

/** Severity of a log line. */
export type LogLevel = "debug" | "error" | "info" | "warn";

/** How to build a JSON logger. */
export interface JsonLoggerOptions {
  /** The mode being run in; recorded on every line. */
  readonly mode: RuntimeMode;
  /** Receives each serialized line. */
  readonly sink: (line: string) => void;
  /** Supplies timestamps; override to make log output deterministic. */
  readonly clock?: () => Date;
  /** Field names redacted from every line's context. */
  readonly sensitiveFields?: readonly string[];
}

/**
 * A logger that emits one JSON object per line.
 *
 * Declared sensitive fields are redacted from context before serialization, so
 * a secret passed to a log call does not reach the sink.
 */
export interface JsonLogger {
  /**
   * Logs at debug severity.
   *
   * @param event Stable event name, not a sentence.
   * @param context Structured detail; sensitive fields are redacted.
   */
  debug(event: string, context?: unknown): void;
  /**
   * Logs at info severity.
   *
   * @param event Stable event name, not a sentence.
   * @param context Structured detail; sensitive fields are redacted.
   */
  info(event: string, context?: unknown): void;
  /**
   * Logs at warning severity.
   *
   * @param event Stable event name, not a sentence.
   * @param context Structured detail; sensitive fields are redacted.
   */
  warn(event: string, context?: unknown): void;
  /**
   * Logs at error severity.
   *
   * @param event Stable event name, not a sentence.
   * @param context Structured detail; sensitive fields are redacted.
   */
  error(event: string, context?: unknown): void;
  /**
   * Derives a logger that stamps every line with a request identifier.
   *
   * @param requestId Correlates lines belonging to one request.
   * @returns A logger writing to the same sink.
   */
  withRequest(requestId: string): JsonLogger;
}

/** One dependency readiness probes before reporting the process ready. */
export interface ReadinessCheck {
  /** Names the dependency in the readiness response. */
  readonly name: string;
  /** How long this check may take before it counts as failed. */
  readonly timeoutMs: number;
  /**
   * Probes the dependency.
   *
   * @param signal Aborts when the check exceeds its timeout.
   * @returns Whether the dependency is usable.
   */
  check(signal: AbortSignal): Promise<boolean>;
}

/** Which operational endpoints to expose, and what they report. */
export interface OperationalRouteOptions {
  /** Path of the liveness endpoint. */
  readonly healthPath: string;
  /** Reports whether the process itself is healthy; defaults to always. */
  readonly isHealthy?: () => boolean;
  /** Path of the readiness endpoint; omit to expose liveness only. */
  readonly readinessPath?: string;
  /** Dependencies probed before reporting ready. */
  readonly readiness?: readonly ReadinessCheck[];
}
