import { z } from "zod";

import type { NormalizedRoute } from "../routing/mod.ts";
import {
  type NormalizedBodySchema,
  type NormalizedOperationSchemas,
  type NormalizedSchema,
  type NormalizedValidationRoute,
  SchemaNormalizationError,
  type ValidationDiagnostic,
} from "./types.ts";

interface RawBodySchema {
  readonly schema: unknown;
  readonly maxBytes: unknown;
}

interface RawSchemas {
  readonly params?: unknown;
  readonly query?: unknown;
  readonly headers?: unknown;
  readonly body?: RawBodySchema;
  readonly responses?: Readonly<Record<string, unknown>>;
}

/** A route paired with its normalized schemas, ready to be enforced. */
export interface PreparedRoute {
  /** The route as discovered. */
  readonly source: NormalizedRoute;
  /** Its schemas, normalized. */
  readonly normalized: NormalizedValidationRoute;
}

function routeName(route: NormalizedRoute): string {
  return `${route.method} ${route.path}`;
}

function diagnostic(
  route: NormalizedRoute,
  code: string,
  summary: string,
  schemaLocation: string,
  correction: string,
): ValidationDiagnostic {
  return {
    code,
    severity: "error",
    summary,
    route: routeName(route),
    source: route.source,
    schemaLocation,
    issues: [],
    correction,
  };
}

function normalizeSchema(
  route: NormalizedRoute,
  value: unknown,
  schemaLocation: string,
  io: "input" | "output",
  diagnostics: ValidationDiagnostic[],
): NormalizedSchema | undefined {
  if (!(value instanceof z.ZodType)) {
    diagnostics.push(diagnostic(
      route,
      "SH_SCHEMA_INVALID",
      `The ${schemaLocation} declaration is not a Zod schema`,
      schemaLocation,
      "Declare the location with a Zod 4 schema.",
    ));
    return undefined;
  }

  try {
    const contract = z.toJSONSchema(value, {
      target: "openapi-3.0",
      io,
      unrepresentable: "throw",
    }) as Record<string, unknown>;

    if (
      contract.type === "object" &&
      contract.additionalProperties !== false &&
      schemaLocation !== "headers"
    ) {
      diagnostics.push(diagnostic(
        route,
        "SH_SCHEMA_NOT_STRICT",
        `The ${schemaLocation} object schema permits or strips unknown fields`,
        schemaLocation,
        "Use z.strictObject so unknown application fields are rejected.",
      ));
      return undefined;
    }

    return { runtime: value, contract };
  } catch {
    diagnostics.push(diagnostic(
      route,
      "SH_SCHEMA_UNREPRESENTABLE",
      `The ${schemaLocation} schema cannot be represented in the API contract`,
      schemaLocation,
      "Use Zod types and bidirectional codecs supported by JSON Schema conversion.",
    ));
    return undefined;
  }
}

function normalizeHeaders(
  route: NormalizedRoute,
  value: unknown,
  diagnostics: ValidationDiagnostic[],
): NormalizedOperationSchemas["headers"] | undefined {
  const normalized = normalizeSchema(
    route,
    value,
    "headers",
    "input",
    diagnostics,
  );
  if (!normalized) return undefined;
  if (!(value instanceof z.ZodObject)) {
    diagnostics.push(diagnostic(
      route,
      "SH_HEADER_SCHEMA_INVALID",
      "The headers schema must declare an object shape",
      "headers",
      "Use z.object with lowercase header names.",
    ));
    return undefined;
  }

  const names = Object.keys(value.shape).map((name) => name.toLowerCase())
    .sort();
  if (Object.keys(value.shape).some((name) => name !== name.toLowerCase())) {
    diagnostics.push(diagnostic(
      route,
      "SH_HEADER_NAME_INVALID",
      "Header schema names must be lowercase",
      "headers",
      "Declare every application header with its lowercase HTTP field name.",
    ));
    return undefined;
  }

  return { ...normalized, names };
}

function normalizeBody(
  route: NormalizedRoute,
  value: RawBodySchema,
  diagnostics: ValidationDiagnostic[],
): NormalizedBodySchema | undefined {
  if (!Number.isSafeInteger(value.maxBytes) || Number(value.maxBytes) <= 0) {
    diagnostics.push(diagnostic(
      route,
      "SH_BODY_LIMIT_INVALID",
      "A body schema requires a positive integer maxBytes limit",
      "body.maxBytes",
      "Set maxBytes to the largest explicitly accepted JSON payload size.",
    ));
    return undefined;
  }

  const normalized = normalizeSchema(
    route,
    value.schema,
    "body",
    "input",
    diagnostics,
  );
  return normalized
    ? { ...normalized, maxBytes: Number(value.maxBytes) }
    : undefined;
}

/**
 * Normalizes every route's schemas once, at startup.
 *
 * Faults are collected across the whole table rather than thrown at the first,
 * so one run reports every schema that needs correcting.
 *
 * @param routes The discovered route table.
 * @returns Each route paired with its normalized schemas.
 * @throws {SchemaNormalizationError} When any route's schemas are invalid.
 */
export function normalizeRoutes(
  routes: readonly NormalizedRoute[],
): readonly PreparedRoute[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const prepared: PreparedRoute[] = [];

  for (const route of routes) {
    const raw = route.operation.schemas as RawSchemas;
    const responses: Record<number, NormalizedSchema | null> = {};
    if (!raw || typeof raw !== "object" || !raw.responses) {
      diagnostics.push(diagnostic(
        route,
        "SH_SCHEMA_INVALID",
        "The route must declare response schemas",
        "responses",
        "Declare every possible handler response status in schemas.responses.",
      ));
      continue;
    }

    for (const [statusText, schema] of Object.entries(raw.responses)) {
      const status = Number(statusText);
      if (!Number.isInteger(status) || status < 100 || status > 599) {
        diagnostics.push(diagnostic(
          route,
          "SH_RESPONSE_STATUS_INVALID",
          `Invalid response status '${statusText}'`,
          `response.${statusText}`,
          "Use an HTTP status code from 100 through 599.",
        ));
        continue;
      }
      if (schema === null) {
        responses[status] = null;
        continue;
      }
      const normalized = normalizeSchema(
        route,
        schema,
        `response.${status}`,
        "output",
        diagnostics,
      );
      if (normalized) responses[status] = normalized;
    }

    const schemas: NormalizedOperationSchemas = {
      ...(raw.params
        ? {
          params: normalizeSchema(
            route,
            raw.params,
            "params",
            "input",
            diagnostics,
          ),
        }
        : {}),
      ...(raw.query
        ? {
          query: normalizeSchema(
            route,
            raw.query,
            "query",
            "input",
            diagnostics,
          ),
        }
        : {}),
      ...(raw.headers
        ? { headers: normalizeHeaders(route, raw.headers, diagnostics) }
        : {}),
      ...(raw.body
        ? { body: normalizeBody(route, raw.body, diagnostics) }
        : {}),
      responses,
    };

    prepared.push({
      source: route,
      normalized: {
        method: route.method,
        path: route.path,
        source: route.source,
        schemas,
      },
    });
  }

  if (diagnostics.length > 0) throw new SchemaNormalizationError(diagnostics);
  return prepared;
}
