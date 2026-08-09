export const HTTP_METHODS = [
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
] as const;

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

export interface RoutePrincipal {
  readonly id: string;
  readonly type: string;
  readonly claims?: Readonly<Record<string, unknown>>;
}

type SecurityPrincipal<Security> = Security extends {
  readonly authentication: { readonly mode: "required" };
} ? RoutePrincipal
  : Security extends {
    readonly authentication: { readonly mode: "none" };
  } ? null
  : RoutePrincipal | null;

export interface RouteHandlerContext<Schemas = unknown, Security = unknown> {
  readonly request: Request;
  readonly params: LocationOutput<
    Schemas,
    "params",
    Readonly<Record<string, string>>
  >;
  readonly query: LocationOutput<
    Schemas,
    "query",
    Readonly<Record<string, unknown>>
  >;
  readonly headers: LocationOutput<
    Schemas,
    "headers",
    Readonly<Record<string, unknown>>
  >;
  readonly body: BodyOutput<Schemas>;
  readonly signal: AbortSignal;
  readonly principal: SecurityPrincipal<Security>;
  readonly requestId: string;
}

export interface RouteOperation<
  Schemas = unknown,
  Security = unknown,
  Contract = unknown,
> {
  readonly schemas: Schemas;
  readonly security: Security;
  readonly contract: Contract;
  readonly handler: (
    context: RouteHandlerContext<Schemas, Security>,
  ) => Response | Promise<Response>;
}

export type RouteModule = Partial<
  Record<HttpMethod, RouteOperation<unknown, unknown, unknown>>
>;

export interface NormalizedRoute {
  readonly method: HttpMethod;
  readonly path: string;
  readonly source: string;
  readonly parameterNames: readonly string[];
  readonly operation: RouteOperation<unknown, unknown, unknown>;
}

export interface RoutingDiagnostic {
  readonly code: string;
  readonly summary: string;
  readonly files: readonly string[];
  readonly route?: string;
  readonly correction?: string;
}

export class RouteDiscoveryError extends Error {
  constructor(readonly diagnostics: readonly RoutingDiagnostic[]) {
    super(
      diagnostics.map((diagnostic) =>
        `${diagnostic.code}: ${diagnostic.summary}`
      ).join("\n"),
    );
    this.name = "RouteDiscoveryError";
  }
}
