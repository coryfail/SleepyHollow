import { type CliDependencies, createCliHandlers } from "./adapters.ts";
import { DEV_WORKER_ARGUMENT, runDevWorker } from "./dev/mod.ts";
import { CLI_VERSION, type CliIo, runCommandSurface } from "./dispatcher.ts";

export const VERSION = CLI_VERSION;

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
  });
  Deno.exit(code);
}
