import type { NormalizedRoute } from "../routing/mod.ts";
import { redactSecurityData } from "./redact.ts";
import {
  type CorsConfiguration,
  type NormalizedSecurityRoute,
  type RateLimitPolicy,
  type RouteSecurity,
  SecurityConfigurationError,
  type SecurityDiagnostic,
  type SecurityOptions,
} from "./types.ts";

export interface PreparedSecurityRoute {
  readonly source: NormalizedRoute;
  readonly security: RouteSecurity;
  readonly metadata: NormalizedSecurityRoute;
}

export interface PreparedSecurity {
  readonly routes: readonly PreparedSecurityRoute[];
  readonly cors: CorsConfiguration;
}

function routeName(route: NormalizedRoute): string {
  return `${route.method} ${route.path}`;
}

function diagnostic(
  code: string,
  summary: string,
  correction: string,
  route?: NormalizedRoute,
  policy?: string,
): SecurityDiagnostic {
  return {
    code,
    severity: "error",
    summary,
    ...(route ? { route: routeName(route), source: route.source } : {}),
    ...(policy ? { policy } : {}),
    correction,
  };
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasResponse(route: NormalizedRoute, status: number): boolean {
  const schemas = route.operation.schemas as {
    readonly responses?: Readonly<Record<string, unknown>>;
  };
  return Boolean(
    schemas?.responses && Object.hasOwn(schemas.responses, status),
  );
}

function validOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      url.origin === origin && url.pathname === "/" && !url.search &&
      !url.hash;
  } catch {
    return false;
  }
}

function validHeaderValue(value: string): boolean {
  try {
    new Headers({ "www-authenticate": value });
    return true;
  } catch {
    return false;
  }
}

function normalizeCors(
  options: SecurityOptions,
  diagnostics: SecurityDiagnostic[],
): CorsConfiguration {
  const raw = options.cors as unknown;
  if (!options.cors) {
    if (options.mode === "production") {
      diagnostics.push(diagnostic(
        "SH_CORS_REQUIRED",
        "Production requires an explicit CORS decision",
        "Set cors to { mode: 'deny' } or an explicit allow configuration.",
      ));
    }
    return { mode: "deny" };
  }
  if (!raw || typeof raw !== "object") {
    diagnostics.push(diagnostic(
      "SH_CORS_CONFIGURATION_INVALID",
      "CORS configuration is malformed",
      "Declare mode 'deny' or a complete allow configuration.",
    ));
    return { mode: "deny" };
  }
  const rawCors = raw as Record<string, unknown>;
  if (rawCors.mode === "deny") return { mode: "deny" };
  if (
    rawCors.mode !== "allow" ||
    !(rawCors.origins === "*" || Array.isArray(rawCors.origins)) ||
    !Array.isArray(rawCors.methods) || !Array.isArray(rawCors.headers) ||
    typeof rawCors.credentials !== "boolean"
  ) {
    diagnostics.push(diagnostic(
      "SH_CORS_CONFIGURATION_INVALID",
      "CORS allow configuration is incomplete or malformed",
      "Declare origins, methods, headers, and a credentials decision.",
    ));
    return { mode: "deny" };
  }

  const cors = options.cors as Extract<CorsConfiguration, { mode: "allow" }>;
  if (cors.origins === "*" && cors.credentials) {
    diagnostics.push(diagnostic(
      "SH_CORS_WILDCARD_CREDENTIALS",
      "Credentialed CORS cannot use the wildcard origin",
      "List exact origins or disable credentials.",
    ));
  }
  if (
    Array.isArray(cors.origins) &&
    (cors.origins.length === 0 ||
      cors.origins.some((origin) => !validOrigin(origin)))
  ) {
    diagnostics.push(diagnostic(
      "SH_CORS_ORIGIN_INVALID",
      "CORS origins must be non-empty exact HTTP origins",
      "Use origins such as https://app.example without paths, queries, or fragments.",
    ));
  }
  if (
    cors.methods.length === 0 ||
    cors.methods.some((method) =>
      !/^(DELETE|GET|HEAD|OPTIONS|PATCH|POST|PUT)$/.test(method)
    )
  ) {
    diagnostics.push(diagnostic(
      "SH_CORS_METHOD_INVALID",
      "CORS methods must be explicit supported uppercase HTTP methods",
      "Declare at least one supported uppercase method.",
    ));
  }
  if (
    cors.headers.some((header) => !/^[!#$%&'*+.^_`|~0-9a-z-]+$/i.test(header))
  ) {
    diagnostics.push(diagnostic(
      "SH_CORS_HEADER_INVALID",
      "CORS headers must contain valid HTTP field names",
      "Declare only valid header field names.",
    ));
  }
  return cors;
}

function validatePolicy(
  route: NormalizedRoute,
  name: string,
  policy: RateLimitPolicy | undefined,
  options: SecurityOptions,
  diagnostics: SecurityDiagnostic[],
): void {
  if (!policy) {
    diagnostics.push(diagnostic(
      "SH_SECURITY_RATE_LIMIT_REQUIRED",
      `Route references missing rate-limit policy '${name}'`,
      "Register the named policy before starting the router.",
      route,
      name,
    ));
    return;
  }
  if (
    !Number.isSafeInteger(policy.limit) || policy.limit <= 0 ||
    !Number.isSafeInteger(policy.windowMs) || policy.windowMs <= 0 ||
    typeof policy.key !== "function" ||
    typeof policy.limiter?.consume !== "function" ||
    !["process", "shared"].includes(policy.limiter?.scope)
  ) {
    diagnostics.push(diagnostic(
      "SH_SECURITY_RATE_LIMIT_INVALID",
      `Rate-limit policy '${name}' is malformed`,
      "Provide positive integer limits, a key function, and a declared limiter scope.",
      route,
      name,
    ));
  } else if (
    options.mode === "production" && policy.limiter.scope === "process"
  ) {
    diagnostics.push(diagnostic(
      "SH_SECURITY_RATE_LIMIT_PROCESS_SCOPE",
      `Production route uses process-scoped rate-limit policy '${name}'`,
      "Inject a shared-scope production limiter.",
      route,
      name,
    ));
  }
}

export function prepareSecurity(
  routes: readonly NormalizedRoute[],
  options: SecurityOptions,
): PreparedSecurity {
  const diagnostics: SecurityDiagnostic[] = [];
  if (!["development", "production", "test"].includes(options.mode)) {
    diagnostics.push(diagnostic(
      "SH_SECURITY_MODE_INVALID",
      "Security mode must be explicit",
      "Set mode to development, test, or production.",
    ));
  }
  const cors = normalizeCors(options, diagnostics);
  const prepared: PreparedSecurityRoute[] = [];

  for (const route of routes) {
    const security = route.operation.security as RouteSecurity;
    const authentication = security?.authentication;
    if (
      !authentication ||
      !["none", "required"].includes(authentication.mode)
    ) {
      diagnostics.push(diagnostic(
        "SH_SECURITY_AUTHENTICATION_REQUIRED",
        "Route must declare exactly one authentication mode",
        "Declare authentication mode 'none' or 'required'.",
        route,
      ));
      continue;
    }

    if (authentication.mode === "required") {
      const provider = options.providers?.[authentication.provider];
      if (
        !nonempty(authentication.provider) ||
        !nonempty(authentication.requirementId) || !provider ||
        !nonempty(provider.challenge) ||
        !validHeaderValue(provider.challenge) ||
        typeof provider.authenticate !== "function"
      ) {
        diagnostics.push(diagnostic(
          "SH_SECURITY_PROVIDER_REQUIRED",
          `Route requires unresolved provider '${authentication.provider}'`,
          "Register a well-formed named provider and requirement ID.",
          route,
        ));
      }
      if (!hasResponse(route, 401)) {
        diagnostics.push(diagnostic(
          "SH_SECURITY_RESPONSE_REQUIRED",
          "Required-authentication route lacks a 401 response schema",
          "Declare schemas.responses[401].",
          route,
        ));
      }
    }

    if (security.authorization) {
      if (
        authentication.mode !== "required" ||
        !nonempty(security.authorization.name) ||
        !nonempty(security.authorization.requirementId) ||
        typeof security.authorization.guard !== "function"
      ) {
        diagnostics.push(diagnostic(
          "SH_SECURITY_GUARD_INVALID",
          "Authorization requires a named guard, requirement ID, and required authentication",
          "Attach a well-formed guard only to a required-authentication route.",
          route,
        ));
      }
      if (!hasResponse(route, 403)) {
        diagnostics.push(diagnostic(
          "SH_SECURITY_RESPONSE_REQUIRED",
          "Authorization route lacks a 403 response schema",
          "Declare schemas.responses[403].",
          route,
        ));
      }
    }

    if (security.rateLimit) {
      if (!hasResponse(route, 429) || !hasResponse(route, 503)) {
        diagnostics.push(diagnostic(
          "SH_SECURITY_RESPONSE_REQUIRED",
          "Rate-limited route lacks 429 or 503 response schemas",
          "Declare schemas.responses[429] and schemas.responses[503].",
          route,
          security.rateLimit,
        ));
      }
      validatePolicy(
        route,
        security.rateLimit,
        options.rateLimits?.[security.rateLimit],
        options,
        diagnostics,
      );
    }

    prepared.push({
      source: route,
      security,
      metadata: {
        method: route.method,
        path: route.path,
        source: route.source,
        authentication: authentication.mode,
        ...(authentication.mode === "required"
          ? {
            provider: authentication.provider,
            authenticationRequirementId: authentication.requirementId,
          }
          : {}),
        ...(security.authorization
          ? {
            authorizationGuard: security.authorization.name,
            authorizationRequirementId: security.authorization.requirementId,
          }
          : {}),
        ...(security.rateLimit ? { rateLimitPolicy: security.rateLimit } : {}),
        corsMode: cors.mode,
        secureHeaders: true,
        requestId: true,
        bodyLimits: "SH-F003",
        boundedData: "SH-F004",
      },
    });
  }

  if (diagnostics.length > 0) {
    for (const item of diagnostics) {
      options.onDiagnostic?.({
        ...item,
        context: redactSecurityData(item.context),
      });
    }
    throw new SecurityConfigurationError(diagnostics);
  }
  return { routes: prepared, cors };
}
