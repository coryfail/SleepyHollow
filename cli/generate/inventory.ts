import { relative, sep } from "node:path";

import type { NormalizedRoute } from "../../core/routing/mod.ts";
import { normalizeRoutes } from "../../core/validation/mod.ts";
import type {
  ContractInventory,
  ContractOperation,
  ContractResponse,
  JsonSchema,
} from "./types.ts";

interface InventoryOptions {
  readonly projectRoot: string;
  readonly serviceId: string;
  readonly title?: string;
  readonly version?: string;
  readonly description?: string;
  readonly securitySchemes?: Readonly<Record<string, JsonSchema>>;
}

type Metadata = Readonly<Record<string, unknown>>;

function portable(path: string): string {
  return path.split(sep).join("/");
}

function identifier(route: NormalizedRoute, contract: Metadata): string {
  if (typeof contract.operationId === "string" && contract.operationId.trim()) {
    return contract.operationId;
  }
  const words = route.path.split("/").filter(Boolean).flatMap((segment) =>
    segment.startsWith(":") ? ["by", segment.slice(1)] : [segment]
  );
  const phrase = [route.method.toLowerCase(), ...words].join("-");
  return phrase.replace(
    /-([a-zA-Z0-9])/g,
    (_, letter: string) => letter.toUpperCase(),
  );
}

function responseMetadata(contract: Metadata, status: number): Metadata {
  const responses = contract.responses;
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    return {};
  }
  const value = (responses as Record<string, unknown>)[String(status)];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Metadata
    : {};
}

function security(route: NormalizedRoute): ContractOperation["security"] {
  const declared = route.operation.security as {
    readonly authentication?: "none" | {
      readonly mode?: "none" | "required";
      readonly provider?: string;
    };
  };
  const authentication = declared?.authentication;
  if (authentication === "none" || authentication?.mode === "none") {
    return { mode: "none" };
  }
  if (authentication?.mode === "required" && authentication.provider) {
    return { mode: "required", scheme: authentication.provider };
  }
  return { mode: "none" };
}

export function inventoryFromRoutes(
  routes: readonly NormalizedRoute[],
  options: InventoryOptions,
): ContractInventory {
  const prepared = normalizeRoutes(routes);
  const operations = prepared.map(({ source: route, normalized }) => {
    const contract =
      route.operation.contract && typeof route.operation.contract === "object"
        ? route.operation.contract as Metadata
        : {};
    const responses = Object.fromEntries(
      Object.entries(normalized.schemas.responses).map(
        ([statusText, schema]) => {
          const status = Number(statusText);
          const metadata = responseMetadata(contract, status);
          const error = metadata.error === true || status >= 400;
          return [
            status,
            {
              description: typeof metadata.description === "string"
                ? metadata.description
                : `HTTP ${status} response`,
              schema: schema?.contract ?? null,
              contentType: typeof metadata.contentType === "string"
                ? metadata.contentType
                : error
                ? "application/problem+json"
                : "application/json",
              ...(error ? { error: true } : {}),
            } satisfies ContractResponse,
          ];
        },
      ),
    );
    const request = {
      ...(normalized.schemas.params
        ? { params: { schema: normalized.schemas.params.contract } }
        : {}),
      ...(normalized.schemas.query
        ? { query: { schema: normalized.schemas.query.contract } }
        : {}),
      ...(normalized.schemas.headers
        ? { headers: { schema: normalized.schemas.headers.contract } }
        : {}),
      ...(normalized.schemas.body
        ? {
          body: {
            schema: normalized.schemas.body.contract,
            maxBytes: normalized.schemas.body.maxBytes,
            contentType: typeof contract.requestContentType === "string"
              ? contract.requestContentType
              : "application/json",
          },
        }
        : {}),
    };
    const pagination =
      contract.pagination && typeof contract.pagination === "object" &&
        !Array.isArray(contract.pagination)
        ? contract.pagination as ContractOperation["pagination"]
        : undefined;
    return {
      operationId: identifier(route, contract),
      method: route.method,
      path: route.path,
      source: portable(relative(options.projectRoot, route.source)),
      summary: typeof contract.summary === "string"
        ? contract.summary
        : `${route.method} ${route.path}`,
      ...(Object.keys(request).length ? { request } : {}),
      responses,
      security: security(route),
      ...(pagination ? { pagination } : {}),
    } satisfies ContractOperation;
  });
  return {
    serviceId: options.serviceId,
    title: options.title ?? options.serviceId,
    version: options.version ?? "0.2.0",
    ...(options.description ? { description: options.description } : {}),
    operations,
    securitySchemes: options.securitySchemes ?? {},
  };
}
