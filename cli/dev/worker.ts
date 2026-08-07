import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { resolveConfiguration } from "../../core/config/mod.ts";
import { discoverRoutes } from "../../core/routing/mod.ts";
import { createValidatedRouter } from "../../core/validation/mod.ts";
import { DevCommandError, type DevDiagnostic } from "./types.ts";

interface WorkerProject {
  readonly apiDirectory?: string;
  readonly configuration?: Parameters<typeof resolveConfiguration>[0];
}

function contained(root: string, path: string): boolean {
  const local = relative(root, path);
  return local === "" ||
    (local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local));
}

function projectError(
  code: string,
  summary: string,
  correction: string,
  files: readonly string[] = ["sleepyhollow.config.ts"],
): DevCommandError {
  return new DevCommandError([{
    code,
    severity: "error",
    summary,
    correction,
    files,
  }]);
}

function safeDiagnostic(
  error: unknown,
  intent: "validate" | "serve",
): readonly DevDiagnostic[] {
  if (error instanceof DevCommandError) return error.diagnostics;
  const value = error as {
    readonly diagnostics?: readonly Record<string, unknown>[];
  };
  if (Array.isArray(value?.diagnostics)) {
    return value.diagnostics.map((item) => ({
      code: typeof item.code === "string" && /^SH_[A-Z0-9_]+$/.test(item.code)
        ? item.code
        : "SH_DEV_PROJECT_INVALID",
      severity: "error" as const,
      summary: typeof item.summary === "string"
        ? item.summary
        : typeof item.expected === "string"
        ? `Expected ${item.expected}`
        : "The project runtime is invalid",
      correction: typeof item.correction === "string"
        ? item.correction
        : "Repair the affected project input and retry.",
      ...(Array.isArray(item.files)
        ? {
          files: item.files.filter((path: unknown): path is string =>
            typeof path === "string"
          ),
        }
        : {}),
      ...(typeof item.key === "string" ? { configuration: [item.key] } : {}),
    }));
  }
  if (
    intent === "serve" &&
    (error instanceof Deno.errors.AddrInUse ||
      error instanceof Deno.errors.PermissionDenied)
  ) {
    return [{
      code: "SH_DEV_BIND_FAILED",
      severity: "error",
      summary: "The loopback listener could not bind",
      correction: "Choose an available port and confirm local network access.",
    }];
  }
  return [{
    code: "SH_DEV_PROJECT_INVALID",
    severity: "error",
    summary: "The project runtime could not be prepared",
    correction:
      "Inspect the project configuration and route sources, then retry.",
    files: ["sleepyhollow.config.ts"],
  }];
}

async function loadRuntime(projectRoot: string) {
  const root = await Deno.realPath(resolve(projectRoot));
  const configPath = resolve(root, "sleepyhollow.config.ts");
  if (!contained(root, configPath)) {
    throw projectError(
      "SH_DEV_PROJECT_ESCAPE",
      "Project configuration resolved outside the project",
      "Keep sleepyhollow.config.ts inside the invocation directory.",
    );
  }
  const imported = await import(pathToFileURL(configPath).href);
  const project = imported.default as WorkerProject;
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    throw projectError(
      "SH_DEV_PROJECT_INVALID",
      "Project configuration has no default object export",
      "Default-export the canonical Sleepy Hollow project definition.",
    );
  }
  const apiDirectory = project.apiDirectory ?? "api";
  if (
    typeof apiDirectory !== "string" || !apiDirectory.trim() ||
    isAbsolute(apiDirectory)
  ) {
    throw projectError(
      "SH_DEV_API_DIRECTORY_INVALID",
      "The API directory is not a safe project-relative path",
      "Declare one project-contained API directory.",
    );
  }
  const apiRoot = resolve(root, apiDirectory);
  if (!contained(root, apiRoot)) {
    throw projectError(
      "SH_DEV_PROJECT_ESCAPE",
      "The API directory resolved outside the project",
      "Declare one project-contained API directory.",
    );
  }
  const realApiRoot = await Deno.realPath(apiRoot);
  if (!contained(root, realApiRoot)) {
    throw projectError(
      "SH_DEV_PROJECT_ESCAPE",
      "The API directory symlink resolves outside the project",
      "Remove the escaping symlink and use project-contained sources.",
      [apiDirectory],
    );
  }
  if (project.configuration) {
    await resolveConfiguration(project.configuration, {
      mode: "development",
      environment: {},
    });
  }
  const routes = await discoverRoutes(realApiRoot);
  const runtime = createValidatedRouter(routes);
  return { runtime, routeCount: runtime.routes.length };
}

export async function runDevWorker(args: readonly string[]): Promise<number> {
  if (args.length !== 4 || !["validate", "serve"].includes(args[0])) return 2;
  const [intent, projectRoot, hostname, rawPort] = args;
  const port = Number(rawPort);
  if (
    hostname !== "127.0.0.1" || !Number.isInteger(port) || port < 1 ||
    port > 65_535
  ) return 2;
  try {
    const { runtime, routeCount } = await loadRuntime(projectRoot);
    if (intent === "validate") {
      console.log(JSON.stringify({ ready: true, routeCount }));
      return 0;
    }
    const server = Deno.serve({
      hostname,
      port,
      onListen() {
        console.log(JSON.stringify({ ready: true, routeCount }));
      },
    }, (request) => runtime.fetch(request));
    await server.finished;
    return 0;
  } catch (error) {
    console.error(
      JSON.stringify({
        ready: false,
        diagnostics: safeDiagnostic(error, intent as "validate" | "serve"),
      }),
    );
    return 1;
  }
}
