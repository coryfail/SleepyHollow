import { canonicalJson } from "./canonical.ts";
import { GenerationError } from "./error.ts";
import type {
  ContractInventory,
  ContractOperation,
  ContractRequestLocation,
  GenerationDiagnostic,
  JsonSchema,
} from "./types.ts";

const methods = new Set([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);

function diagnostic(
  code: string,
  summary: string,
  correction: string,
  operation?: ContractOperation,
): GenerationDiagnostic {
  return {
    code,
    summary,
    correction,
    ...(operation
      ? { operationId: operation.operationId, path: operation.source }
      : {}),
  };
}

function validateSchema(
  schema: JsonSchema,
  label: string,
  operation: ContractOperation,
  diagnostics: GenerationDiagnostic[],
): void {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    diagnostics.push(diagnostic(
      "SH_GENERATE_SCHEMA_INVALID",
      `${label} is not a normalized JSON Schema object`,
      "Supply the SH-F003 normalized JSON Schema contract view.",
      operation,
    ));
    return;
  }
  const supported = new Set([
    undefined,
    "array",
    "boolean",
    "integer",
    "null",
    "number",
    "object",
    "string",
  ]);
  if (!supported.has(schema.type as string | undefined)) {
    diagnostics.push(diagnostic(
      "SH_GENERATE_SCHEMA_UNSUPPORTED",
      `${label} uses an unsupported schema type`,
      "Normalize the schema to the supported JSON Schema subset.",
      operation,
    ));
  }
  const properties = schema.properties;
  if (properties !== undefined) {
    if (
      !properties || typeof properties !== "object" || Array.isArray(properties)
    ) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_SCHEMA_UNSUPPORTED",
        `${label}.properties is not a normalized schema map`,
        "Normalize the schema to the supported JSON Schema subset.",
        operation,
      ));
    } else {
      for (
        const [name, child] of Object.entries(
          properties as Record<string, JsonSchema>,
        )
      ) {
        validateSchema(
          child,
          `${label}.properties.${name}`,
          operation,
          diagnostics,
        );
      }
    }
  }
  if (schema.items !== undefined) {
    validateSchema(
      schema.items as JsonSchema,
      `${label}.items`,
      operation,
      diagnostics,
    );
  }
  for (const keyword of ["anyOf", "oneOf"] as const) {
    if (schema[keyword] === undefined) continue;
    if (!Array.isArray(schema[keyword])) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_SCHEMA_UNSUPPORTED",
        `${label}.${keyword} is not a normalized schema list`,
        "Normalize the schema to the supported JSON Schema subset.",
        operation,
      ));
      continue;
    }
    (schema[keyword] as JsonSchema[]).forEach((child, index) =>
      validateSchema(
        child,
        `${label}.${keyword}.${index}`,
        operation,
        diagnostics,
      )
    );
  }
}

export function normalizeInventory(
  inventory: ContractInventory,
): ContractInventory {
  const diagnostics: GenerationDiagnostic[] = [];
  if (!inventory.serviceId.trim()) {
    diagnostics.push(diagnostic(
      "SH_GENERATE_SERVICE_ID_REQUIRED",
      "The normalized contract has no service ID",
      "Declare a stable non-empty service ID.",
    ));
  }
  const operationIds = new Set<string>();
  const routeKeys = new Set<string>();
  for (const operation of inventory.operations) {
    if (
      !operation.operationId.trim() || operationIds.has(operation.operationId)
    ) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_OPERATION_ID_INVALID",
        `Operation ID ${
          JSON.stringify(operation.operationId)
        } is empty or duplicated`,
        "Declare one stable unique operation ID per route.",
        operation,
      ));
    }
    operationIds.add(operation.operationId);
    const method = operation.method.toUpperCase();
    if (!methods.has(method) || method !== operation.method) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_METHOD_INVALID",
        `${operation.operationId} has an unsupported or non-normalized method`,
        "Use an uppercase supported HTTP method.",
        operation,
      ));
    }
    if (!operation.path.startsWith("/") || operation.path.includes("..")) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_PATH_INVALID",
        `${operation.operationId} has an unsafe route path`,
        "Use an absolute normalized application route path.",
        operation,
      ));
    }
    const routeKey = `${method} ${operation.path}`;
    if (routeKeys.has(routeKey)) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_ROUTE_DUPLICATED",
        `${routeKey} is declared more than once`,
        "Keep one normalized operation for each method and path pair.",
        operation,
      ));
    }
    routeKeys.add(routeKey);
    if (Object.keys(operation.responses).length === 0) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_RESPONSE_REQUIRED",
        `${operation.operationId} has no declared responses`,
        "Declare every possible response status and schema.",
        operation,
      ));
    }
    for (const [location, request] of Object.entries(operation.request ?? {})) {
      validateSchema(
        request!.schema,
        `${operation.operationId}.${location}`,
        operation,
        diagnostics,
      );
    }
    for (const [status, response] of Object.entries(operation.responses)) {
      if (response.schema) {
        validateSchema(
          response.schema,
          `${operation.operationId}.responses.${status}`,
          operation,
          diagnostics,
        );
      }
    }
    if (
      operation.security.mode === "required" &&
      !inventory.securitySchemes?.[operation.security.scheme]
    ) {
      diagnostics.push(diagnostic(
        "SH_GENERATE_SECURITY_UNRESOLVED",
        `${operation.operationId} names an unresolved security scheme`,
        "Supply that project-defined scheme in the normalized inventory.",
        operation,
      ));
    }
  }
  if (diagnostics.length) throw new GenerationError(diagnostics);
  return {
    ...inventory,
    securitySchemes: Object.fromEntries(
      Object.entries(inventory.securitySchemes ?? {}).sort(([a], [b]) =>
        a.localeCompare(b)
      ),
    ),
    operations: [...inventory.operations].sort((left, right) =>
      left.path.localeCompare(right.path) ||
      left.method.localeCompare(right.method) ||
      left.operationId.localeCompare(right.operationId)
    ),
  };
}

function parameterList(
  location: "params" | "query" | "headers",
  request: ContractRequestLocation | undefined,
): Record<string, unknown>[] {
  if (!request) return [];
  const properties = (request.schema.properties ?? {}) as Record<
    string,
    JsonSchema
  >;
  const required = new Set((request.schema.required ?? []) as string[]);
  const where = location === "params"
    ? "path"
    : location === "headers"
    ? "header"
    : "query";
  return Object.entries(properties).sort(([a], [b]) => a.localeCompare(b)).map((
    [name, schema],
  ) => ({
    in: where,
    name,
    required: where === "path" || required.has(name),
    schema,
  }));
}

function openApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function operationDocument(
  operation: ContractOperation,
  serviceId: string,
): Record<string, unknown> {
  const parameters = [
    ...parameterList("params", operation.request?.params),
    ...parameterList("query", operation.request?.query),
    ...parameterList("headers", operation.request?.headers),
  ];
  const responses = Object.fromEntries(
    Object.entries(operation.responses)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([status, response]) => [status, {
        description: response.description,
        ...(response.schema
          ? {
            content: {
              [
                response.contentType ?? (response.error
                  ? "application/problem+json"
                  : "application/json")
              ]: {
                schema: response.schema,
              },
            },
          }
          : {}),
      }]),
  );
  return {
    operationId: operation.operationId,
    summary: operation.summary,
    "x-sleepy-hollow-service-id": serviceId,
    "x-sleepy-hollow-source": operation.source,
    ...(operation.pagination
      ? { "x-sleepy-hollow-pagination": operation.pagination }
      : {}),
    ...(parameters.length ? { parameters } : {}),
    ...(operation.request?.body
      ? {
        requestBody: {
          required: true,
          content: {
            [operation.request.body.contentType ?? "application/json"]: {
              schema: operation.request.body.schema,
            },
          },
        },
      }
      : {}),
    responses,
    security: operation.security.mode === "none"
      ? []
      : [{ [operation.security.scheme]: [] }],
  };
}

export function buildOpenApi(
  inventory: ContractInventory,
): Record<string, unknown> {
  const normalized = normalizeInventory(inventory);
  const paths: Record<string, Record<string, unknown>> = {};
  for (const operation of normalized.operations) {
    const path = openApiPath(operation.path);
    paths[path] ??= {};
    paths[path][operation.method.toLowerCase()] = operationDocument(
      operation,
      normalized.serviceId,
    );
  }
  return {
    openapi: "3.1.1",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: normalized.title,
      version: normalized.version,
      ...(normalized.description
        ? { description: normalized.description }
        : {}),
      "x-sleepy-hollow-service-id": normalized.serviceId,
    },
    paths,
    components: { securitySchemes: normalized.securitySchemes ?? {} },
  };
}

export function renderOpenApi(inventory: ContractInventory): string {
  return canonicalJson(buildOpenApi(inventory));
}
