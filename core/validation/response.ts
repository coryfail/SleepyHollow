import type { NormalizedRoute } from "../routing/mod.ts";
import { problem, safeSchemaIssueMessage } from "./diagnostics.ts";
import type {
  NormalizedOperationSchemas,
  ValidationDiagnostic,
  ValidationIssue,
} from "./types.ts";

export interface ResponseResult {
  readonly response: Response;
  readonly diagnostic?: ValidationDiagnostic;
}

function internalProblem(request: Request): Response {
  return problem(
    500,
    "Internal Server Error",
    new URL(request.url).pathname,
    "internal-server-error",
  );
}

function diagnostic(
  route: NormalizedRoute,
  status: number,
  summary: string,
  issues: readonly ValidationIssue[],
): ValidationDiagnostic {
  return {
    code: "SH_RESPONSE_SCHEMA_INVALID",
    severity: "error",
    summary,
    route: `${route.method} ${route.path}`,
    source: route.source,
    schemaLocation: `response.${status}`,
    issues,
    correction: "Return a response matching the declared schema.",
  };
}

export async function validateResponse(
  route: NormalizedRoute,
  schemas: NormalizedOperationSchemas,
  request: Request,
  response: Response,
): Promise<ResponseResult> {
  if (!Object.hasOwn(schemas.responses, response.status)) {
    return {
      response: internalProblem(request),
      diagnostic: diagnostic(
        route,
        response.status,
        "Handler returned an undeclared status",
        [],
      ),
    };
  }

  const schema = schemas.responses[response.status];
  if (schema === null) {
    const bytes = await response.clone().arrayBuffer();
    return bytes.byteLength === 0 ? { response } : {
      response: internalProblem(request),
      diagnostic: diagnostic(
        route,
        response.status,
        "Handler returned a body for a bodyless response",
        [],
      ),
    };
  }

  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    return {
      response: internalProblem(request),
      diagnostic: diagnostic(
        route,
        response.status,
        "Handler response is not valid JSON",
        [],
      ),
    };
  }

  const parsed = await schema.runtime.safeParseAsync(body);
  if (parsed.success) return { response };
  const issues: ValidationIssue[] = parsed.error.issues.map((issue) => ({
    location: "response",
    path: issue.path,
    code: issue.code,
    message: safeSchemaIssueMessage(
      issue as unknown as Record<string, unknown>,
    ),
  }));
  return {
    response: internalProblem(request),
    diagnostic: diagnostic(
      route,
      response.status,
      "Handler response does not match its declared schema",
      issues,
    ),
  };
}

export function handlerFailure(
  route: NormalizedRoute,
  request: Request,
): ResponseResult {
  return {
    response: internalProblem(request),
    diagnostic: {
      code: "SH_HANDLER_FAILED",
      severity: "error",
      summary: "Handler execution failed",
      route: `${route.method} ${route.path}`,
      source: route.source,
      schemaLocation: "handler",
      issues: [],
      correction:
        "Inspect the protected server-side exception and repair the handler.",
    },
  };
}
