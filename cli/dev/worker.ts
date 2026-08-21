import { platform } from "#platform";
import { isAbsolute, relative, resolve, sep } from "path";
import { pathToFileURL } from "url";

import { resolveConfiguration } from "../../core/config/mod.ts";
import { discoverRoutes } from "../../core/routing/mod.ts";
import { composeProjectSecurity } from "../../core/security/mod.ts";
import { DevCommandError, type DevDiagnostic } from "./types.ts";

interface WorkerProject {
  readonly apiDirectory?: string;
  readonly securityModule?: string;
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
  const nodeError = error as {
    readonly code?: unknown;
    readonly syscall?: unknown;
  };
  const nodeCode = typeof nodeError?.code === "string" ? nodeError.code : undefined;
  const isListenFailure =
    error instanceof platform.errors.AddrInUse ||
    error instanceof platform.errors.PermissionDenied ||
    nodeError?.syscall === "listen" ||
    nodeCode === "EADDRINUSE" || nodeCode === "EACCES" || nodeCode === "EPERM";
  if (intent === "serve" && isListenFailure) {
    return [{
      code: "SH_DEV_BIND_FAILED",
      severity: "error",
      summary: nodeCode
        ? `The loopback listener failed with ${nodeCode}`
        : "The loopback listener could not bind",
      correction: "Choose an available port and confirm local network access.",
    }];
  }
  if (intent === "serve") {
    const cause = error instanceof Error
      ? `${error.name}: ${error.message}`
        .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
        .replace(/(?:Bearer|token|password|secret|authorization)[=: ]+\S+/gi, "$1=[redacted]")
        .replace(/(?:[A-Za-z]:)?\/[^\s]+/g, "[path]")
        .slice(0, 180)
      : undefined;
    return [{
      code: "SH_DEV_SERVE_FAILED",
      severity: "error",
      summary: cause
        ? `The development server failed: ${cause}`
        : "The development server failed",
      correction:
        "Inspect the bounded server diagnostic and retry after repairing the host boundary.",
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

export async function loadRuntime(projectRoot: string) {
  const root = await platform.realPath(resolve(projectRoot));
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
  const realApiRoot = await platform.realPath(apiRoot);
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
  const runtime = await composeProjectSecurity(routes, {
    mode: "development",
    root,
    ...(project.securityModule === undefined
      ? {}
      : { securityModule: project.securityModule }),
  });
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
  let server: ReturnType<typeof platform.serve> | undefined;
  try {
    const { runtime, routeCount } = await loadRuntime(projectRoot);
    if (intent === "validate") {
      console.log(JSON.stringify({ ready: true, routeCount }));
      return 0;
    }
    server = platform.serve({ hostname, port }, (request) => runtime.fetch(request));
    await server.ready;
    console.log(JSON.stringify({ ready: true, routeCount }));
    await server.finished;
    return 0;
  } catch (error) {
    await server?.shutdown().catch(() => undefined);
    console.error(
      JSON.stringify({
        ready: false,
        diagnostics: safeDiagnostic(error, intent as "validate" | "serve"),
      }),
    );
    return 1;
  }
}
