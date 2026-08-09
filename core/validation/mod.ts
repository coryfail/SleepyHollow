/**
 * Request and response validation, layered over a router.
 *
 * Schemas declared on a route are normalized once at startup and enforced on
 * every request. A validation failure becomes a problem-details response
 * rather than an exception, so a malformed request is answered rather than
 * logged as a fault. Zod is re-exported as {@linkcode z} so a project declares
 * schemas without taking a second direct dependency.
 *
 * @module
 */
export { z } from "zod";
export {
  formatValidationDiagnostic,
  validationDiagnosticResult,
} from "./diagnostics.ts";
export { createValidatedRouter } from "./validated_router.ts";
export { normalizeRoutes, type PreparedRoute } from "./normalize.ts";
export {
  type NormalizedBodySchema,
  type NormalizedOperationSchemas,
  type NormalizedSchema,
  type NormalizedValidationRoute,
  SchemaNormalizationError,
  type ValidatedRouter,
  type ValidationDiagnostic,
  type ValidationIssue,
  type ValidationLocation,
  type ValidationOptions,
} from "./types.ts";
