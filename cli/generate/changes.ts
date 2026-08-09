import { stableSummary } from "./canonical.ts";
import type { ContractChange } from "./types.ts";

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function operationEntries(document: JsonObject): Array<{
  method: string;
  path: string;
  operation: JsonObject;
}> {
  const result: Array<{ method: string; path: string; operation: JsonObject }> =
    [];
  for (const [path, item] of Object.entries(object(document.paths))) {
    for (const [method, operation] of Object.entries(object(item))) {
      if (
        ["delete", "get", "head", "options", "patch", "post", "put"].includes(
          method,
        )
      ) {
        result.push({
          method: method.toUpperCase(),
          path,
          operation: object(operation),
        });
      }
    }
  }
  return result;
}

function serviceId(document: JsonObject, operation: JsonObject): string {
  return String(
    operation["x-sleepy-hollow-service-id"] ??
      object(document.info)["x-sleepy-hollow-service-id"] ?? "unknown",
  );
}

function finding(
  code: string,
  previousDocument: JsonObject,
  previous: JsonObject,
  current: JsonObject | undefined,
  method: string,
  path: string,
  element: string,
  before: unknown,
  after: unknown,
  guidance: string,
): ContractChange {
  const operation = current ?? previous;
  return {
    code,
    severity: "breaking",
    serviceId: serviceId(previousDocument, operation),
    operationId: String(
      operation.operationId ?? previous.operationId ??
        `${method.toLowerCase()}${path}`,
    ),
    method,
    path,
    element,
    before: stableSummary(before),
    after: stableSummary(after),
    source: typeof operation["x-sleepy-hollow-source"] === "string"
      ? operation["x-sleepy-hollow-source"]
      : undefined,
    guidance,
  };
}

function parameters(operation: JsonObject): Map<string, JsonObject> {
  return new Map(
    (Array.isArray(operation.parameters) ? operation.parameters : []).map(
      (value) => {
        const parameter = object(value);
        return [`${parameter.in}:${parameter.name}`, parameter];
      },
    ),
  );
}

function responseSchemas(
  operation: JsonObject,
  error: boolean,
): Map<string, JsonObject> {
  const result = new Map<string, JsonObject>();
  for (
    const [status, responseValue] of Object.entries(object(operation.responses))
  ) {
    if ((Number(status) >= 400) !== error) continue;
    const response = object(responseValue);
    const content = object(response.content);
    const first = Object.values(content)[0];
    result.set(status, object(object(first).schema));
  }
  return result;
}

function isNarrower(before: JsonObject, after: JsonObject): boolean {
  if (before.type !== after.type) return true;
  const oldEnum = Array.isArray(before.enum) ? before.enum : undefined;
  const newEnum = Array.isArray(after.enum) ? after.enum : undefined;
  if (!oldEnum && newEnum) return true;
  if (
    oldEnum && newEnum &&
    oldEnum.some((item) => !newEnum.some((next) => Object.is(item, next)))
  ) return true;
  return false;
}

export function analyzeChanges(
  previousDocument: JsonObject,
  currentDocument: JsonObject,
): readonly ContractChange[] {
  const changes: ContractChange[] = [];
  const current = new Map(
    operationEntries(currentDocument).map((
      item,
    ) => [`${item.method} ${item.path}`, item.operation]),
  );
  for (const oldEntry of operationEntries(previousDocument)) {
    const key = `${oldEntry.method} ${oldEntry.path}`;
    const next = current.get(key);
    if (!next) {
      changes.push(finding(
        "SH_CONTRACT_ROUTE_REMOVED",
        previousDocument,
        oldEntry.operation,
        undefined,
        oldEntry.method,
        oldEntry.path,
        "route",
        key,
        null,
        "Restore the route or release and migrate consumers as a breaking contract version.",
      ));
      continue;
    }
    const oldParameters = parameters(oldEntry.operation);
    const newParameters = parameters(next);
    for (const [parameterKey, newParameter] of newParameters) {
      const oldParameter = oldParameters.get(parameterKey);
      if (newParameter.required === true && oldParameter?.required !== true) {
        changes.push(finding(
          "SH_CONTRACT_INPUT_REQUIRED",
          previousDocument,
          oldEntry.operation,
          next,
          oldEntry.method,
          oldEntry.path,
          `parameter:${parameterKey}`,
          oldParameter?.required ?? "absent",
          true,
          "Keep the input optional or coordinate a consumer migration before requiring it.",
        ));
      }
      if (
        oldParameter &&
        isNarrower(object(oldParameter.schema), object(newParameter.schema))
      ) {
        changes.push(finding(
          "SH_CONTRACT_TYPE_NARROWED",
          previousDocument,
          oldEntry.operation,
          next,
          oldEntry.method,
          oldEntry.path,
          `parameter:${parameterKey}:schema`,
          oldParameter.schema,
          newParameter.schema,
          "Retain the prior accepted values or version the narrowed input contract.",
        ));
      }
    }
    const oldBody = object(oldEntry.operation.requestBody);
    const newBody = object(next.requestBody);
    if (newBody.required === true && oldBody.required !== true) {
      changes.push(finding(
        "SH_CONTRACT_INPUT_REQUIRED",
        previousDocument,
        oldEntry.operation,
        next,
        oldEntry.method,
        oldEntry.path,
        "request-body",
        oldBody.required ?? "absent",
        true,
        "Keep the request body optional or coordinate a consumer migration before requiring it.",
      ));
    }
    const oldBodySchema = object(
      object(Object.values(object(oldBody.content))[0]).schema,
    );
    const newBodySchema = object(
      object(Object.values(object(newBody.content))[0]).schema,
    );
    if (
      Object.keys(oldBodySchema).length && Object.keys(newBodySchema).length &&
      isNarrower(oldBodySchema, newBodySchema)
    ) {
      changes.push(finding(
        "SH_CONTRACT_TYPE_NARROWED",
        previousDocument,
        oldEntry.operation,
        next,
        oldEntry.method,
        oldEntry.path,
        "request-body:schema",
        oldBodySchema,
        newBodySchema,
        "Retain the prior accepted body values or version the narrowed input contract.",
      ));
    }
    for (
      const [status, oldSchema] of responseSchemas(oldEntry.operation, false)
    ) {
      const newSchema = responseSchemas(next, false).get(status);
      if (!newSchema) continue;
      const oldProperties = object(oldSchema.properties);
      const newProperties = object(newSchema.properties);
      for (const property of Object.keys(oldProperties)) {
        if (!Object.hasOwn(newProperties, property)) {
          changes.push(finding(
            "SH_CONTRACT_RESPONSE_PROPERTY_REMOVED",
            previousDocument,
            oldEntry.operation,
            next,
            oldEntry.method,
            oldEntry.path,
            `response:${status}:property:${property}`,
            oldProperties[property],
            null,
            "Restore the response property or version the response before migrating consumers.",
          ));
        }
      }
      if (isNarrower(oldSchema, newSchema)) {
        changes.push(finding(
          "SH_CONTRACT_TYPE_NARROWED",
          previousDocument,
          oldEntry.operation,
          next,
          oldEntry.method,
          oldEntry.path,
          `response:${status}:schema`,
          oldSchema,
          newSchema,
          "Preserve the prior response range or version the narrowed response.",
        ));
      }
    }
    const oldErrors = responseSchemas(oldEntry.operation, true);
    const newErrors = responseSchemas(next, true);
    for (const [status, schema] of oldErrors) {
      if (
        !newErrors.has(status) ||
        stableSummary(schema) !== stableSummary(newErrors.get(status))
      ) {
        changes.push(finding(
          "SH_CONTRACT_ERROR_CHANGED",
          previousDocument,
          oldEntry.operation,
          next,
          oldEntry.method,
          oldEntry.path,
          `error-response:${status}`,
          schema,
          newErrors.get(status) ?? null,
          "Restore the declared error or coordinate a versioned error-contract migration.",
        ));
      }
    }
    if (
      stableSummary(oldEntry.operation.security ?? []) !==
        stableSummary(next.security ?? [])
    ) {
      changes.push(finding(
        "SH_CONTRACT_AUTH_CHANGED",
        previousDocument,
        oldEntry.operation,
        next,
        oldEntry.method,
        oldEntry.path,
        "security",
        oldEntry.operation.security ?? [],
        next.security ?? [],
        "Review consumer authentication compatibility and version stronger requirements.",
      ));
    }
    const oldPagination = oldEntry.operation["x-sleepy-hollow-pagination"];
    const newPagination = next["x-sleepy-hollow-pagination"];
    if (stableSummary(oldPagination) !== stableSummary(newPagination)) {
      changes.push(finding(
        "SH_CONTRACT_PAGINATION_CHANGED",
        previousDocument,
        oldEntry.operation,
        next,
        oldEntry.method,
        oldEntry.path,
        "pagination",
        oldPagination,
        newPagination,
        "Preserve cursor, limit, and envelope behavior or migrate consumers under a new version.",
      ));
    }
  }
  return changes.sort((left, right) =>
    left.path.localeCompare(right.path) ||
    left.method.localeCompare(right.method) ||
    left.code.localeCompare(right.code) ||
    left.element.localeCompare(right.element)
  );
}
