/** The HTTP methods a route module may export an operation for. */
export const HTTP_METHODS = [
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
] as const;

/** One of the {@linkcode HTTP_METHODS} a route operation may answer. */
export type HttpMethod = (typeof HTTP_METHODS)[number];

type SchemaOutput<Schema, Fallback> = Schema extends {
  readonly _zod: { readonly output: infer Output };
} ? Output
  : Schema extends { readonly _output: infer Output } ? Output
  : Fallback;

type ReadonlyOutput<Output> = Output extends object ? Readonly<Output> : Output;

type LocationOutput<
  Schemas,
  Location extends PropertyKey,
  Fallback,
> = Schemas extends { readonly [Key in Location]: infer Schema }
  ? ReadonlyOutput<SchemaOutput<Schema, Fallback>>
  : Fallback;

type BodyOutput<Schemas> = Schemas extends {
  readonly body: { readonly schema: infer Schema };
} ? ReadonlyOutput<SchemaOutput<Schema, unknown>>
  : undefined;

/**
 * The authenticated caller a handler runs on behalf of.
 *
 * Present only on routes whose security declares authentication; a route
 * declaring `"none"` receives `null` instead, and the type reflects that so a
 * handler cannot read a principal it was never given.
 */
export interface RoutePrincipal {
  /** Stable identifier for the caller, unique within its {@linkcode type}. */
  readonly id: string;
  /** What kind of caller this is, as named by the authentication provider. */
  readonly type: string;
  /** Additional claims the provider asserted about the caller. */
  readonly claims?: Readonly<Record<string, unknown>>;
}

type SecurityPrincipal<Security> = Security extends {
  readonly authentication: { readonly mode: "required" };
} ? RoutePrincipal
  : Security extends {
    readonly authentication: { readonly mode: "none" };
  } ? null
  : RoutePrincipal | null;

/**
 * What a route handler receives.
 *
 * Each validated location is typed from the route's own schemas, so `params`,
 * `query`, `headers`, and `body` arrive already parsed rather than as raw
 * strings the handler has to re-check.
 */
export interface RouteHandlerContext<Schemas = unknown, Security = unknown> {
  /** The incoming request, unmodified. */
  readonly request: Request;
  /** Path parameters, parsed by the route's `params` schema. */
  readonly params: LocationOutput<
    Schemas,
    "params",
    Readonly<Record<string, string>>
  >;
  /** Query string values, parsed by the route's `query` schema. */
  readonly query: LocationOutput<
    Schemas,
    "query",
    Readonly<Record<string, unknown>>
  >;
  /** Request headers, parsed by the route's `headers` schema. */
  readonly headers: LocationOutput<
    Schemas,
    "headers",
    Readonly<Record<string, unknown>>
  >;
  /** The parsed request body, or `undefined` when the route declares none. */
  readonly body: BodyOutput<Schemas>;
  /** Aborts when the client disconnects or the request times out. */
  readonly signal: AbortSignal;
  /** The authenticated caller, or `null` on an unauthenticated route. */
  readonly principal: SecurityPrincipal<Security>;
  /** Correlates this request across logs and captured evidence. */
  readonly requestId: string;
}

/**
 * One method's implementation within a route module: its schemas, its security,
 * its documented contract, and the handler that answers it.
 */
export interface RouteOperation<
  Schemas = unknown,
  Security = unknown,
  Contract = unknown,
> {
  /** Validation schemas for each request location and each response status. */
  readonly schemas: Schemas;
  /** Authentication and authorization requirements for this operation. */
  readonly security: Security;
  /** Documentation for this operation, such as its summary. */
  readonly contract: Contract;
  /** Answers the request once validation and security have passed. */
  readonly handler: (
    context: RouteHandlerContext<Schemas, Security>,
  ) => Response | Promise<Response>;
}

/** A route file's default export: one operation per method it answers. */
export type RouteModule = Partial<
  Record<HttpMethod, RouteOperation<unknown, unknown, unknown>>
>;

/**
 * One method of one route after discovery, with its URL path derived from the
 * file's position in the tree. This is what the router dispatches against.
 */
export interface NormalizedRoute {
  /** The method this entry answers. */
  readonly method: HttpMethod;
  /** The URL path, with parameters as `[name]` segments. */
  readonly path: string;
  /** Path of the file this route was discovered from. */
  readonly source: string;
  /** Names of the path parameters, in the order they appear. */
  readonly parameterNames: readonly string[];
  /** The operation to invoke for this method. */
  readonly operation: RouteOperation<unknown, unknown, unknown>;
}

/** One reason discovery refused a route tree. */
export interface RoutingDiagnostic {
  /** Stable machine-readable identifier for this kind of fault. */
  readonly code: string;
  /** What is wrong, in one sentence. */
  readonly summary: string;
  /** The files this diagnostic was raised against. */
  readonly files: readonly string[];
  /** The route path concerned, when the fault is specific to one. */
  readonly route?: string;
  /** What to change to resolve it. */
  readonly correction?: string;
}

/**
 * Thrown when a route tree cannot be discovered.
 *
 * Discovery reports every fault it found rather than the first, so one run
 * surfaces the whole set of corrections.
 */
export class RouteDiscoveryError extends Error {
  /**
   * Builds an error whose message lists every diagnostic, one per line.
   *
   * @param diagnostics Every fault discovery found, in the order detected.
   */
  constructor(readonly diagnostics: readonly RoutingDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.summary}`
      ).join("\n"),
    );
    this.name = "RouteDiscoveryError";
  }
}
