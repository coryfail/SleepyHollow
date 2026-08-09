/**
 * The `hollow` command line, and its programmatic entry point.
 *
 * Run it without installing anything:
 *
 * ```bash
 * deno run -A jsr:@sleepy-hollow/framework/cli create my-api
 * ```
 *
 * JSR declares no binary, so the CLI is invoked through `deno run` and is not
 * reachable through `npx`. {@linkcode runCli} exposes the same command surface
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

export const VERSION = CLI_VERSION;

function revision(): () => string {
  return () => {
    try {
      return Deno.env.get("SLEEPY_HOLLOW_REVISION") ?? "workspace";
    } catch {
      return "workspace";
    }
  };
}

function projectName(): string {
  try {
    return Deno.env.get("SLEEPY_HOLLOW_PROJECT") ??
      Deno.cwd().split("/").filter(Boolean).pop() ?? "sleepy-hollow";
  } catch {
    return "sleepy-hollow";
  }
}

export function runCli(
  args: readonly string[],
  io: CliIo,
  dependencies: CliDependencies = {},
): Promise<number> {
  return runCommandSurface(args, io, createCliHandlers(dependencies));
}

if (import.meta.main) {
  if (
    Deno.args[0] === DEV_WORKER_ARGUMENT &&
    Deno.env.get("SLEEPY_HOLLOW_INTERNAL_DEV_WORKER") === "1"
  ) {
    Deno.exit(await runDevWorker(Deno.args.slice(1)));
  }
  const code = await runCli(Deno.args, {
    cwd: Deno.cwd(),
    stdout: console.log,
    stderr: console.error,
  }, {
    checkInventoryLoader: createCheckInventoryLoader({ revision: revision() }),
    testInventoryLoader: createTestInventoryLoader(),
    deployInventoryLoader: createDeployInventoryLoader({
      revision: revision(),
      target: { kind: "deno-deploy", project: projectName() },
    }),
  });
  Deno.exit(code);
}
