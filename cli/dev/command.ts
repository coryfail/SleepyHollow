import { platform } from "#platform";
import { isAbsolute, relative, resolve, sep } from "path";

import { normalizeDiagnostics, renderDevEvent } from "./render.ts";
import { createLocalDevDependencies } from "./local.ts";
import {
  type ActiveDevRuntime,
  DevCommandError,
  type DevCommandIo,
  type DevDependencies,
  type DevDiagnostic,
  type DevEvent,
  type DevWatcher,
  type PreparedDevRuntime,
} from "./types.ts";

interface ParsedInvocation {
  readonly json: boolean;
  readonly port: number;
}

const diagnostic = (
  code: string,
  summary: string,
  correction: string,
): DevDiagnostic => ({ code, severity: "error", summary, correction });

function parse(args: readonly string[]): ParsedInvocation | DevDiagnostic {
  let json = false;
  let port = 8000;
  let portSeen = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--json") {
      if (json) {
        return diagnostic(
          "SH_DEV_USAGE_INVALID",
          "The --json option was provided more than once",
          "Use hollow dev [--port <1-65535>] [--json].",
        );
      }
      json = true;
      continue;
    }
    if (value === "--port") {
      if (portSeen || index + 1 >= args.length) {
        return diagnostic(
          "SH_DEV_USAGE_INVALID",
          "The --port option is duplicated or incomplete",
          "Provide --port once with an integer from 1 through 65535.",
        );
      }
      const raw = args[++index];
      if (!/^[0-9]+$/.test(raw)) {
        return diagnostic(
          "SH_DEV_USAGE_INVALID",
          "The development port is not an integer",
          "Provide --port once with an integer from 1 through 65535.",
        );
      }
      port = Number(raw);
      portSeen = true;
      if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
        return diagnostic(
          "SH_DEV_USAGE_INVALID",
          "The development port is outside the supported range",
          "Provide --port once with an integer from 1 through 65535.",
        );
      }
      continue;
    }
    return diagnostic(
      "SH_DEV_USAGE_INVALID",
      `Unknown development option: ${value}`,
      "Use hollow dev [--port <1-65535>] [--json].",
    );
  }
  return { json, port };
}

function failure(
  error: unknown,
  fallback: DevDiagnostic,
): readonly DevDiagnostic[] {
  return normalizeDiagnostics(
    error instanceof DevCommandError ? error.diagnostics : [fallback],
  );
}

function changedPaths(
  projectRoot: string,
  paths: readonly string[],
): readonly string[] | DevDiagnostic {
  const normalized: string[] = [];
  for (const path of paths) {
    const absolute = isAbsolute(path)
      ? resolve(path)
      : resolve(projectRoot, path);
    const local = relative(projectRoot, absolute).split(sep).join("/");
    if (!local || local === ".." || local.startsWith("../")) {
      return diagnostic(
        "SH_DEV_WATCH_PATH_UNSAFE",
        "A filesystem event resolved outside the project",
        "Watch only project-contained application inputs.",
      );
    }
    if (
      local === ".git" || local.startsWith(".git/") ||
      local === "generated" || local.startsWith("generated/") ||
      local.includes("/node_modules/") ||
      /(?:^|\/)(?:\.DS_Store|.*(?:\.swp|~))$/.test(local)
    ) continue;
    normalized.push(local);
  }
  return Object.freeze([...new Set(normalized)].sort());
}

function abortReason(signal: AbortSignal): DevEvent["reason"] {
  const reason = String(signal.reason ?? "cancelled").toLowerCase();
  if (reason.includes("interrupt") || reason.includes("sigint")) {
    return "interrupt";
  }
  if (reason.includes("termination") || reason.includes("sigterm")) {
    return "termination";
  }
  return "cancelled";
}

export async function runDevCommand(
  args: readonly string[],
  io: DevCommandIo,
  suppliedDependencies?: DevDependencies,
): Promise<number> {
  const parsed = parse(args);
  if ("code" in parsed) {
    const value = JSON.stringify({
      ok: false,
      command: "dev",
      schema: "sleepy-hollow-cli-result/v1",
      diagnostics: [parsed],
    });
    io.stderr(
      args.includes("--json")
        ? value
        : `${parsed.code}: ${parsed.summary}\n${parsed.correction}`,
    );
    return 2;
  }
  const dependencies = suppliedDependencies ?? createLocalDevDependencies();
  const projectRoot = suppliedDependencies
    ? resolve(io.cwd)
    : await platform.realPath(resolve(io.cwd));
  const signal = dependencies.signal ?? new AbortController().signal;
  let sequence = 0;
  let generation = 1;
  let active: ActiveDevRuntime | undefined;
  let candidate: PreparedDevRuntime | undefined;
  let watcher: DevWatcher | undefined;
  let watcherClosed = false;
  let activeStopped = false;

  const emit = (
    event: Omit<DevEvent, "schema" | "command" | "sequence" | "mode">,
  ) => {
    const normalized: DevEvent = Object.freeze({
      schema: "sleepy-hollow-dev-event/v1",
      command: "dev",
      sequence: ++sequence,
      mode: "development",
      ...event,
      diagnostics: normalizeDiagnostics(event.diagnostics),
    });
    const output = renderDevEvent(normalized, parsed.json);
    (normalized.type === "diagnostic" && !parsed.json ? io.stderr : io.stdout)(
      output,
    );
  };
  const closeWatcher = async () => {
    if (!watcher || watcherClosed) return;
    watcherClosed = true;
    await watcher.close();
  };
  const stopActive = async () => {
    if (!active || activeStopped) return;
    activeStopped = true;
    await active.stop();
  };
  const onAbort = () => {
    void closeWatcher();
  };
  signal.addEventListener("abort", onAbort, { once: true });

  try {
    try {
      candidate = await dependencies.prepare({
        projectRoot,
        hostname: "127.0.0.1",
        port: parsed.port,
        mode: "development",
        generation,
        signal,
      });
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      active = await candidate.activate();
      candidate = undefined;
      emit({
        type: "startup",
        state: "active",
        generation,
        url: active.url,
        routeCount: active.routeCount,
        diagnostics: [],
      });
    } catch (error) {
      const diagnostics = failure(
        error,
        diagnostic(
          "SH_DEV_STARTUP_FAILED",
          "The development runtime failed before becoming active",
          "Repair the project, route, configuration, or listener failure and retry.",
        ),
      );
      await candidate?.close?.();
      emit({ type: "diagnostic", state: "rejected", generation, diagnostics });
      emit({
        type: "shutdown",
        state: "stopped",
        generation,
        reason: "failure",
        diagnostics: [],
      });
      return 1;
    }

    try {
      watcher = await dependencies.watch({ projectRoot, signal });
    } catch (error) {
      emit({
        type: "diagnostic",
        state: "rejected",
        generation,
        diagnostics: failure(
          error,
          diagnostic(
            "SH_DEV_WATCH_FAILED",
            "The development watcher could not start",
            "Restore filesystem watch access and retry.",
          ),
        ),
      });
      await stopActive();
      emit({
        type: "shutdown",
        state: "stopped",
        generation,
        reason: "failure",
        diagnostics: [],
      });
      return 1;
    }
    if (signal.aborted) await closeWatcher();

    for await (const paths of watcher) {
      if (signal.aborted) break;
      const changes = changedPaths(projectRoot, paths);
      if (!Array.isArray(changes)) {
        emit({
          type: "diagnostic",
          state: "rejected",
          generation: generation + 1,
          diagnostics: [changes as DevDiagnostic],
        });
        continue;
      }
      if (changes.length === 0) continue;
      const nextGeneration = generation + 1;
      try {
        candidate = await dependencies.prepare({
          projectRoot,
          hostname: "127.0.0.1",
          port: parsed.port,
          mode: "development",
          generation: nextGeneration,
          signal,
        });
      } catch (error) {
        emit({
          type: "diagnostic",
          state: "rejected",
          generation: nextGeneration,
          changedFiles: changes,
          diagnostics: failure(
            error,
            diagnostic(
              "SH_DEV_RELOAD_FAILED",
              "The changed runtime could not be prepared",
              "Repair the changed application inputs; the prior generation remains active.",
            ),
          ),
        });
        continue;
      }
      try {
        await stopActive();
        active = undefined;
        activeStopped = false;
        active = await candidate.activate();
        candidate = undefined;
        generation = nextGeneration;
        emit({
          type: "reload",
          state: "active",
          generation,
          url: active.url,
          routeCount: active.routeCount,
          changedFiles: changes,
          diagnostics: [],
        });
      } catch (error) {
        await candidate?.close?.();
        candidate = undefined;
        emit({
          type: "diagnostic",
          state: "rejected",
          generation: nextGeneration,
          changedFiles: changes,
          diagnostics: failure(
            error,
            diagnostic(
              "SH_DEV_ACTIVATION_FAILED",
              "The prepared runtime could not bind and become active",
              "Repair the listener failure and make another source change.",
            ),
          ),
        });
      }
    }

    const normal = signal.aborted;
    await closeWatcher();
    await stopActive();
    emit({
      type: "shutdown",
      state: "stopped",
      generation,
      reason: normal ? abortReason(signal) : "failure",
      diagnostics: [],
    });
    return normal ? 0 : 1;
  } catch (error) {
    try {
      await candidate?.close?.();
    } catch {
      // Cleanup remains best-effort while the original failure is reported.
    }
    await closeWatcher().catch(() => undefined);
    await stopActive().catch(() => undefined);
    emit({
      type: "diagnostic",
      state: "rejected",
      generation,
      diagnostics: failure(
        error,
        diagnostic(
          "SH_DEV_SUPERVISOR_FAILED",
          "The development supervisor failed",
          "Inspect the bounded diagnostic and retry after repairing the host boundary.",
        ),
      ),
    });
    emit({
      type: "shutdown",
      state: "stopped",
      generation,
      reason: "failure",
      diagnostics: [],
    });
    return 1;
  } finally {
    signal.removeEventListener("abort", onAbort);
    await dependencies.dispose?.();
  }
}
