import { platform, type PlatformDirEntry } from "#platform";
import { dirname, relative, resolve, sep } from "path";
import { fileURLToPath, pathToFileURL } from "url";

import {
  HTTP_METHODS,
  type HttpMethod,
  type NormalizedRoute,
  RouteDiscoveryError,
  type RouteModule,
  type RouteOperation,
  type RoutingDiagnostic,
} from "./types.ts";

const dynamicSegment = /^\[([^\]]+)\]$/;
const parameterName = /^[A-Za-z_][A-Za-z0-9_]*$/;
const methods = new Set<string>(HTTP_METHODS);

interface RouteFile {
  readonly path: string;
  readonly segments: readonly string[];
  readonly routePath: string;
  readonly conflictPath: string;
  readonly parameterNames: readonly string[];
}

const portablePath = (path: string) => path.split(sep).join("/");

async function collectRouteFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  const entries: PlatformDirEntry[] = [];

  for await (const entry of platform.readDir(directory)) entries.push(entry);
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory) files.push(...await collectRouteFiles(path));
    if (entry.isFile && entry.name === "route.ts") files.push(path);
  }

  return files;
}

function normalizeRouteFile(
  apiRoot: string,
  path: string,
): RouteFile | RoutingDiagnostic {
  const segments = portablePath(relative(apiRoot, dirname(path))).split("/")
    .filter(Boolean);
  const routeSegments: string[] = [];
  const conflictSegments: string[] = [];
  const parameterNames: string[] = [];

  for (const segment of segments) {
    const match = segment.match(dynamicSegment);
    if (!match) {
      if (segment.includes("[") || segment.includes("]")) {
        return invalidSegment(path, segment);
      }
      routeSegments.push(segment);
      conflictSegments.push(segment);
      continue;
    }

    const name = match[1];
    if (!parameterName.test(name)) return invalidSegment(path, segment);
    if (parameterNames.includes(name)) {
      return {
        code: "SH_ROUTE_INVALID_SEGMENT",
        summary: `Dynamic parameter '${name}' is repeated in one route`,
        files: [portablePath(path)],
        correction: "Use a unique parameter name for every dynamic segment.",
      };
    }

    parameterNames.push(name);
    routeSegments.push(`:${name}`);
    conflictSegments.push(":parameter");
  }

  return {
    path: portablePath(path),
    segments,
    routePath: `/${routeSegments.join("/")}`,
    conflictPath: `/${conflictSegments.join("/")}`,
    parameterNames,
  };
}

function invalidSegment(path: string, segment: string): RoutingDiagnostic {
  return {
    code: "SH_ROUTE_INVALID_SEGMENT",
    summary: `Invalid dynamic route segment '${segment}'`,
    files: [portablePath(path)],
    correction:
      "Use [name] with a TypeScript identifier as the parameter name.",
  };
}

function validateModule(
  value: unknown,
  file: RouteFile,
): RoutingDiagnostic | RouteModule {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalidModule(
      file.path,
      "The default export must be created with defineRoute",
    );
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return invalidModule(
      file.path,
      "The route must declare at least one HTTP method",
    );
  }

  for (const [method, operation] of entries) {
    if (!methods.has(method)) {
      return invalidModule(file.path, `Unsupported HTTP method '${method}'`);
    }
    if (!isOperation(operation)) {
      return invalidModule(
        file.path,
        `${method} must declare schemas, security, contract, and a handler`,
      );
    }
  }

  return value as RouteModule;
}

function isOperation(value: unknown): value is RouteOperation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const operation = value as Record<string, unknown>;
  return Object.hasOwn(operation, "schemas") &&
    Object.hasOwn(operation, "security") &&
    Object.hasOwn(operation, "contract") &&
    typeof operation.handler === "function";
}

function invalidModule(path: string, summary: string): RoutingDiagnostic {
  return {
    code: "SH_ROUTE_INVALID_MODULE",
    summary,
    files: [portablePath(path)],
    correction:
      "Default-export one defineRoute method map with complete operations.",
  };
}

function findConflicts(files: readonly RouteFile[]): RoutingDiagnostic[] {
  const groups = Map.groupBy(files, (file) => file.conflictPath);
  const diagnostics: RoutingDiagnostic[] = [];

  for (const [route, group] of groups) {
    if (group.length < 2) continue;
    diagnostics.push({
      code: "SH_ROUTE_CONFLICT",
      summary: `Ambiguous route definitions normalize to '${route}'`,
      files: group.map((file) => file.path).sort(),
      route,
      correction: "Keep only one dynamic sibling at each route depth.",
    });
  }

  return diagnostics.sort((left, right) =>
    (left.route ?? "").localeCompare(right.route ?? "")
  );
}

/**
 * Walks a directory and derives the route table from the file layout.
 *
 * Each `route.ts` becomes one route whose URL path is its position in the
 * tree, and each method it exports becomes one entry. Faults are collected
 * across the whole tree and thrown together as a
 * {@linkcode RouteDiscoveryError}, so one run reports every correction rather
 * than stopping at the first.
 *
 * @param apiRoot Directory to walk, as a path or a `file:` URL.
 * @returns Every discovered route, one entry per method.
 * @throws {RouteDiscoveryError} When any route in the tree is malformed.
 */
export async function discoverRoutes(
  apiRoot: URL | string,
): Promise<readonly NormalizedRoute[]> {
  const root = resolve(
    apiRoot instanceof URL ? fileURLToPath(apiRoot) : apiRoot,
  );
  const diagnostics: RoutingDiagnostic[] = [];
  const routeFiles: RouteFile[] = [];

  for (const path of await collectRouteFiles(root)) {
    const normalized = normalizeRouteFile(root, path);
    if ("code" in normalized) diagnostics.push(normalized);
    else routeFiles.push(normalized);
  }

  diagnostics.push(...findConflicts(routeFiles));

  const routes: NormalizedRoute[] = [];
  for (const file of routeFiles) {
    try {
      const imported = await import(pathToFileURL(file.path).href);
      const routeModule = validateModule(imported.default, file);
      if ("code" in routeModule) {
        diagnostics.push(routeModule);
        continue;
      }

      for (const [method, operation] of Object.entries(routeModule)) {
        routes.push({
          method: method as HttpMethod,
          path: file.routePath,
          source: file.path,
          parameterNames: file.parameterNames,
          operation,
        });
      }
    } catch (error) {
      diagnostics.push(invalidModule(
        file.path,
        `Route module could not be loaded: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ));
    }
  }

  if (diagnostics.length > 0) {
    diagnostics.sort((left, right) =>
      `${left.code}:${left.files.join(":")}`.localeCompare(
        `${right.code}:${right.files.join(":")}`,
      )
    );
    throw new RouteDiscoveryError(diagnostics);
  }

  return routes.sort((left, right) =>
    left.path.localeCompare(right.path) ||
    left.method.localeCompare(right.method)
  );
}
