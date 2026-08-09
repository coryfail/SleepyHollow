import type {
  NormalizedRoute,
  RouteHandlerContext,
  RoutePrincipal,
} from "../routing/mod.ts";
import { createValidatedRouter } from "../validation/mod.ts";
import { prepareSecurity } from "./normalize.ts";
import { redactSecurityData } from "./redact.ts";
import type {
  CorsConfiguration,
  RateLimitDecision,
  RateLimitPolicy,
  RouteSecurity,
  SecurityDiagnostic,
  SecurityOptions,
  SecurityRouter,
} from "./types.ts";

const REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const RATE_KEY = /^[A-Za-z0-9._:-]{1,256}$/;

function problem(
  request: Request,
  status: number,
  title: string,
  slug: string,
  headers: HeadersInit = {},
): Response {
  return Response.json({
    type: `https://sleepyhollow.dev/problems/${slug}`,
    title,
    status,
    instance: new URL(request.url).pathname,
  }, {
    status,
    headers: {
      "content-type": "application/problem+json",
      ...headers,
    },
  });
}

function emit(
  options: SecurityOptions,
  route: NormalizedRoute,
  code: string,
  summary: string,
  correction: string,
  context?: unknown,
  policy?: string,
): void {
  const diagnostic: SecurityDiagnostic = {
    code,
    severity: "error",
    summary,
    route: `${route.method} ${route.path}`,
    source: route.source,
    ...(policy ? { policy } : {}),
    correction,
    ...(context === undefined ? {} : { context: redactSecurityData(context) }),
  };
  options.onDiagnostic?.(diagnostic);
}

function validPrincipal(value: unknown): value is RoutePrincipal {
  if (!value || typeof value !== "object") return false;
  const principal = value as Record<string, unknown>;
  if (
    typeof principal.id !== "string" || !principal.id.trim() ||
    typeof principal.type !== "string" || !principal.type.trim()
  ) return false;
  if (principal.claims === undefined) return true;
  if (
    principal.claims === null || typeof principal.claims !== "object" ||
    Array.isArray(principal.claims)
  ) return false;
  const prototype = Object.getPrototypeOf(principal.claims);
  return prototype === Object.prototype || prototype === null;
}

function validDecision(value: unknown): value is RateLimitDecision {
  if (!value || typeof value !== "object") return false;
  const decision = value as Record<string, unknown>;
  return typeof decision.allowed === "boolean" &&
    Number.isSafeInteger(decision.remaining) &&
    Number(decision.remaining) >= 0 &&
    typeof decision.resetAt === "number" &&
    Number.isFinite(decision.resetAt);
}

function rawCredential(request: Request, key: string): boolean {
  for (const [name, value] of request.headers) {
    const normalized = name.replace(/[^a-z0-9]/gi, "");
    if (
      /(authorization|cookie|token|secret|password|session|apikey|credential)/i
        .test(normalized) && value === key
    ) return true;
  }
  return false;
}

async function enforceRateLimit(
  request: Request,
  route: NormalizedRoute,
  name: string,
  policy: RateLimitPolicy,
  options: SecurityOptions,
): Promise<Response | undefined> {
  try {
    const key = await policy.key(request);
    if (!RATE_KEY.test(key) || rawCredential(request, key)) {
      throw new Error("invalid rate-limit key");
    }
    const decision = await policy.limiter.consume({
      policy: name,
      key,
      limit: policy.limit,
      windowMs: policy.windowMs,
    });
    if (!validDecision(decision)) throw new Error("invalid limiter decision");
    if (decision.allowed) return undefined;
    const retryAfter = Math.max(
      1,
      Math.ceil((decision.resetAt - Date.now()) / 1_000),
    );
    return problem(request, 429, "Too Many Requests", "rate-limit", {
      "cache-control": "no-store",
      "retry-after": String(retryAfter),
    });
  } catch (error) {
    emit(
      options,
      route,
      "SH_RATE_LIMIT_FAILED",
      "Rate-limit enforcement failed closed",
      "Inspect the protected limiter diagnostic and restore the policy adapter.",
      { error, request },
      name,
    );
    return problem(
      request,
      503,
      "Service Unavailable",
      "rate-limit-unavailable",
      { "cache-control": "no-store" },
    );
  }
}

async function securedHandler(
  context: RouteHandlerContext<unknown>,
  route: NormalizedRoute,
  security: RouteSecurity,
  options: SecurityOptions,
): Promise<Response> {
  if (security.rateLimit) {
    const limited = await enforceRateLimit(
      context.request,
      route,
      security.rateLimit,
      options.rateLimits![security.rateLimit],
      options,
    );
    if (limited) return limited;
  }

  let principal: RoutePrincipal | null = null;
  if (security.authentication.mode === "required") {
    const provider = options.providers![security.authentication.provider];
    try {
      principal = await provider.authenticate(context.request);
    } catch (error) {
      emit(
        options,
        route,
        "SH_AUTH_PROVIDER_FAILED",
        "Authentication provider execution failed",
        "Inspect the protected provider diagnostic and repair the adapter.",
        { error, request: context.request },
      );
      throw error;
    }
    if (principal === null) {
      return problem(context.request, 401, "Unauthorized", "unauthorized", {
        "cache-control": "no-store",
        "www-authenticate": provider.challenge,
      });
    }
    if (!validPrincipal(principal)) {
      emit(
        options,
        route,
        "SH_AUTH_PROVIDER_INVALID",
        "Authentication provider returned a malformed principal",
        "Return a principal with non-empty id and type fields.",
        { principal },
      );
      throw new Error("SH_AUTH_PROVIDER_INVALID");
    }
  }

  if (security.authorization) {
    try {
      const allowed = await security.authorization.guard({
        principal: principal!,
        request: context.request,
        params: context.params,
      });
      if (!allowed) {
        return problem(context.request, 403, "Forbidden", "forbidden", {
          "cache-control": "no-store",
        });
      }
    } catch (error) {
      emit(
        options,
        route,
        "SH_AUTHORIZATION_FAILED",
        "Authorization guard execution failed",
        "Inspect the protected guard diagnostic and repair the guard.",
        { error, request: context.request },
      );
      throw error;
    }
  }

  const handler = route.operation.handler as (
    context: RouteHandlerContext<unknown, RouteSecurity>,
  ) => Response | Promise<Response>;
  return await handler({
    ...context,
    principal,
    requestId: context.request.headers.get("x-request-id")!,
  });
}

function pathMatches(routePath: string, requestPath: string): boolean {
  let requestSegments: string[];
  try {
    requestSegments = requestPath.split("/").filter(Boolean).map(
      decodeURIComponent,
    );
  } catch {
    return false;
  }
  const routeSegments = routePath.split("/").filter(Boolean);
  return routeSegments.length === requestSegments.length &&
    routeSegments.every((segment, index) =>
      segment.startsWith(":") || segment === requestSegments[index]
    );
}

function allowedOrigin(cors: CorsConfiguration, origin: string): boolean {
  return cors.mode === "allow" &&
    (cors.origins === "*" || cors.origins.includes(origin));
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get("vary");
  const values = current?.split(",").map((item) => item.trim()) ?? [];
  if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
    headers.set("vary", [...values, value].filter(Boolean).join(", "));
  }
}

function corsHeaders(
  headers: Headers,
  request: Request,
  cors: CorsConfiguration,
  preflight: boolean,
): void {
  if (cors.mode !== "allow") return;
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigin(cors, origin)) return;
  headers.set(
    "access-control-allow-origin",
    cors.origins === "*" ? "*" : origin,
  );
  if (cors.origins !== "*") appendVary(headers, "Origin");
  if (cors.credentials) headers.set("access-control-allow-credentials", "true");
  if (preflight) {
    headers.set("access-control-allow-methods", cors.methods.join(", "));
    if (cors.headers.length > 0) {
      headers.set("access-control-allow-headers", cors.headers.join(", "));
    }
  }
}

function knownPreflight(
  request: Request,
  routes: readonly NormalizedRoute[],
  cors: CorsConfiguration,
): boolean {
  if (cors.mode !== "allow" || request.method !== "OPTIONS") return false;
  const origin = request.headers.get("origin");
  const method = request.headers.get("access-control-request-method")
    ?.toUpperCase();
  if (
    !origin || !method || !allowedOrigin(cors, origin) ||
    !cors.methods.includes(method)
  ) return false;
  const requestedHeaders = request.headers.get("access-control-request-headers")
    ?.split(",").map((header) => header.trim().toLowerCase()).filter(Boolean) ??
    [];
  const allowedHeaders = new Set(
    cors.headers.map((header) => header.toLowerCase()),
  );
  if (requestedHeaders.some((header) => !allowedHeaders.has(header))) {
    return false;
  }
  const path = new URL(request.url).pathname;
  return routes.some((route) =>
    route.method === method && pathMatches(route.path, path)
  );
}

function isPreflight(request: Request): boolean {
  return request.method === "OPTIONS" && request.headers.has("origin") &&
    request.headers.has("access-control-request-method");
}

function requestWithId(request: Request, options: SecurityOptions): {
  readonly request: Request;
  readonly requestId: string;
} {
  const inbound = request.headers.get("x-request-id");
  let requestId: string | null | undefined = inbound && REQUEST_ID.test(inbound)
    ? inbound
    : undefined;
  if (!requestId && options.requestId) {
    try {
      requestId = options.requestId();
    } catch {
      requestId = undefined;
    }
  }
  if (!requestId || !REQUEST_ID.test(requestId)) {
    requestId = crypto.randomUUID();
  }
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  return { request: new Request(request, { headers }), requestId };
}

function hardenedResponse(
  response: Response,
  request: Request,
  requestId: string,
  cors: CorsConfiguration,
  preflight = false,
): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  headers.set(
    "content-security-policy",
    "default-src 'none'; frame-ancestors 'none'",
  );
  headers.set("x-request-id", requestId);
  corsHeaders(headers, request, cors, preflight);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Wraps a route table so every request passes authentication, authorization,
 * rate limiting, and CORS before reaching a handler.
 *
 * Prefer {@linkcode composeProjectSecurity}, which loads the project's own
 * security module; use this when supplying providers and policies directly.
 *
 * @param routes The discovered route table.
 * @param options The posture, providers, policies, and CORS configuration.
 * @returns A router with security applied, and its resolved inventory.
 * @throws {SecurityConfigurationError} When any route cannot be satisfied.
 */
export function createSecurityRouter(
  routes: readonly NormalizedRoute[],
  options: SecurityOptions,
): SecurityRouter {
  const prepared = prepareSecurity(routes, options);
  const wrapped: NormalizedRoute[] = prepared.routes.map((item) => ({
    ...item.source,
    operation: {
      ...item.source.operation,
      handler: (context: RouteHandlerContext<unknown>) =>
        securedHandler(context, item.source, item.security, options),
    },
  }));
  const validated = createValidatedRouter(wrapped, {
    mode: options.mode,
    onDiagnostic: options.onDiagnostic,
  });

  return {
    routes: prepared.routes.map((route) => route.metadata),
    async fetch(originalRequest) {
      const selected = requestWithId(originalRequest, options);
      const preflight = isPreflight(selected.request);
      if (
        preflight && knownPreflight(selected.request, routes, prepared.cors)
      ) {
        return hardenedResponse(
          new Response(null, { status: 204 }),
          selected.request,
          selected.requestId,
          prepared.cors,
          true,
        );
      }
      const response = await validated.fetch(selected.request);
      return hardenedResponse(
        response,
        selected.request,
        selected.requestId,
        preflight ? { mode: "deny" } : prepared.cors,
      );
    },
  };
}
