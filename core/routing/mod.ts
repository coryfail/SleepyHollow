/**
 * Filesystem routing: route definition, discovery, and dispatch.
 *
 * A route is a module that exports one handler per HTTP method. Discovery
 * walks a directory and derives each route's path and operations from the
 * file layout, so the URL surface is a consequence of the tree rather than a
 * separate registration list that can drift from it.
 *
 * @module
 */
export { defineRoute } from "./define_route.ts";
export { discoverRoutes } from "./discover.ts";
export { createRouter } from "./router.ts";
export {
  HTTP_METHODS,
  type HttpMethod,
  type NormalizedRoute,
  RouteDiscoveryError,
  type RouteHandlerContext,
  type RouteModule,
  type RouteOperation,
  type RoutePrincipal,
  type RoutingDiagnostic,
} from "./types.ts";
