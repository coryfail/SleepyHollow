import type { z } from "zod";

export type ValidationLocation =
  | "params"
  | "query"
  | "headers"
  | "body"
  | "response";

export interface ValidationIssue {
  readonly location: ValidationLocation;
  readonly path: readonly PropertyKey[];
  readonly code: string;
  readonly message: string;
}

export interface ValidationDiagnostic {
  readonly code: string;
  readonly severity: "error";
  readonly summary: string;
  readonly route: string;
  readonly source: string;
  readonly schemaLocation: string;
  readonly issues: readonly ValidationIssue[];
  readonly correction: string;
}

export interface ValidationOptions {
  readonly mode?: "development" | "production" | "test";
  readonly onDiagnostic?: (diagnostic: ValidationDiagnostic) => void;
}

export interface NormalizedSchema {
  readonly runtime: z.ZodType;
  readonly contract: Readonly<Record<string, unknown>>;
}

export interface NormalizedBodySchema extends NormalizedSchema {
  readonly maxBytes: number;
}

export interface NormalizedOperationSchemas {
  readonly params?: NormalizedSchema;
  readonly query?: NormalizedSchema;
  readonly headers?: NormalizedSchema & { readonly names: readonly string[] };
  readonly body?: NormalizedBodySchema;
  readonly responses: Readonly<Record<number, NormalizedSchema | null>>;
}

export interface NormalizedValidationRoute {
  readonly method: string;
  readonly path: string;
  readonly source: string;
  readonly schemas: NormalizedOperationSchemas;
}

export interface ValidatedRouter {
  readonly routes: readonly NormalizedValidationRoute[];
  fetch(request: Request): Promise<Response>;
}

export class SchemaNormalizationError extends Error {
  constructor(readonly diagnostics: readonly ValidationDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.summary}`
      ).join("\n"),
    );
    this.name = "SchemaNormalizationError";
  }
}
