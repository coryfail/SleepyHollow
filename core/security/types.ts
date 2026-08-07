import type {
  NormalizedRoute,
  RouteHandlerContext,
  RoutePrincipal,
} from "../routing/mod.ts";
import type { ValidationDiagnostic } from "../validation/mod.ts";

export type SecurityMode = "development" | "production" | "test";

export interface Principal extends RoutePrincipal {}

export interface AuthProvider {
  readonly challenge: string;
  authenticate(request: Request): Promise<Principal | null>;
}

export interface AuthorizationContext {
  readonly principal: Principal;
  readonly request: Request;
  readonly params: Readonly<Record<string, string>>;
}

export interface RouteSecurity {
  readonly authentication:
    | { readonly mode: "none" }
    | {
      readonly mode: "required";
      readonly provider: string;
      readonly requirementId: string;
    };
  readonly authorization?: {
    readonly name: string;
    readonly requirementId: string;
    readonly guard: (
      context: AuthorizationContext,
    ) => boolean | Promise<boolean>;
  };
  readonly rateLimit?: string;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}

export interface RateLimitInput {
  readonly policy: string;
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
}

export interface RateLimiter {
  readonly scope: "process" | "shared";
  consume(input: RateLimitInput): Promise<RateLimitDecision>;
}

export interface RateLimitPolicy {
  readonly limit: number;
  readonly windowMs: number;
  readonly key: (request: Request) => string | Promise<string>;
  readonly limiter: RateLimiter;
}

export type CorsConfiguration =
  | { readonly mode: "deny" }
  | {
    readonly mode: "allow";
    readonly origins: readonly string[] | "*";
    readonly methods: readonly string[];
    readonly headers: readonly string[];
    readonly credentials: boolean;
  };

export interface SecurityDiagnostic {
  readonly code: string;
  readonly severity: "error";
  readonly summary: string;
  readonly route?: string;
  readonly source?: string;
  readonly policy?: string;
  readonly correction: string;
  readonly context?: unknown;
}

export interface SecurityOptions {
  readonly mode: SecurityMode;
  readonly providers?: Readonly<Record<string, AuthProvider>>;
  readonly rateLimits?: Readonly<Record<string, RateLimitPolicy>>;
  readonly cors?: CorsConfiguration;
  readonly onDiagnostic?: (
    diagnostic: SecurityDiagnostic | ValidationDiagnostic,
  ) => void;
  readonly requestId?: () => string;
}

export interface NormalizedSecurityRoute {
  readonly method: string;
  readonly path: string;
  readonly source: string;
  readonly authentication: "none" | "required";
  readonly provider?: string;
  readonly authenticationRequirementId?: string;
  readonly authorizationGuard?: string;
  readonly authorizationRequirementId?: string;
  readonly rateLimitPolicy?: string;
  readonly corsMode: CorsConfiguration["mode"];
  readonly secureHeaders: true;
  readonly requestId: true;
  readonly bodyLimits: "SH-F003";
  readonly boundedData: "SH-F004";
}

export interface SecurityRouter {
  readonly routes: readonly NormalizedSecurityRoute[];
  fetch(request: Request): Promise<Response>;
}

export interface MemoryRateLimiterOptions {
  readonly maxKeys: number;
  readonly clock?: () => number;
}

export class SecurityConfigurationError extends Error {
  constructor(readonly diagnostics: readonly SecurityDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.summary}`
      ).join("\n"),
    );
    this.name = "SecurityConfigurationError";
  }
}

export type SecurityRoute = NormalizedRoute;
export type SecuredHandlerContext<Schemas, Security> = RouteHandlerContext<
  Schemas,
  Security
>;
