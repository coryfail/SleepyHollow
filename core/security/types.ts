import type {
  NormalizedRoute,
  RouteHandlerContext,
  RoutePrincipal,
} from "../routing/mod.ts";
import type { ValidationDiagnostic } from "../validation/mod.ts";

/**
 * Which posture the security layer runs under.
 *
 * Production refuses configurations the other modes tolerate, so a permissive
 * development setting cannot be deployed unnoticed.
 */
export type SecurityMode = "development" | "production" | "test";

/** An authenticated caller, as the security layer sees it. */
export interface Principal extends RoutePrincipal {}

/** Turns credentials on a request into a principal, or refuses. */
export interface AuthProvider {
  /** Value sent as `WWW-Authenticate` when authentication fails. */
  readonly challenge: string;
  /**
   * Authenticates one request.
   *
   * @param request The incoming request.
   * @returns The caller, or `null` when the credentials do not authenticate.
   */
  authenticate(request: Request): Promise<Principal | null>;
}

/** What an authorization guard is given to decide on. */
export interface AuthorizationContext {
  /** The authenticated caller; a guard runs only after authentication. */
  readonly principal: Principal;
  /** The incoming request. */
  readonly request: Request;
  /** Path parameters, so a guard can check ownership of the target. */
  readonly params: Readonly<Record<string, string>>;
}

/**
 * One route's security, stated in full.
 *
 * Authentication is never implicit: a route declares either `"none"` or a
 * named provider, and each choice names the requirement that authorized it.
 */
export interface RouteSecurity {
  /** Whether callers must authenticate, and by which provider. */
  readonly authentication:
    | { readonly mode: "none" }
    | {
      readonly mode: "required";
      readonly provider: string;
      readonly requirementId: string;
    };
  /** An additional check on who may act, run after authentication. */
  readonly authorization?: {
    readonly name: string;
    readonly requirementId: string;
    readonly guard: (
      context: AuthorizationContext,
    ) => boolean | Promise<boolean>;
  };
  /** Name of the rate limit policy applied to this route. */
  readonly rateLimit?: string;
}

/** The outcome of consuming one unit of a rate limit. */
export interface RateLimitDecision {
  /** Whether the request may proceed. */
  readonly allowed: boolean;
  /** Units left in the current window. */
  readonly remaining: number;
  /** When the window resets, in milliseconds since the epoch. */
  readonly resetAt: number;
}

/** One rate limit consumption: which policy, for whom, and at what rate. */
export interface RateLimitInput {
  /** Name of the policy being consumed. */
  readonly policy: string;
  /** What the limit is counted against, such as a caller or an address. */
  readonly key: string;
  /** Units permitted per window. */
  readonly limit: number;
  /** Length of the window, in milliseconds. */
  readonly windowMs: number;
}

/**
 * Counts consumption against a limit.
 *
 * The scope matters: a `process` limiter counts only what one instance saw, so
 * a deployment with several instances enforces the limit per instance.
 */
export interface RateLimiter {
  /** Whether counting is per process or shared across instances. */
  readonly scope: "process" | "shared";
  /**
   * Consumes one unit.
   *
   * @param input Which policy and key to count against.
   * @returns Whether the request may proceed, and what remains.
   */
  consume(input: RateLimitInput): Promise<RateLimitDecision>;
}

/** A named rate limit: the rate, what it counts by, and what enforces it. */
export interface RateLimitPolicy {
  /** Units permitted per window. */
  readonly limit: number;
  /** Length of the window, in milliseconds. */
  readonly windowMs: number;
  /** Derives the key a request is counted against. */
  readonly key: (request: Request) => string | Promise<string>;
  /** The limiter that counts it. */
  readonly limiter: RateLimiter;
}

/**
 * Cross-origin policy: either no origin is permitted, or the permitted set is
 * stated explicitly. There is no reflect-any-origin option.
 */
export type CorsConfiguration =
  | { readonly mode: "deny" }
  | {
    readonly mode: "allow";
    readonly origins: readonly string[] | "*";
    readonly methods: readonly string[];
    readonly headers: readonly string[];
    readonly credentials: boolean;
  };

/** One reason a security configuration was refused. */
export interface SecurityDiagnostic {
  /** Stable machine-readable identifier for this kind of fault. */
  readonly code: string;
  /** Security faults are always fatal; there are no warnings. */
  readonly severity: "error";
  /** What is wrong, in one sentence. */
  readonly summary: string;
  /** The route concerned, when the fault is specific to one. */
  readonly route?: string;
  /** Where the fault was found. */
  readonly source?: string;
  /** The policy concerned, when the fault is specific to one. */
  readonly policy?: string;
  /** What to change to resolve it. */
  readonly correction: string;
  /** Additional detail, already redacted. */
  readonly context?: unknown;
}

/** How to build a security router directly, without a project module. */
export interface SecurityOptions {
  /** The posture to run under. */
  readonly mode: SecurityMode;
  /** Authentication providers, by the name routes refer to them by. */
  readonly providers?: Readonly<Record<string, AuthProvider>>;
  /** Rate limit policies, by the name routes refer to them by. */
  readonly rateLimits?: Readonly<Record<string, RateLimitPolicy>>;
  /** Cross-origin policy; defaults to denying every origin. */
  readonly cors?: CorsConfiguration;
  /** Receives each diagnostic, already redacted. */
  readonly onDiagnostic?: (
    diagnostic: SecurityDiagnostic | ValidationDiagnostic,
  ) => void;
  /** Supplies request identifiers; override to make them deterministic. */
  readonly requestId?: () => string;
}

/** What a project's security module exports: the parts shared by all routes. */
export interface SecurityDeclaration {
  /** Authentication providers, by the name routes refer to them by. */
  readonly providers?: Readonly<Record<string, AuthProvider>>;
  /** Rate limit policies, by the name routes refer to them by. */
  readonly rateLimits?: Readonly<Record<string, RateLimitPolicy>>;
  /** Cross-origin policy; defaults to denying every origin. */
  readonly cors?: CorsConfiguration;
}

/** How to compose security from a project's own security module. */
export interface ProjectSecurityOptions {
  /** The posture to run under. */
  readonly mode: SecurityMode;
  /** Project root the security module is resolved against. */
  readonly root: string;
  /** Path to the security module; defaults to the conventional location. */
  readonly securityModule?: string;
  /** Imports the module; supply your own to compose without disk access. */
  readonly load?: (specifier: string) => Promise<unknown>;
  /** Receives each diagnostic, already redacted. */
  readonly onDiagnostic?: (
    diagnostic: SecurityDiagnostic | ValidationDiagnostic,
  ) => void;
  /** Supplies request identifiers; override to make them deterministic. */
  readonly requestId?: () => string;
}

/**
 * One route's resolved security, as an inspectable record.
 *
 * The fixed fields record protections the framework applies to every route, so
 * the inventory shows the whole posture rather than only what a route opted
 * into.
 */
export interface NormalizedSecurityRoute {
  /** The HTTP method. */
  readonly method: string;
  /** The route path. */
  readonly path: string;
  /** File the route was discovered from. */
  readonly source: string;
  /** Whether callers must authenticate. */
  readonly authentication: "none" | "required";
  /** Name of the provider that authenticates callers. */
  readonly provider?: string;
  /** Requirement that authorized the authentication choice. */
  readonly authenticationRequirementId?: string;
  /** Name of the authorization guard, when the route declares one. */
  readonly authorizationGuard?: string;
  /** Requirement that authorized the guard. */
  readonly authorizationRequirementId?: string;
  /** Name of the rate limit policy applied. */
  readonly rateLimitPolicy?: string;
  /** Cross-origin policy in force. */
  readonly corsMode: CorsConfiguration["mode"];
  /** Security headers are applied to every response. */
  readonly secureHeaders: true;
  /** Every request carries an identifier. */
  readonly requestId: true;
  /** Body size limits are enforced, as required by SH-F003. */
  readonly bodyLimits: "SH-F003";
  /** Listings are bounded, as required by SH-F004. */
  readonly boundedData: "SH-F004";
}

/** A request handler with security applied, and its resolved inventory. */
export interface SecurityRouter {
  /** Resolved security for every route, for inspection and evidence. */
  readonly routes: readonly NormalizedSecurityRoute[];
  /**
   * Answers one request.
   *
   * @param request The incoming request.
   * @returns The response, after security and validation.
   */
  fetch(request: Request): Promise<Response>;
}

/** How to build the in-process rate limiter. */
export interface MemoryRateLimiterOptions {
  /** Ceiling on tracked keys, so the limiter cannot grow without bound. */
  readonly maxKeys: number;
  /** Supplies the current time; override to test window behaviour. */
  readonly clock?: () => number;
}

/**
 * Thrown when security cannot be composed.
 *
 * Raised at startup rather than at first request, so a route naming a provider
 * that does not exist stops the process instead of failing open.
 */
export class SecurityConfigurationError extends Error {
  /**
   * Builds an error whose message lists every diagnostic, one per line.
   *
   * @param diagnostics Every fault found, in the order detected.
   */
  constructor(readonly diagnostics: readonly SecurityDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.summary}`
      ).join("\n"),
    );
    this.name = "SecurityConfigurationError";
  }
}

/** A route as the security layer receives it. */
export type SecurityRoute = NormalizedRoute;

/** A handler context on a route with security applied. */
export type SecuredHandlerContext<Schemas, Security> = RouteHandlerContext<
  Schemas,
  Security
>;
