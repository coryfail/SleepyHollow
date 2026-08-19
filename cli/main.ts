#!/usr/bin/env node

import { platform } from "#platform";
import { pathToFileURL } from "url";
/**
 * The `hollow` command line, and its programmatic entry point.
 *
 * Run it without installing anything:
 *
 * ```bash
 * npx @sleepy-hollow/framework create my-api
 * ```
 *
 * The npm package declares the `hollow` binary. {@linkcode runCli} exposes the same command surface
 * to a caller that supplies its own I/O, which is how the CLI is tested.
 *
 * @module
 */
import { type CliDependencies, createCliHandlers } from "./adapters.ts";
import {
  createCheckInventoryLoader,
  createDeployInventoryLoader,
  createTestInventoryLoader,
} from "./evidence/mod.ts";
import { DEV_WORKER_ARGUMENT, runDevWorker } from "./dev/mod.ts";
import { CLI_VERSION, type CliIo, runCommandSurface } from "./dispatcher.ts";

/** Version of the CLI, reported by `hollow --version`. */
export const VERSION = CLI_VERSION;

function revision(): () => string {
  return () => {
    try {
      return platform.env.get("SLEEPY_HOLLOW_REVISION") ?? "workspace";
    } catch {
      return "workspace";
    }
  };
}

function projectName(): string {
  try {
    return platform.env.get("SLEEPY_HOLLOW_PROJECT") ??
      platform.cwd().split("/").filter(Boolean).pop() ?? "sleepy-hollow";
  } catch {
    return "sleepy-hollow";
  }
}

/**
 * Runs one CLI invocation against caller-supplied I/O.
 *
 * Nothing is read from the process here: the arguments, the working directory,
 * and the output streams all arrive as parameters, which is what makes the
 * command surface testable without spawning a subprocess.
 *
 * @param args The command and its flags, without the executable name.
 * @param io The working directory, and where output is written.
 * @param dependencies Seams to override, such as evidence loaders.
 * @returns The exit code the process should end with.
 */
export function runCli(
  args: readonly string[],
  io: CliIo,
  dependencies: CliDependencies = {},
): Promise<number> {
  return runCommandSurface(args, io, createCliHandlers(dependencies));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (
    platform.args[0] === DEV_WORKER_ARGUMENT &&
    platform.env.get("SLEEPY_HOLLOW_INTERNAL_DEV_WORKER") === "1"
  ) {
    platform.exit(await runDevWorker(platform.args.slice(1)));
  }
  const code = await runCli(platform.args, {
    cwd: platform.cwd(),
    stdout: console.log,
    stderr: console.error,
  }, {
    checkInventoryLoader: createCheckInventoryLoader({ revision: revision() }),
    testInventoryLoader: createTestInventoryLoader(),
    deployInventoryLoader: createDeployInventoryLoader({
      revision: revision(),
      target: { kind: "fly", project: projectName() },
    }),
  });
  platform.exit(code);
}
