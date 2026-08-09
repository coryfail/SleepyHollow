import type { RouteHandlerContext } from "../routing/mod.ts";
import { problem, safeSchemaIssueMessage } from "./diagnostics.ts";
import type {
  NormalizedOperationSchemas,
  NormalizedSchema,
  ValidationIssue,
} from "./types.ts";

export type ParsedContext =
  & Omit<
    RouteHandlerContext<unknown>,
    "query" | "headers" | "body"
  >
  & {
    readonly query: Readonly<Record<string, unknown>>;
    readonly headers: Readonly<Record<string, unknown>>;
    readonly body: unknown;
  };

type RequestResult =
  | { readonly success: true; readonly context: ParsedContext }
  | { readonly success: false; readonly response: Response };

const empty = Object.freeze({});

function queryInput(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [name, value] of url.searchParams) {
    const current = query[name];
    if (current === undefined) query[name] = value;
    else if (Array.isArray(current)) current.push(value);
    else query[name] = [current, value];
  }
  return query;
}

function headerInput(
  request: Request,
  names: readonly string[],
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of names) {
    const value = request.headers.get(name);
    if (value !== null) headers[name] = value;
  }
  return headers;
}

function issues(
  location: ValidationIssue["location"],
  source: { readonly issues: readonly unknown[] },
): ValidationIssue[] {
  return source.issues.flatMap((rawIssue) => {
    const issue = rawIssue as Record<string, unknown>;
    const code = String(issue.code ?? "invalid_input");
    if (code === "unrecognized_keys" && Array.isArray(issue.keys)) {
      return issue.keys.map((key) => ({
        location,
        path: [String(key)],
        code,
        message: safeSchemaIssueMessage(issue),
      }));
    }
    return [{
      location,
      path: Array.isArray(issue.path) ? issue.path as PropertyKey[] : [],
      code,
      message: safeSchemaIssueMessage(issue),
    }];
  });
}

async function parse(
  schema: NormalizedSchema | undefined,
  location: ValidationIssue["location"],
  value: unknown,
): Promise<
  { readonly success: true; readonly data: unknown } | {
    readonly success: false;
    readonly issues: readonly ValidationIssue[];
  }
> {
  if (!schema) return { success: true, data: value };
  const result = await schema.runtime.safeParseAsync(value);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, issues: issues(location, result.error) };
}

function jsonMediaType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  return mediaType === "application/json" ||
    (mediaType.startsWith("application/") && mediaType.endsWith("+json"));
}

async function readBody(
  request: Request,
  maxBytes: number,
): Promise<
  { readonly status: "ok"; readonly value: unknown } | {
    readonly status: "too-large" | "invalid-json" | "unsupported-media";
  }
> {
  if (!jsonMediaType(request.headers.get("content-type"))) {
    return { status: "unsupported-media" };
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const parsed = Number(declaredLength);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      return { status: "too-large" };
    }
  }

  const reader = request.body?.getReader();
  if (!reader) return { status: "invalid-json" };
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const item = await reader.read();
    if (item.done) break;
    total += item.value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("Sleepy Hollow request body limit exceeded");
      return { status: "too-large" };
    }
    chunks.push(item.value);
  }

  if (total === 0) return { status: "invalid-json" };
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { status: "ok", value: JSON.parse(text) };
  } catch {
    return { status: "invalid-json" };
  }
}

export async function parseRequest(
  context: RouteHandlerContext<unknown>,
  schemas: NormalizedOperationSchemas,
): Promise<RequestResult> {
  const url = new URL(context.request.url);
  const params = await parse(schemas.params, "params", context.params);
  const query = await parse(schemas.query, "query", queryInput(url));
  const headers = await parse(
    schemas.headers,
    "headers",
    schemas.headers
      ? headerInput(context.request, schemas.headers.names)
      : empty,
  );

  let bodyValue: unknown = undefined;
  if (schemas.body) {
    const body = await readBody(context.request, schemas.body.maxBytes);
    if (body.status === "too-large") {
      return {
        success: false,
        response: problem(
          413,
          "Content Too Large",
          url.pathname,
          "content-too-large",
        ),
      };
    }
    if (body.status === "unsupported-media") {
      return {
        success: false,
        response: problem(
          415,
          "Unsupported Media Type",
          url.pathname,
          "unsupported-media-type",
        ),
      };
    }
    if (body.status === "invalid-json") {
      return {
        success: false,
        response: problem(
          400,
          "Request validation failed",
          url.pathname,
          "request-validation",
          [{
            location: "body",
            path: [],
            code: "invalid_json",
            message: "Expected a non-empty JSON body",
          }],
        ),
      };
    }
    if (body.status !== "ok") {
      return {
        success: false,
        response: problem(
          400,
          "Request validation failed",
          url.pathname,
          "request-validation",
        ),
      };
    }
    const parsed = await parse(schemas.body, "body", body.value);
    if (!parsed.success) {
      return {
        success: false,
        response: problem(
          400,
          "Request validation failed",
          url.pathname,
          "request-validation",
          parsed.issues,
        ),
      };
    }
    bodyValue = parsed.data;
  }

  const failures = [params, query, headers].filter((result) => !result.success);
  if (failures.length > 0) {
    return {
      success: false,
      response: problem(
        400,
        "Request validation failed",
        url.pathname,
        "request-validation",
        failures.flatMap((result) => result.success ? [] : result.issues),
      ),
    };
  }

  return {
    success: true,
    context: {
      ...context,
      params: params.success
        ? params.data as Readonly<Record<string, string>>
        : empty,
      query: query.success
        ? query.data as Readonly<Record<string, unknown>>
        : empty,
      headers: headers.success
        ? headers.data as Readonly<Record<string, unknown>>
        : empty,
      body: bodyValue,
    },
  };
}
