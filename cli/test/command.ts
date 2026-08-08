import { failedWithoutRunner, normalizeRunnerResult } from "./result.ts";
import { runNative } from "./runner.ts";
import { plan } from "./scope.ts";
import { renderHuman, renderJson } from "./render.ts";
import type {
  RequestedTestScope,
  TestCommandIo,
  TestCommandResult,
  TestInventoryLoader,
  TestRunner,
} from "./types.ts";

function parse(args: readonly string[]): {
  readonly json: boolean;
  readonly scope: RequestedTestScope;
} {
  let json = false;
  let scope: RequestedTestScope = { kind: "full" };
  let scopeSeen = false;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--json") {
      if (json) throw new TypeError("--json may appear once");
      json = true;
      continue;
    }
    if (argument === "--full") {
      if (scopeSeen) {
        throw new TypeError("Test scope flags are mutually exclusive");
      }
      scopeSeen = true;
      scope = { kind: "full" };
      continue;
    }
    if (argument === "--requirement") {
      const id = args[index + 1];
      if (scopeSeen || !id || id.startsWith("--")) {
        throw new TypeError("--requirement needs one exclusive requirement ID");
      }
      if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(id)) {
        throw new TypeError("Requirement scope uses an unsafe identifier");
      }
      scopeSeen = true;
      scope = { kind: "requirement", requirementId: id };
      index++;
      continue;
    }
    if (argument === "--route") {
      const method = args[index + 1];
      const path = args[index + 2];
      if (
        scopeSeen || !method || !path || method.startsWith("--") ||
        path.startsWith("--")
      ) {
        throw new TypeError(
          "--route needs one exclusive METHOD and absolute path",
        );
      }
      const normalizedMethod = method.toUpperCase();
      if (
        !/^[A-Z]+$/.test(normalizedMethod) || !path.startsWith("/") ||
        path.includes("..") || path.includes("?") || path.includes("#")
      ) {
        throw new TypeError("Route scope uses an unsafe method or path");
      }
      scopeSeen = true;
      scope = { kind: "route", method: normalizedMethod, path };
      index += 2;
      continue;
    }
    throw new TypeError(`Unknown test argument: ${argument.slice(0, 80)}`);
  }
  return { json, scope };
}

function usage(
  summary: string,
  json: boolean,
  io: TestCommandIo,
): 2 {
  const result = {
    ok: false,
    command: "test",
    schema: "sleepy-hollow-test-result/v1",
    diagnostics: [{
      code: "SH_TEST_USAGE_INVALID",
      severity: "error",
      summary,
      correction:
        "Use hollow test [--full | --requirement <id> | --route <METHOD> <path>] [--json].",
    }],
  };
  io.stderr(
    json
      ? JSON.stringify(result)
      : `SH_TEST_USAGE_INVALID: ${summary}\n${
        result.diagnostics[0].correction
      }`,
  );
  return 2;
}

function loadFailure(scope: RequestedTestScope): TestCommandResult {
  return {
    schema: "sleepy-hollow-test-result/v1",
    ok: false,
    command: "test",
    requestedScope: scope,
    effectiveScope: "full",
    selectedRequirements: [],
    selectedTests: [],
    tests: [],
    criteria: [],
    diagnostics: [{
      code: "SH_TEST_INVENTORY_LOAD_FAILED",
      severity: "error",
      summary: "The normalized test inventory could not be loaded.",
      correction: "Correct supported repository evidence and retry.",
    }],
    summary: {
      passed: 0,
      failed: 0,
      skipped: 0,
      unmapped: 0,
      passingCriteria: 0,
      failingCriteria: 0,
      skippedCriteria: 0,
      unmappedCriteria: 0,
      durationMs: 0,
    },
    verificationStateChanged: false,
  };
}

function emit(
  result: TestCommandResult,
  json: boolean,
  io: TestCommandIo,
): 0 | 1 {
  (result.ok ? io.stdout : io.stderr)(
    json ? renderJson(result) : renderHuman(result),
  );
  return result.ok ? 0 : 1;
}

export async function execute(
  args: readonly string[],
  io: TestCommandIo,
  load: TestInventoryLoader,
  runner?: TestRunner,
): Promise<0 | 1 | 2> {
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(args);
  } catch (error) {
    return usage(
      error instanceof Error ? error.message : "Invalid test invocation",
      args.includes("--json"),
      io,
    );
  }
  let inventory;
  try {
    inventory = await load({ projectRoot: io.cwd, scope: parsed.scope });
  } catch {
    return emit(loadFailure(parsed.scope), parsed.json, io);
  }
  const capturePath = `${io.cwd}/generated/capture.json`;
  inventory = { ...inventory, captureArtifactPath: capturePath };
  const testPlan = plan(inventory, parsed.scope);
  if (testPlan.diagnostics.some((item) => item.severity === "error")) {
    return emit(failedWithoutRunner(testPlan, inventory), parsed.json, io);
  }
  let runnerResult;
  try {
    runnerResult = await (runner ?? ((selected, source) =>
      runNative(selected, source, {
        projectRoot: io.cwd,
        denoExecutable: source.denoExecutable,
        permissions: source.permissions,
        timeoutMs: source.timeoutMs,
      })))(testPlan, inventory);
  } catch {
    runnerResult = {
      status: "failed" as const,
      durationMs: 0,
      events: [],
      evidence: "Native test runner failed before producing bounded evidence",
    };
  }
  const normalized = normalizeRunnerResult(testPlan, inventory, runnerResult);
  let persisted = true;
  try {
    await Deno.stat(capturePath);
  } catch {
    persisted = false;
  }
  return emit(
    persisted ? normalized : {
      ...normalized,
      diagnostics: [
        ...normalized.diagnostics,
        {
          code: "SH_TEST_CAPTURE_NOT_PERSISTED",
          severity: "warning" as const,
          summary:
            "The test run completed but no capture artifact was persisted.",
          correction:
            "Enable Sleepy Hollow capture in the project test setup so verification has observed evidence.",
        },
      ],
    },
    parsed.json,
    io,
  );
}
