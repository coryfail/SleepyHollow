import { platform } from "#platform";
import type { NormalizedRoute } from "./types.ts";

interface Match {
  readonly route: NormalizedRoute;
  readonly params: Readonly<Record<string, string>>;
}

function splitPath(path: string): readonly string[] | undefined {
  try {
    return path.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return undefined;
  }
}

function matchRoute(
  route: NormalizedRoute,
  requestSegments: readonly string[],
): Match | undefined {
  const routeSegments = route.path.split("/").filter(Boolean);
  if (routeSegments.length !== requestSegments.length) return undefined;

  const params: Record<string, string> = {};
  for (let index = 0; index < routeSegments.length; index += 1) {
    const expected = routeSegments[index];
    const actual = requestSegments[index];
    if (expected.startsWith(":")) params[expected.slice(1)] = actual;
    else if (expected !== actual) return undefined;
  }

  return { route, params };
}

function compareSpecificity(left: Match, right: Match): number {
  const leftSegments = left.route.path.split("/").filter(Boolean);
  const rightSegments = right.route.path.split("/").filter(Boolean);

  for (let index = 0; index < leftSegments.length; index += 1) {
    const leftDynamic = leftSegments[index].startsWith(":");
    const rightDynamic = rightSegments[index].startsWith(":");
    if (leftDynamic !== rightDynamic) return leftDynamic ? 1 : -1;
  }

  return left.route.path.localeCompare(right.route.path);
}

function problem(
  status: number,
  title: string,
  instance: string,
  headers?: HeadersInit,
): Response {
  return new Response(
    JSON.stringify({ type: "about:blank", title, status, instance }),
    {
      status,
      headers: {
        "content-type": "application/problem+json",
        ...headers,
      },
    },
  );
}

/**
 * Builds a request handler that dispatches to a discovered route table.
 *
 * The returned object exposes `fetch`, so it can be passed to `platform.serve`
 * directly. An unmatched path answers 404 and an unmatched method answers 405,
 * both as problem-details responses.
 *
 * ```ts
 * import { createRouter, discoverRoutes } from "@sleepy-hollow/framework";
 *
 * const router = createRouter(await discoverRoutes("./api"));
 * platform.serve(router.fetch);
 * ```
 *
 * @param routes The route table, normally from {@linkcode discoverRoutes}.
 * @returns A handler suitable for `platform.serve`.
 */
export function createRouter(
  routes: readonly NormalizedRoute[],
): { fetch(request: Request): Promise<Response> } {
  const inventory = [...routes];

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const requestSegments = splitPath(url.pathname);
      if (!requestSegments) return problem(404, "Not Found", url.pathname);

      const matches = inventory
        .map((route) => matchRoute(route, requestSegments))
        .filter((match): match is Match => match !== undefined)
        .sort(compareSpecificity);

      if (matches.length === 0) return problem(404, "Not Found", url.pathname);

      const selectedPath = matches[0].route.path;
      const pathMatches = matches.filter((match) =>
        match.route.path === selectedPath
      );
      const method = request.method.toUpperCase();
      const selected = pathMatches.find((match) =>
        match.route.method === method
      );
      if (!selected) {
        const allowed = [
          ...new Set(pathMatches.map((match) => match.route.method)),
        ]
          .sort();
        return problem(405, "Method Not Allowed", url.pathname, {
          allow: allowed.join(", "),
        });
      }

      return await selected.route.operation.handler({
        request,
        params: selected.params,
        query: Object.freeze({}),
        headers: Object.freeze({}),
        body: undefined,
        signal: request.signal,
        principal: null,
        requestId: "",
      });
    },
  };
}
