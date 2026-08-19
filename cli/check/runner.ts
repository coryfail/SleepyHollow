import { platform } from "#platform";
import { isAbsolute, relative, resolve, sep } from "path";

import type {
  NodeVerificationRunnerOptions,
  NodeVerificationRunnerResult,
} from "./types.ts";

const MAX_OUTPUT = 1024 * 1024;
const MAX_TIMEOUT = 10 * 60 * 1000;
const name = /^[A-Za-z_][A-Za-z0-9_]*$/;
const program = /^[A-Za-z0-9._-]+$/;
const host = /^(?:\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+)(?::[0-9]{1,5})?$/;

function portable(path: string): string {
  return path.split(sep).join("/");
}

function projectPath(root: string, path: string): string {
  const absolute = resolve(root, path);
  const local = portable(relative(root, absolute));
  if (isAbsolute(path) || !local || local === ".." || local.startsWith("../")) {
    throw new TypeError(`Verification path escapes the project root: ${path}`);
  }
  return local;
}

async function readLimited(stream: ReadableStream<Uint8Array>): Promise<{
  text: string;
  truncated: boolean;
}> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let kept = 0;
  let truncated = false;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    if (kept >= MAX_OUTPUT) {
      truncated = true;
      continue;
    }
    const available = Math.min(item.value.length, MAX_OUTPUT - kept);
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
  return {
    text: new TextDecoder().decode(joined),
    truncated,
  };
}

async function run(
  executable: string,
  cwd: string,
  args: readonly string[],
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<{ success: boolean; evidence: string; stdout: string }> {
  const child = new platform.Command(executable, {
    cwd,
    args: [...args],
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  let timedOut = false;
  let cancelled = false;
  const stop = () => {
    cancelled = true;
    try {
      child.kill("SIGTERM");
    } catch {
      // The child may have completed between cancellation and termination.
    }
  };
  signal?.addEventListener("abort", stop, { once: true });
  const timer = globalThis.setTimeout(() => {
    timedOut = true;
    try {
      child.kill("SIGTERM");
    } catch {
      // The child may have completed at the deadline.
    }
  }, timeoutMs);
  const stdout = readLimited(child.stdout);
  const stderr = readLimited(child.stderr);
  const status = await child.status;
  globalThis.clearTimeout(timer);
  signal?.removeEventListener("abort", stop);
  const [out, error] = await Promise.all([stdout, stderr]);
  const evidence = timedOut
    ? "runner timed out"
    : cancelled
    ? "runner cancelled"
    : [
      error.text.trim(),
      out.truncated || error.truncated ? "[output truncated]" : "",
    ]
      .filter(Boolean).join("\n");
  return {
    success: status.success && !timedOut && !cancelled && !out.truncated &&
      !error.truncated,
    evidence: evidence || `exit code ${status.code}`,
    stdout: out.text,
  };
}

export async function runNodeVerification(
  options: NodeVerificationRunnerOptions,
): Promise<NodeVerificationRunnerResult> {
  const root = resolve(options.projectRoot);
  const timeoutMs = options.timeoutMs ?? MAX_TIMEOUT;
  if (
    !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 ||
    timeoutMs > MAX_TIMEOUT
  ) {
    throw new TypeError(
      "Verification timeout must be from 1 through 600000 milliseconds",
    );
  }
  const typecheckFiles = [...options.typecheckFiles].map((path) =>
    projectPath(root, path)
  ).sort();
  const testFiles = [...options.testFiles].map((path) =>
    projectPath(root, path)
  ).sort();
  if (!typecheckFiles.length || !testFiles.length) {
    throw new TypeError(
      "Verification requires explicit typecheck and test files",
    );
  }
  const executable = options.nodeExecutable ?? platform.execPath();
  const typecheck = await run(
    executable,
    root,
    ["./node_modules/typescript/bin/tsc", "--noEmit", ...typecheckFiles],
    timeoutMs,
    options.signal,
  );
  const tests = await run(
    executable,
    root,
    ["./node_modules/vitest/vitest.mjs", "run", "--reporter=verbose", ...testFiles],
    timeoutMs,
    options.signal,
  );
  return {
    typecheck: {
      status: typecheck.success ? "passed" : "failed",
      evidence: typecheck.evidence,
    },
    testRunner: {
      status: tests.success ? "passed" : "failed",
      evidence: tests.evidence,
    },
    testOutput: tests.stdout,
  };
}
