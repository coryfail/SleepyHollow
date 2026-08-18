import { isAbsolute, relative, resolve, sep } from "node:path";

import type {
  DenoTestInvocation,
  DenoTestInvocationOptions,
  DenoTestRunnerOptions,
  RawTestEvent,
  TestCommandInventory,
  TestCommandPlan,
  TestRunnerPermissions,
  TestRunnerResult,
} from "./types.ts";

const MAX_OUTPUT = 1024 * 1024;
const MAX_STREAM_OUTPUT = MAX_OUTPUT / 2;
const MAX_TIMEOUT = 10 * 60 * 1000;
const program = /^[A-Za-z0-9._-]+$/;
const environmentName = /^[A-Za-z_][A-Za-z0-9_]*$/;
const host = /^(?:\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+)(?::[0-9]{1,5})?$/;

function portable(path: string): string {
  return path.split(sep).join("/");
}

function projectPath(root: string, path: string): string {
  const absolute = resolve(root, path);
  const local = portable(relative(root, absolute));
  if (
    isAbsolute(path) || !local || local === ".." || local.startsWith("../")
  ) {
    throw new TypeError(`Test path escapes the project root: ${path}`);
  }
  return local;
}

function permissionArgs(
  root: string,
  permissions: TestRunnerPermissions,
): string[] {
  const args: string[] = [];
  if (permissions.read?.length) {
    args.push(
      `--allow-read=${
        [...new Set(permissions.read.map((path) => projectPath(root, path)))]
          .sort().join(",")
      }`,
    );
  }
  if (permissions.write?.length) {
    const writes = [
      ...new Set(permissions.write.map((path) => projectPath(root, path))),
    ]
      .sort();
    if (
      writes.some((path) =>
        path === ".git" || path.startsWith(".git/") ||
        path === ".github" || path.startsWith(".github/") ||
        path === "generated" || path.startsWith("generated/") ||
        path === "deno.json" || path === "deno.lock" ||
        path.endsWith(".req.md")
      )
    ) {
      throw new TypeError("Test write permission includes governed output");
    }
    args.push(`--allow-write=${writes.join(",")}`);
  }
  if (permissions.run?.length) {
    if (permissions.run.some((value) => !program.test(value))) {
      throw new TypeError("Test run permissions must name bounded programs");
    }
    args.push(`--allow-run=${[...new Set(permissions.run)].sort().join(",")}`);
  }
  const environment = [
    ...new Set([
      "SLEEPY_HOLLOW_MODE",
      ...(permissions.env ?? []),
    ]),
  ].sort();
  if (
    environment.some((value) =>
      !environmentName.test(value) ||
      (/secret|token|password|credential|api_?key/i.test(value) &&
        value !== "SLEEPY_HOLLOW_MODE")
    )
  ) {
    throw new TypeError("Test environment permissions include an unsafe key");
  }
  args.push(`--allow-env=${environment.join(",")}`);
  if (permissions.net?.length) {
    if (permissions.net.some((value) => !host.test(value))) {
      throw new TypeError("Test network permissions must name exact hosts");
    }
    args.push(`--allow-net=${[...new Set(permissions.net)].sort().join(",")}`);
  }
  if (permissions.unstableKv) args.push("--unstable-kv");
  return args;
}

export function invocation(
  plan: TestCommandPlan,
  options: DenoTestInvocationOptions,
): DenoTestInvocation {
  const root = resolve(options.projectRoot);
  const files = [...new Set(plan.files.map((path) => projectPath(root, path)))]
    .sort();
  if (files.length === 0) {
    throw new TypeError(
      "A native test run requires at least one exact source file",
    );
  }
  const args = [
    "test",
    "--cached-only",
    "--frozen",
    "--no-prompt",
    "--reporter=tap",
    ...permissionArgs(root, options.permissions ?? {}),
    ...(plan.filter
      ? [`--filter=/${plan.filter.replaceAll("/", "\\/")}/`]
      : []),
    ...files,
  ];
  return Object.freeze({
    command: options.denoExecutable ?? Deno.execPath(),
    cwd: root,
    args: Object.freeze(args),
    env: Object.freeze({ SLEEPY_HOLLOW_MODE: "test" }),
  });
}

async function readLimited(stream: ReadableStream<Uint8Array>): Promise<{
  readonly text: string;
  readonly truncated: boolean;
}> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let kept = 0;
  let truncated = false;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    if (kept >= MAX_STREAM_OUTPUT) {
      truncated = true;
      continue;
    }
    const available = Math.min(item.value.length, MAX_STREAM_OUTPUT - kept);
    chunks.push(item.value.slice(0, available));
    kept += available;
    if (available < item.value.length) truncated = true;
  }
  const joined = new Uint8Array(kept);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  return { text: new TextDecoder().decode(joined), truncated };
}

function parseTap(
  source: string,
  inventory: TestCommandInventory,
  failureEvidence: string,
): { readonly valid: boolean; readonly events: readonly RawTestEvent[] } {
  const lines = source.split(/\r?\n/);
  const validHeader = lines.some((line) => /^TAP version \d+$/.test(line));
  const validPlan = lines.some((line) => /^1\.\.\d+$/.test(line));
  const validStructure = lines.every((line) =>
    line === "" || /^\s/.test(line) || /^#/.test(line) ||
    /^TAP version \d+$/.test(line) || /^1\.\.\d+$/.test(line) ||
    /^(?:ok|not ok) \d+ - /.test(line)
  );
  const byName = new Map(
    inventory.manifest.tests.map((
      test,
    ) => [test.registeredName, test.sourcePath]),
  );
  const events: RawTestEvent[] = [];
  for (const line of lines) {
    const matched = line.match(/^(ok|not ok) \d+ - (.*?)(?: # (SKIP).*)?$/i);
    if (!matched) continue;
    const name = matched[2];
    events.push({
      file: byName.get(name) ?? "<runner>",
      name,
      status: matched[3]?.toUpperCase() === "SKIP"
        ? "skipped"
        : matched[1] === "ok"
        ? "passed"
        : "failed",
      ...(matched[1] === "not ok" && failureEvidence
        ? { evidence: failureEvidence }
        : {}),
    });
  }
  return { valid: validHeader && validPlan && validStructure, events };
}

export async function runNative(
  plan: TestCommandPlan,
  inventory: TestCommandInventory,
  options: DenoTestRunnerOptions,
): Promise<TestRunnerResult> {
  const timeoutMs = options.timeoutMs ?? MAX_TIMEOUT;
  if (
    !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 ||
    timeoutMs > MAX_TIMEOUT
  ) {
    throw new TypeError(
      "Test timeout must be from 1 through 600000 milliseconds",
    );
  }
  const command = invocation(plan, options);
  const started = performance.now();
  const child = new Deno.Command(command.command, {
    cwd: command.cwd,
    args: [...command.args],
    env: { ...command.env },
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  let timedOut = false;
  let cancelled = false;
  let forceTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const stop = () => {
    cancelled = true;
    try {
      child.kill("SIGTERM");
    } catch {
      // The process may have completed at the cancellation boundary.
    }
    forceTimer = globalThis.setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // The process may have completed during the termination grace period.
      }
    }, 1000);
  };
  options.signal?.addEventListener("abort", stop, { once: true });
  if (options.signal?.aborted) stop();
  const timer = globalThis.setTimeout(() => {
    if (cancelled) return;
    timedOut = true;
    try {
      child.kill("SIGTERM");
    } catch {
      // The process may have completed at the timeout boundary.
    }
    forceTimer = globalThis.setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // The process may have completed during the termination grace period.
      }
    }, 1000);
  }, timeoutMs);
  const stdout = readLimited(child.stdout);
  const stderr = readLimited(child.stderr);
  const status = await child.status;
  globalThis.clearTimeout(timer);
  if (forceTimer !== undefined) globalThis.clearTimeout(forceTimer);
  options.signal?.removeEventListener("abort", stop);
  const [out, error] = await Promise.all([stdout, stderr]);
  const evidence = timedOut
    ? "native test runner timed out"
    : cancelled
    ? "native test runner cancelled"
    : error.text.trim();
  const parsed = parseTap(out.text, inventory, evidence || out.text);
  const failed = !status.success || timedOut || cancelled || out.truncated ||
    error.truncated || !parsed.valid;
  return Object.freeze({
    status: failed ? "failed" : "passed",
    durationMs: Math.max(0, Math.round(performance.now() - started)),
    events: Object.freeze(parsed.events),
    ...(evidence ? { evidence } : {}),
  });
}
