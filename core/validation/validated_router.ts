import {
  createRouter,
  type NormalizedRoute,
  type RouteHandlerContext,
} from "../routing/mod.ts";
import { normalizeRoutes } from "./normalize.ts";
import { type ParsedContext, parseRequest } from "./request.ts";
import { handlerFailure, validateResponse } from "./response.ts";
import type { ValidatedRouter, ValidationOptions } from "./types.ts";

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
