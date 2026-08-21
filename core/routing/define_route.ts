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

/**
 * Declares the operations a route file answers, one per HTTP method.
 *
 * The call is an identity function at runtime; its work is done in the type
 * system, where the schemas you pass become the types of `params`, `query`,
 * `headers`, and `body` inside each handler, and the declared authentication
 * mode determines whether `principal` can be `null`.
 *
 * ```ts
 * import { defineRoute } from "@sleepy-hollow/framework/routing";
 * import { z } from "@sleepy-hollow/framework/validation";
 *
 * export default defineRoute({
 *   GET: {
 *     schemas: {
 *       params: z.object({ id: z.string() }).strict(),
 *       responses: { 200: z.object({ id: z.string() }).strict() },
 *     },
 *     security: { authentication: { mode: "none" } },
 *     contract: { summary: "Return one widget" },
 *     handler: ({ params }) => Response.json({ id: params.id }),
 *   },
 * });
 * ```
 *
 * @param route The operations this file answers, keyed by HTTP method.
 * @returns The same declaration, typed so handlers infer their inputs.
 */
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
