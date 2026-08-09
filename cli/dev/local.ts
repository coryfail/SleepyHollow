import { basename } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type ActiveDevRuntime,
  DevCommandError,
  type DevDependencies,
  type DevDiagnostic,
  type DevPrepareOptions,
  type DevWatcher,
  type PreparedDevRuntime,
} from "./types.ts";

const WORKER = "__sleepy_hollow_dev_worker";
const READY_TIMEOUT_MS = 10_000;
const OUTPUT_LIMIT = 8 * 1024;

interface WorkerReady {
  readonly ready: boolean;
  readonly routeCount?: number;
  readonly diagnostics?: readonly DevDiagnostic[];
}

async function readBounded(
  stream: ReadableStream<Uint8Array>,
  limit = OUTPUT_LIMIT,
): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < limit) {
    const result = await reader.read();
    if (result.done) break;
    const remaining = limit - size;
    chunks.push(result.value.slice(0, remaining));
    size += Math.min(result.value.length, remaining);
  }
  if (size >= limit) void drain(reader);
  else reader.releaseLock();
  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(combined);
}

async function drain(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<void> {
  try {
    while (!(await reader.read()).done) {
      // Drain bounded worker noise so the child cannot block on its pipe.
    }
  } catch {
    // Process shutdown may close the stream abruptly.
  } finally {
    reader.releaseLock();
  }
}

async function readFirstLine(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (text.length < OUTPUT_LIMIT) {
    const result = await reader.read();
    if (result.done) break;
    text += decoder.decode(result.value, { stream: true });
    const newline = text.search(/\r?\n/);
    if (newline >= 0) {
      void drain(reader);
      return text.slice(0, newline);
    }
  }
  reader.releaseLock();
  return text;
}

function workerCommand(
  options: DevPrepareOptions,
  intent: "validate" | "serve",
): Deno.Command {
  const entry = fileURLToPath(new URL("../main.ts", import.meta.url));
  const frameworkRoot = fileURLToPath(new URL("../../", import.meta.url));
  const denoRuntime = /^deno(?:\.exe)?$/i.test(basename(Deno.execPath()));
  const runtimeArgs = denoRuntime
    ? [
      "run",
      "--no-prompt",
      "--cached-only",
      `--allow-read=${options.projectRoot},${frameworkRoot}`,
      `--allow-write=${options.projectRoot}`,
      "--allow-net",
      "--allow-env=SLEEPY_HOLLOW_MODE,SLEEPY_HOLLOW_INTERNAL_DEV_WORKER",
      "--unstable-kv",
      entry,
    ]
    : [];
  return new Deno.Command(Deno.execPath(), {
    args: [
      ...runtimeArgs,
      WORKER,
      intent,
      options.projectRoot,
      options.hostname,
      String(options.port),
    ],
    cwd: options.projectRoot,
    clearEnv: false,
    env: {
      SLEEPY_HOLLOW_INTERNAL_DEV_WORKER: "1",
      SLEEPY_HOLLOW_MODE: "development",
    },
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  });
}

function workerFailure(value: string, fallback: string): DevCommandError {
  try {
    const parsed = JSON.parse(value.trim()) as WorkerReady;
    if (Array.isArray(parsed.diagnostics) && parsed.diagnostics.length > 0) {
      return new DevCommandError(parsed.diagnostics);
    }
  } catch {
    // The bounded generic diagnostic below avoids returning arbitrary child text.
  }
  return new DevCommandError([{
    code: "SH_DEV_WORKER_FAILED",
    severity: "error",
    summary: fallback,
    correction:
      "Inspect the project configuration and route sources, then retry.",
  }]);
}

async function validate(options: DevPrepareOptions): Promise<number> {
  const output = await workerCommand(options, "validate").output();
  if (!output.success) {
    throw workerFailure(
      new TextDecoder().decode(output.stderr),
      "Runtime validation failed",
    );
  }
  try {
    const ready = JSON.parse(
      new TextDecoder().decode(output.stdout).trim(),
    ) as WorkerReady;
    if (
      ready.ready === true && Number.isSafeInteger(ready.routeCount) &&
      ready.routeCount! >= 0
    ) {
      return ready.routeCount!;
    }
  } catch {
    // Report the stable failure below.
  }
  throw workerFailure("", "Runtime validation returned malformed evidence");
}

async function startWorker(
  options: DevPrepareOptions,
  expectedRoutes: number,
): Promise<ActiveDevRuntime> {
  const child = workerCommand(options, "serve").spawn();
  const stdout = readFirstLine(child.stdout);
  const stderr = readBounded(child.stderr);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timer = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error("worker timeout")),
      READY_TIMEOUT_MS,
    );
  });
  let ready: WorkerReady;
  try {
    const text = await Promise.race([stdout, timer]);
    if (timeout !== undefined) clearTimeout(timeout);
    ready = JSON.parse(text.trim()) as WorkerReady;
    if (ready.ready !== true || ready.routeCount !== expectedRoutes) {
      throw new Error("invalid ready event");
    }
  } catch {
    if (timeout !== undefined) clearTimeout(timeout);
    try {
      child.kill("SIGTERM");
    } catch {
      // The process may already have exited.
    }
    await child.status.catch(() => undefined);
    throw workerFailure(
      await stderr,
      "Runtime activation failed before binding",
    );
  }
  let stopped = false;
  return {
    url: `http://${options.hostname}:${options.port}/`,
    routeCount: expectedRoutes,
    async stop() {
      if (stopped) return;
      stopped = true;
      try {
        child.kill("SIGTERM");
      } catch {
        // Already-exited workers are still stopped.
      }
      await child.status;
    },
  };
}

class LocalWatcher implements DevWatcher {
  #watcher: Deno.FsWatcher;
  #closed = false;
  #pending = new Set<string>();
  #batches: (readonly string[])[] = [];
  #waiters: {
    readonly resolve: (value: IteratorResult<readonly string[]>) => void;
    readonly reject: (reason: unknown) => void;
  }[] = [];
  #timer: ReturnType<typeof setTimeout> | undefined;
  #failure: unknown;
  #done = false;

  constructor(root: string) {
    this.#watcher = Deno.watchFs(root, { recursive: true });
    void this.#collect();
  }

  async #collect(): Promise<void> {
    try {
      for await (const event of this.#watcher) {
        if (this.#closed) return;
        for (const path of event.paths) this.#pending.add(path);
        if (this.#timer !== undefined) clearTimeout(this.#timer);
        this.#timer = setTimeout(() => this.#flush(), 50);
      }
      this.#done = true;
      this.#finishWaiters();
    } catch (error) {
      if (this.#closed) return;
      this.#failure = error;
      for (const waiter of this.#waiters.splice(0)) waiter.reject(error);
    }
  }

  #flush(): void {
    this.#timer = undefined;
    if (this.#pending.size === 0 || this.#closed) return;
    const batch = Object.freeze([...this.#pending]);
    this.#pending.clear();
    const waiter = this.#waiters.shift();
    if (waiter) waiter.resolve({ value: batch, done: false });
    else this.#batches.push(batch);
  }

  #finishWaiters(): void {
    if (!this.#done || this.#batches.length > 0) return;
    for (const waiter of this.#waiters.splice(0)) {
      waiter.resolve({ value: undefined, done: true });
    }
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#done = true;
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#watcher.close();
    this.#finishWaiters();
  }

  [Symbol.asyncIterator](): AsyncIterator<readonly string[]> {
    return {
      next: () => {
        const batch = this.#batches.shift();
        if (batch) return Promise.resolve({ value: batch, done: false });
        if (this.#failure) return Promise.reject(this.#failure);
        if (this.#done) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise((resolve, reject) => {
          this.#waiters.push({ resolve, reject });
        });
      },
    };
  }
}

export function createLocalDevDependencies(): DevDependencies {
  const controller = new AbortController();
  const interrupt = () => controller.abort("interrupt");
  const termination = () => controller.abort("termination");
  Deno.addSignalListener("SIGINT", interrupt);
  Deno.addSignalListener("SIGTERM", termination);
  return {
    signal: controller.signal,
    async prepare(options): Promise<PreparedDevRuntime> {
      const routeCount = await validate(options);
      return {
        routeCount,
        activate: () => startWorker(options, routeCount),
      };
    },
    watch: ({ projectRoot }) => new LocalWatcher(projectRoot),
    dispose() {
      Deno.removeSignalListener("SIGINT", interrupt);
      Deno.removeSignalListener("SIGTERM", termination);
    },
  };
}

export { WORKER as DEV_WORKER_ARGUMENT };
