import type {
  HttpMethod,
  RouteHandlerContext,
  RouteOperation,
} from "./types.ts";

type MethodMap = Partial<Record<HttpMethod, unknown>>;

type DefinedRoute<
  Schemas extends MethodMap,
  Security extends { readonly [Method in keyof Schemas]: unknown },
  Contract extends { readonly [Method in keyof Schemas]: unknown },
> = {
  readonly [Method in keyof Schemas]: RouteOperation<
    Schemas[Method],
    Security[Method],
    Contract[Method]
  >;
};

export function defineRoute<
  const Schemas extends MethodMap,
  const Security extends { readonly [Method in keyof Schemas]: unknown },
  const Contract extends { readonly [Method in keyof Schemas]: unknown },
>(
  route: {
    readonly [Method in keyof Schemas]: {
      readonly schemas: Schemas[Method];
      readonly security: Security[Method];
      readonly contract: Contract[Method];
      readonly handler: (
        context: RouteHandlerContext<Schemas[Method], Security[Method]>,
      ) => Response | Promise<Response>;
    };
  },
): DefinedRoute<Schemas, Security, Contract> {
  return route;
}
