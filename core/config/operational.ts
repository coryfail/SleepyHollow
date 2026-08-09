import type { NormalizedRoute, RouteOperation } from "../routing/mod.ts";
import { z } from "../validation/mod.ts";
import {
  type ConfigurationDiagnostic,
  ConfigurationError,
  type OperationalRouteOptions,
  type ReadinessCheck,
} from "./types.ts";

const SAFE_NAME = /^[A-Za-z0-9._:-]{1,128}$/;

function diagnostic(
  code: string,
  expected: string,
  correction: string,
  key?: string,
): ConfigurationDiagnostic {
  return {
    code,
    severity: "error",
    ...(key ? { key } : {}),
    expected,
    correction,
  };
}

function validPath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith("/") && path !== "/" &&
    !path.endsWith("/") &&
    path.split("/").slice(1).every((segment) =>
      /^[A-Za-z0-9._~-]+$/.test(segment)
    );
}

function operationRoute(
  path: string,
  source: string,
  responses: Readonly<Record<number, z.ZodType>>,
  handler: () => Response | Promise<Response>,
): NormalizedRoute {
  return {
    method: "GET",
    path,
    source,
    parameterNames: [],
    operation: {
      schemas: { responses },
      security: { authentication: { mode: "none" } },
      contract: { summary: source },
      handler: handler as RouteOperation["handler"],
    },
  };
}

async function runCheck(check: ReadinessCheck): Promise<boolean> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      controller.abort("Readiness check timed out");
      resolve(false);
    }, check.timeoutMs);
  });
  const execution = Promise.resolve()
    .then(() => check.check(controller.signal))
    .then((ready) => ready === true)
    .catch(() => false);
  try {
    return await Promise.race([execution, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Builds liveness and readiness routes, ready to add to the route table.
 *
 * Liveness answers whether the process is up; readiness probes the declared
 * dependencies, each under its own timeout, and reports which one failed. A
 * probe that exceeds its timeout counts as failed rather than hanging.
 *
 * @param options The paths to expose, and the dependencies to probe.
 * @returns Routes to include alongside the discovered ones.
 * @throws {ConfigurationError} When a path or readiness check is malformed.
 */
export function createOperationalRoutes(
  options: OperationalRouteOptions,
): readonly NormalizedRoute[] {
  const diagnostics: ConfigurationDiagnostic[] = [];
  if (!validPath(options.healthPath)) {
    diagnostics.push(diagnostic(
      "SH_OPERATIONAL_PATH_INVALID",
      "an explicit absolute static health path",
      "Use a path such as /_health.",
      "healthPath",
    ));
  }

  const checks = [...(options.readiness ?? [])];
  if (checks.length > 0 && !validPath(options.readinessPath)) {
    diagnostics.push(diagnostic(
      "SH_OPERATIONAL_PATH_INVALID",
      "an explicit absolute static readiness path",
      "Declare readinessPath when readiness checks exist.",
      "readinessPath",
    ));
  }
  if (
    checks.length > 0 && options.readinessPath === options.healthPath
  ) {
    diagnostics.push(diagnostic(
      "SH_OPERATIONAL_PATH_DUPLICATE",
      "distinct health and readiness paths",
      "Choose a different readiness path.",
      "readinessPath",
    ));
  }

  const names = new Set<string>();
  for (const check of checks) {
    if (
      !SAFE_NAME.test(check.name) || names.has(check.name) ||
      !Number.isSafeInteger(check.timeoutMs) || check.timeoutMs <= 0 ||
      typeof check.check !== "function"
    ) {
      diagnostics.push(diagnostic(
        names.has(check.name)
          ? "SH_READINESS_CHECK_DUPLICATE"
          : "SH_READINESS_CHECK_INVALID",
        "a unique safe name, positive timeout, and async check",
        "Repair the readiness declaration before startup.",
        check.name,
      ));
    }
    names.add(check.name);
  }
  if (diagnostics.length > 0) throw new ConfigurationError(diagnostics);

  const healthSchema = z.strictObject({
    status: z.enum(["healthy", "unhealthy"]),
  });
  const routes: NormalizedRoute[] = [operationRoute(
    options.healthPath,
    "sleepyhollow:operational/health",
    { 200: healthSchema, 503: healthSchema },
    () => {
      let healthy = false;
      try {
        healthy = options.isHealthy?.() ?? true;
      } catch {
        healthy = false;
      }
      return Response.json(
        { status: healthy ? "healthy" : "unhealthy" },
        { status: healthy ? 200 : 503 },
      );
    },
  )];

  if (checks.length > 0) {
    const readinessSchema = z.strictObject({
      status: z.enum(["ready", "not-ready"]),
      checks: z.array(z.strictObject({ name: z.string(), ready: z.boolean() })),
    });
    const sorted = checks.sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    routes.push(operationRoute(
      options.readinessPath!,
      "sleepyhollow:operational/readiness",
      { 200: readinessSchema, 503: readinessSchema },
      async () => {
        const states = await Promise.all(sorted.map(async (check) => ({
          name: check.name,
          ready: await runCheck(check),
        })));
        const ready = states.every((state) => state.ready);
        return Response.json({
          status: ready ? "ready" : "not-ready",
          checks: states,
        }, { status: ready ? 200 : 503 });
      },
    ));
  }

  return Object.freeze(routes);
}
