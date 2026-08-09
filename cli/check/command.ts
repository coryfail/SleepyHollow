import { human, json } from "./render.ts";
import type {
  CheckCommandIo,
  RequestedCheckScope,
  VerificationInventory,
} from "./types.ts";
import { verify } from "./verifier.ts";

function parse(args: readonly string[]): {
  readonly json: boolean;
  readonly scope: RequestedCheckScope;
} {
  let json = false;
  let scope: RequestedCheckScope = { kind: "full" };
  let scopeSeen = false;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--full") {
      if (scopeSeen) {
        throw new TypeError("Check scope flags are mutually exclusive");
      }
      scopeSeen = true;
      scope = { kind: "full" };
      continue;
    }
    if (argument === "--requirement") {
      if (scopeSeen || !args[index + 1] || args[index + 1].startsWith("--")) {
        throw new TypeError("--requirement needs one exclusive requirement ID");
      }
      scopeSeen = true;
      scope = { kind: "requirement", requirementId: args[++index] };
      continue;
    }
    if (argument === "--route") {
      if (
        scopeSeen || !args[index + 1] || !args[index + 2] ||
        args[index + 1].startsWith("--") || args[index + 2].startsWith("--")
      ) {
        throw new TypeError(
          "--route needs one exclusive METHOD and absolute path",
        );
      }
      scopeSeen = true;
      scope = {
        kind: "route",
        method: args[++index].toUpperCase(),
        path: args[++index],
      };
      continue;
    }
    throw new TypeError(`Unknown check argument: ${argument}`);
  }
  if (
    scope.kind === "requirement" &&
    !/^[A-Za-z][A-Za-z0-9._-]*$/.test(scope.requirementId)
  ) {
    throw new TypeError("Requirement scope uses an unsafe identifier");
  }
  if (
    scope.kind === "route" &&
    (!/^[A-Z]+$/.test(scope.method) || !scope.path.startsWith("/") ||
      scope.path.includes(".."))
  ) {
    throw new TypeError("Route scope uses an unsafe method or path");
  }
  return { json, scope };
}

function safeMessage(error: unknown): string {
  return error instanceof Error
    ? error.message.slice(0, 500)
    : "Verification evidence could not be collected";
}

export async function runCheckCommand(
  args: readonly string[],
  io: CheckCommandIo,
  load: (options: {
    readonly projectRoot: string;
    readonly scope: RequestedCheckScope;
  }) => VerificationInventory | Promise<VerificationInventory>,
): Promise<0 | 1 | 2> {
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(args);
  } catch (error) {
    const message = safeMessage(error);
    io.stderr(
      args.includes("--json")
        ? JSON.stringify({
          ok: false,
          command: "check",
          schema: "sleepy-hollow-check-result/v1",
          diagnostics: [{
            code: "SH_CHECK_USAGE_INVALID",
            severity: "error",
            summary: message,
            correction:
              "Use hollow check [--full | --requirement <id> | --route <METHOD> <path>] [--json].",
          }],
        })
        : `SH_CHECK_USAGE_INVALID: ${message}`,
    );
    return 2;
  }
  try {
    const inventory = await load({ projectRoot: io.cwd, scope: parsed.scope });
    const result = verify({ ...inventory, requestedScope: parsed.scope });
    io.stdout(parsed.json ? json(result) : human(result));
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = safeMessage(error);
    io.stderr(
      parsed.json
        ? JSON.stringify({
          ok: false,
          command: "check",
          schema: "sleepy-hollow-check-result/v1",
          diagnostics: [{
            code: "SH_CHECK_EVIDENCE_LOAD_FAILED",
            severity: "error",
            summary: message,
            correction:
              "Correct the project evidence or bounded runner failure and retry.",
          }],
        })
        : `SH_CHECK_EVIDENCE_LOAD_FAILED: ${message}`,
    );
    return 1;
  }
}
