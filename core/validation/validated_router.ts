import {
  createRouter,
  type NormalizedRoute,
  type RouteHandlerContext,
} from "../routing/mod.ts";
import { normalizeRoutes } from "./normalize.ts";
import { type ParsedContext, parseRequest } from "./request.ts";
import { handlerFailure, validateResponse } from "./response.ts";
import type { ValidatedRouter, ValidationOptions } from "./types.ts";

/**
 * Wraps a route table so requests and responses are validated.
 *
 * A request that fails its schema is answered with problem details rather than
 * raised as a fault. A response that fails its schema is a defect in the
 * service, and is treated as one.
 *
 * @param routes The discovered route table.
 * @param options The posture, and where to report failures.
 * @returns A validating router, and its resolved schema inventory.
 * @throws {SchemaNormalizationError} When any route's schemas are invalid.
 */
export function createValidatedRouter(
  routes: readonly NormalizedRoute[],
  options: ValidationOptions = {},
): ValidatedRouter {
  const prepared = normalizeRoutes(routes);
  const wrapped = prepared.map(({ source, normalized }) => ({
    ...source,
    operation: {
      ...source.operation,
      handler: async (
        context: RouteHandlerContext<unknown>,
      ): Promise<Response> => {
        const request = await parseRequest(context, normalized.schemas);
        if (!request.success) return request.response;

        let response: Response;
        try {
          const handler = source.operation.handler as (
            context: ParsedContext,
          ) => Response | Promise<Response>;
          response = await handler(request.context);
        } catch {
          const failed = handlerFailure(source, context.request);
          if (failed.diagnostic) options.onDiagnostic?.(failed.diagnostic);
          return failed.response;
        }

        const validated = await validateResponse(
          source,
          normalized.schemas,
          context.request,
          response,
        );
        if (validated.diagnostic) options.onDiagnostic?.(validated.diagnostic);
        return validated.response;
      },
    },
  }));
  const router = createRouter(wrapped);

  return {
    routes: prepared.map((route) => route.normalized),
    fetch: (request) => router.fetch(request),
  };
}
