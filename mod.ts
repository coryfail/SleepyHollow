/**
 * Sleepy Hollow, a Deno-native framework for building HTTP services whose
 * behaviour is derived from reviewable specifications.
 *
 * This entry point re-exports the runtime a generated project imports:
 * filesystem routing, request and response validation, security composition,
 * and configuration. Storage, service decomposition, testing, and capture are
 * reached through their own entry points so a project pays only for what it
 * uses.
 *
 * The framework targets Deno and depends on Deno KV, Deno Deploy, and Deno
 * runtime APIs. It does not support Node or Bun.
 *
 * ```ts
 * import { defineRoute, z } from "@sleepy-hollow/framework";
 *
 * // api/widgets/[id]/route.ts
 * export default defineRoute({
 *   GET: {
 *     schemas: {
 *       params: z.object({ id: z.string() }).strict(),
 *       responses: { 200: z.object({ id: z.string() }).strict() },
 *     },
 *     security: { authentication: "none" },
 *     contract: { summary: "Return one widget" },
 *     handler: ({ params }) => Response.json({ id: params.id }),
 *   },
 * });
 * ```
 *
 * Every schema is a Zod schema, every object schema is `.strict()`, and every
 * route states its authentication. There is no implicit default, because a
 * forgotten default is how an endpoint ships unprotected.
 *
 * @module
 */
export * from "./core/routing/mod.ts";
export * from "./core/validation/mod.ts";
export * from "./core/security/mod.ts";
export * from "./core/config/mod.ts";
