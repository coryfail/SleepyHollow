import type { z } from "zod";

/** Which part of an exchange a schema governs. */
export type ValidationLocation =
  | "params"
  | "query"
  | "headers"
  | "body"
  | "response";

/** One way a value failed its schema. */
export interface ValidationIssue {
  /** Which part of the exchange the value came from. */
  readonly location: ValidationLocation;
  /** Path to the offending field within that location. */
  readonly path: readonly PropertyKey[];
  /** Stable machine-readable identifier for this kind of failure. */
  readonly code: string;
  /** What was wrong with the value; never the value itself. */
  readonly message: string;
}

/**
 * A validation failure, as reported to the diagnostic sink.
 *
 * It names the route, the schema, and the failing paths, but never the
 * submitted values, so diagnostics stay safe to log.
 */
export interface ValidationDiagnostic {
  /** Stable machine-readable identifier for this kind of fault. */
  readonly code: string;
  /** Validation faults are always errors; there are no warnings. */
  readonly severity: "error";
  /** What is wrong, in one sentence. */
  readonly summary: string;
  /** The route that was called. */
  readonly route: string;
  /** File the route was discovered from. */
  readonly source: string;
  /** Which schema rejected the value. */
  readonly schemaLocation: string;
  /** Every issue found; validation does not stop at the first. */
  readonly issues: readonly ValidationIssue[];
  /** What to change to resolve it. */
  readonly correction: string;
}

/** How the validating router behaves. */
export interface ValidationOptions {
  /** The posture to run under; production reports less to the caller. */
  readonly mode?: "development" | "production" | "test";
  /** Receives each failure, for logging. */
  readonly onDiagnostic?: (diagnostic: ValidationDiagnostic) => void;
}

/** One schema after normalization: what enforces it, and what documents it. */
export interface NormalizedSchema {
  /** The schema enforced at request time. */
  readonly runtime: z.ZodType;
  /** The same shape as contract documentation. */
  readonly contract: Readonly<Record<string, unknown>>;
}

/** A body schema, carrying the size ceiling enforced before parsing. */
export interface NormalizedBodySchema extends NormalizedSchema {
  /** Largest body accepted; a larger one is refused unread. */
  readonly maxBytes: number;
}

/** Every schema of one operation, after normalization. */
export interface NormalizedOperationSchemas {
  /** Schema for path parameters. */
  readonly params?: NormalizedSchema;
  /** Schema for query string values. */
  readonly query?: NormalizedSchema;
  /** Schema for request headers, and which headers are read. */
  readonly headers?: NormalizedSchema & { readonly names: readonly string[] };
  /** Schema for the request body, and its size ceiling. */
  readonly body?: NormalizedBodySchema;
  /** Schema per response status; `null` where a status carries no body. */
  readonly responses: Readonly<Record<number, NormalizedSchema | null>>;
}

/** One route's validation, resolved and ready to enforce. */
export interface NormalizedValidationRoute {
  /** The HTTP method. */
  readonly method: string;
  /** The route path. */
  readonly path: string;
  /** File the route was discovered from. */
  readonly source: string;
  /** The normalized schemas for this operation. */
  readonly schemas: NormalizedOperationSchemas;
}

/** A request handler that validates, and its resolved schema inventory. */
export interface ValidatedRouter {
  /** Resolved validation for every route, for inspection and evidence. */
  readonly routes: readonly NormalizedValidationRoute[];
  /**
   * Answers one request, validating it and its response.
   *
   * @param request The incoming request.
   * @returns The response, or a problem-details response on failure.
   */
  fetch(request: Request): Promise<Response>;
}

/**
 * Thrown when route schemas cannot be normalized.
 *
 * Raised at startup, so a schema that is not strict, or a response status with
 * no schema, is refused before the route can serve a single request.
 */
export class SchemaNormalizationError extends Error {
  /**
   * Builds an error whose message lists every diagnostic, one per line.
   *
   * @param diagnostics Every fault found, in the order detected.
   */
  constructor(readonly diagnostics: readonly ValidationDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.summary}`
      ).join("\n"),
    );
    this.name = "SchemaNormalizationError";
  }
}
