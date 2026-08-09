/**
 * Authentication, authorization, CORS, rate limiting, and redaction.
 *
 * Every route declares its security explicitly; there is no implicit default,
 * because a forgotten default is how an endpoint ships unprotected. A project
 * security module composes the shared parts once, and the router refuses to
 * start when a route's declaration cannot be satisfied.
 *
 * @module
 */
export { composeProjectSecurity, defineSecurity } from "./declaration.ts";
export { createMemoryRateLimiter } from "./rate_limit.ts";
export { redactSecurityData } from "./redact.ts";
export { createSecurityRouter } from "./security_router.ts";
export {
  type AuthorizationContext,
  type AuthProvider,
  type CorsConfiguration,
  type MemoryRateLimiterOptions,
  type NormalizedSecurityRoute,
  type Principal,
  type ProjectSecurityOptions,
  type RateLimitDecision,
  type RateLimiter,
  type RateLimitInput,
  type RateLimitPolicy,
  type RouteSecurity,
  type SecuredHandlerContext,
  SecurityConfigurationError,
  type SecurityDeclaration,
  type SecurityDiagnostic,
  type SecurityMode,
  type SecurityOptions,
  type SecurityRouter,
} from "./types.ts";
