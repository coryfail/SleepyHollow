import { isAbsolute, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { discoverRoutes } from "../core/routing/mod.ts";
import { runCheckCommand, type VerificationInventory } from "./check/mod.ts";
import {
  createDenoDeployAdapter,
  type DeployAdapter,
  type DeployInventory,
  exitCodeForDeploy,
  renderHumanDeployResult,
  renderJsonDeployResult,
  resolveDeployToken,
  runDeployment,
} from "./deploy/mod.ts";
import { createProject, CreationError } from "./create/mod.ts";
import { runDevCommand } from "./dev/mod.ts";
import {
  generateContracts,
  GenerationError,
  inventoryFromRoutes,
  type JsonSchema,
} from "./generate/mod.ts";
import {
  runTestCommand,
  type TestInventoryLoader,
  type TestRunner,
} from "./test/mod.ts";
import {
  CLI_COMMANDS,
  CLI_VERSION,
  type CliCommandHandler,
  type CliCommandHandlers,
  type CliCommandName,
  type CliCommandResponse,
  type CliDiagnostic,
} from "./dispatcher.ts";

export interface CliDependencies {
  readonly checkInventoryLoader?: (options: {
    readonly projectRoot: string;
    readonly scope: VerificationInventory["requestedScope"];
  }) => VerificationInventory | Promise<VerificationInventory>;
  readonly testInventoryLoader?: TestInventoryLoader;
  readonly deployInventoryLoader?: (options: {
    readonly projectRoot: string;
  }) => DeployInventory | Promise<DeployInventory>;
  readonly deployAdapter?: DeployAdapter;
  readonly deployToken?: () => string;
  readonly testRunner?: TestRunner;
  readonly commands?: Partial<Record<CliCommandName, CliCommandHandler>>;
}

function usage(command: CliCommandName, summary: string): CliCommandResponse {
  const diagnostic: CliDiagnostic = {
    code: "SH_CLI_USAGE_INVALID",
    severity: "error",
    summary,
    correction:
      `Run hollow ${command} --help and use one documented invocation.`,
  };
  return {
    exitCode: 2,
    result: {
      ok: false,
      command,
      schema: "sleepy-hollow-cli-result/v1",
      summary,
      diagnostics: [diagnostic],
    },
  };
}

function creationDiagnostics(
  diagnostics: readonly {
    readonly code: string;
    readonly summary: string;
    readonly path?: string;
    readonly correction: string;
  }[],
  cwd: string,
): CliDiagnostic[] {
  return diagnostics.map((item) => ({
    code: item.code,
    severity: "error",
    summary: item.summary,
    correction: item.correction,
    ...(item.path
      ? {
        location: {
          files: [
            (isAbsolute(item.path) ? relative(cwd, item.path) : item.path)
              .split(sep).join("/"),
          ],
        },
      }
      : {}),
  }));
}

const create: CliCommandHandler = async ({ args, cwd }) => {
  const positional = args.filter((argument) => argument !== "--json");
  if (
    positional.length !== 1 ||
    args.some((argument) => argument.startsWith("--") && argument !== "--json")
  ) {
    return usage("create", "Expected hollow create <project-name> [--json].");
  }
  try {
    const created = await createProject({
      name: positional[0],
      directory: cwd,
    });
    const projectPath =
      relative(cwd, created.projectPath).split(sep).join("/") ||
      ".";
    return {
      result: {
        ok: true,
        command: "create",
        version: created.version,
        summary: `Created ${projectPath}\n\nNext:\n${
          created.nextActions.map((item) => `  ${item}`).join("\n")
        }`,
        diagnostics: [],
        json: { ...created, projectPath },
      },
    };
  } catch (error) {
    const diagnostics = error instanceof CreationError ? error.diagnostics : [{
      code: "SH_CREATE_FAILED",
      summary: "Project creation failed",
      correction: "Inspect the protected failure and retry safely.",
    }];
    const json = {
      ok: false,
      command: "create",
      version: CLI_VERSION,
      projectPath: null,
      createdFiles: [],
      nextActions: [],
      diagnostics,
    };
    return {
      result: {
        ok: false,
        command: "create",
        version: CLI_VERSION,
        summary: "Project creation failed.",
        diagnostics: creationDiagnostics(diagnostics, cwd),
        json,
      },
    };
  }
};

const dev: CliCommandHandler = async ({ args, cwd, io }) => {
  const code = await runDevCommand(args, {
    cwd,
    stdout: io.stdout,
    stderr: io.stderr,
  });
  return {
    rendered: true,
    exitCode: code as 0 | 1 | 2,
    result: {
      ok: code === 0,
      command: "dev",
      schema: "sleepy-hollow-dev-event/v1",
      summary: code === 0
        ? "Development lifecycle completed."
        : code === 2
        ? "Invalid development invocation."
        : "Development lifecycle failed.",
      diagnostics: [],
    },
  };
};

function generationDiagnostics(
  diagnostics: readonly {
    readonly code: string;
    readonly summary: string;
    readonly path?: string;
    readonly operationId?: string;
    readonly correction: string;
  }[],
): CliDiagnostic[] {
  return diagnostics.map((item) => ({
    code: item.code,
    severity: "error",
    summary: item.summary,
    correction: item.correction,
    ...(item.path || item.operationId
      ? {
        location: {
          ...(item.path ? { files: [item.path] } : {}),
          ...(item.operationId ? { operations: [item.operationId] } : {}),
        },
      }
      : {}),
  }));
}

const generate: CliCommandHandler = async ({ args, cwd }) => {
  if (
    args.some((argument) => argument !== "--json" && argument !== "--check") ||
    args.filter((argument) => argument === "--json").length > 1 ||
    args.filter((argument) => argument === "--check").length > 1
  ) {
    return usage(
      "generate",
      "Expected hollow generate [--check] [--json].",
    );
  }
  const check = args.includes("--check");
  try {
    const configPath = join(cwd, "sleepyhollow.config.ts");
    const imported = await import(
      `${pathToFileURL(configPath).href}?generate=${Date.now()}`
    );
    const config = imported.default as {
      readonly name?: string;
      readonly title?: string;
      readonly version?: string;
      readonly description?: string;
      readonly apiDirectory?: string;
      readonly securitySchemes?: Readonly<Record<string, JsonSchema>>;
    };
    const routes = await discoverRoutes(
      join(cwd, config.apiDirectory ?? "api"),
    );
    const generated = await generateContracts({
      inventory: inventoryFromRoutes(routes, {
        projectRoot: cwd,
        serviceId: config.name ?? "sleepy-hollow-service",
        title: config.title ?? config.name,
        version: config.version,
        description: config.description,
        securitySchemes: config.securitySchemes,
      }),
      projectRoot: cwd,
      check,
    });
    const stale = generated.artifacts.filter((item) => item.stale);
    const summary = check
      ? generated.ok
        ? `Generated contracts are current for ${generated.serviceId}`
        : `Generated contracts are stale:\n${
          stale.map((item) => `  ${item.path}`).join("\n")
        }`
      : `Generated ${generated.artifacts.length} contract artifacts for ${generated.serviceId}${
        generated.changes.length
          ? `\nReview ${generated.changes.length} contract change(s).`
          : ""
      }`;
    return {
      result: {
        ok: generated.ok,
        command: "generate",
        schema: generated.schema,
        summary,
        diagnostics: generationDiagnostics(generated.diagnostics),
        json: generated as unknown as Readonly<Record<string, unknown>>,
      },
    };
  } catch (error) {
    const diagnostics = error instanceof GenerationError
      ? error.diagnostics
      : [{
        code: "SH_GENERATE_FAILED",
        summary: "Contract generation failed",
        correction:
          "Inspect route, schema, configuration, and output diagnostics before retrying.",
      }];
    const json = {
      ok: false,
      command: "generate",
      schema: "sleepy-hollow-generate-result/v1",
      serviceId: null,
      inputDigest: null,
      artifacts: [],
      changes: [],
      diagnostics,
      wrote: false,
    };
    return {
      result: {
        ok: false,
        command: "generate",
        schema: "sleepy-hollow-generate-result/v1",
        summary: "Contract generation failed.",
        diagnostics: generationDiagnostics(diagnostics),
        json,
      },
    };
  }
};

function checkDiagnostic(item: Record<string, unknown>): CliDiagnostic {
  const location = (item.location ?? {}) as Record<string, unknown>;
  const route = typeof location.route === "string"
    ? location.route.match(/^([A-Z]+)\s+(.+)$/)
    : null;
  return {
    code: typeof item.code === "string" ? item.code : "SH_CHECK_FAILED",
    severity: item.severity === "warning" ? "warning" : "error",
    summary: item.code === "SH_CHECK_EVIDENCE_LOAD_FAILED"
      ? "Verification evidence could not be collected"
      : typeof item.summary === "string"
      ? item.summary
      : "Independent verification failed",
    correction: typeof item.correction === "string"
      ? item.correction
      : "Inspect the verification evidence and retry.",
    location: {
      ...(typeof location.requirementId === "string"
        ? { requirements: [location.requirementId] }
        : {}),
      ...(typeof location.criterionId === "string"
        ? { criteria: [location.criterionId] }
        : {}),
      ...(route ? { routes: [{ method: route[1], path: route[2] }] } : {}),
      ...(typeof location.operation === "string"
        ? { operations: [location.operation] }
        : {}),
      ...(typeof location.field === "string"
        ? { fields: [location.field] }
        : {}),
      ...(typeof location.path === "string" ? { files: [location.path] } : {}),
      ...(typeof location.configKey === "string"
        ? { configuration: [location.configKey] }
        : {}),
    },
  };
}

function checkHandler(
  loader: NonNullable<CliDependencies["checkInventoryLoader"]> | undefined,
): CliCommandHandler {
  return async ({ args, cwd }) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = await runCheckCommand(
      args.includes("--json") ? args : [...args, "--json"],
      {
        cwd,
        stdout: (value) => stdout.push(value),
        stderr: (value) => stderr.push(value),
      },
      loader ?? (() => {
        throw new Error("The project evidence loader is unavailable");
      }),
    );
    const parsed = JSON.parse(
      (code === 0 ? stdout[0] : stderr[0]) ?? "{}",
    ) as Record<string, unknown>;
    const projectRoot = typeof parsed.projectRoot === "string" &&
        isAbsolute(parsed.projectRoot)
      ? relative(cwd, parsed.projectRoot).split(sep).join("/") || "."
      : parsed.projectRoot;
    const diagnostics = Array.isArray(parsed.diagnostics)
      ? parsed.diagnostics.map((item) =>
        checkDiagnostic(item as Record<string, unknown>)
      )
      : [];
    return {
      exitCode: code,
      result: {
        ok: parsed.ok === true,
        command: "check",
        schema: typeof parsed.schema === "string"
          ? parsed.schema
          : "sleepy-hollow-check-result/v1",
        summary: parsed.ok === true
          ? "Independent verification passed."
          : code === 2
          ? "Invalid check invocation."
          : "Independent verification failed.",
        diagnostics,
        json: {
          ...parsed,
          ...(projectRoot === undefined ? {} : { projectRoot }),
        },
      },
    };
  };
}

function deployHandler(
  load: NonNullable<CliDependencies["deployInventoryLoader"]>,
  adapter: DeployAdapter | undefined,
  token: (() => string) | undefined,
): CliCommandHandler {
  return async ({ args, cwd }) => {
    const confirmed = args.includes("--confirm");
    try {
      const inventory = await load({ projectRoot: cwd });
      const result = await runDeployment(
        {
          inventory,
          token: (token ?? resolveDeployToken)(),
          confirmed,
          ...(confirmed
            ? { confirmationSource: "operator passed --confirm" }
            : {}),
        },
        adapter ?? createDenoDeployAdapter({}),
        () => new Date().toISOString(),
      );
      return {
        exitCode: exitCodeForDeploy(result),
        result: {
          ok: result.ok,
          command: "deploy" as const,
          schema: result.schema,
          summary: renderHumanDeployResult(result).split("\n")[0] ?? "",
          diagnostics: result.diagnostics.map((item) => ({
            code: item.code,
            severity: item.severity,
            summary: item.summary,
            correction: item.correction,
          })),
          json: JSON.parse(renderJsonDeployResult(result)) as Record<
            string,
            unknown
          >,
        },
      };
    } catch (error) {
      const summary = error instanceof Error
        ? error.message
        : "Deployment could not start.";
      return {
        exitCode: 1 as const,
        result: {
          ok: false,
          command: "deploy" as const,
          schema: "sleepy-hollow-deploy-result/v1",
          summary,
          diagnostics: [{
            code: "SH_DEPLOY_PRECONDITION_UNMET",
            severity: "error" as const,
            summary,
            correction:
              "Resolve the reported condition and rerun hollow deploy.",
          }],
        },
      };
    }
  };
}

function unavailable(command: CliCommandName): CliCommandHandler {
  return ({ args }) => {
    if (args.some((argument) => argument !== "--json")) {
      return usage(
        command,
        `${command} options are unavailable until its canonical feature is installed.`,
      );
    }
    return {
      result: {
        ok: false,
        command,
        schema: `sleepy-hollow-${command}-result/v1`,
        summary: `${command} is not available in this build.`,
        diagnostics: [{
          code: "SH_CLI_FEATURE_UNAVAILABLE",
          severity: "error",
          summary: `The canonical ${command} command API is not implemented.`,
          correction:
            "Install a build containing the governed canonical feature.",
        }],
      },
    };
  };
}

function testHandler(
  loader: TestInventoryLoader | undefined,
  runner: TestRunner | undefined,
): CliCommandHandler {
  return async ({ args, cwd }) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = await runTestCommand(
      args.includes("--json") ? args : [...args, "--json"],
      {
        cwd,
        stdout: (value) => stdout.push(value),
        stderr: (value) => stderr.push(value),
      },
      loader ?? (() => {
        throw new Error("The normalized test inventory loader is unavailable");
      }),
      runner,
    );
    const parsed = JSON.parse(
      (code === 0 ? stdout[0] : stderr[0]) ?? "{}",
    ) as Record<string, unknown>;
    const diagnostics = Array.isArray(parsed.diagnostics)
      ? parsed.diagnostics.map((value) => {
        const item = value as Record<string, unknown>;
        return {
          code: typeof item.code === "string"
            ? item.code
            : "SH_TEST_COMMAND_FAILED",
          severity: item.severity === "warning"
            ? "warning" as const
            : "error" as const,
          summary: typeof item.summary === "string"
            ? item.summary
            : "The test command failed",
          correction: typeof item.correction === "string"
            ? item.correction
            : "Inspect bounded test evidence and retry.",
          ...(typeof item.testId === "string" ? { testId: item.testId } : {}),
          ...(typeof item.file === "string" ||
              Array.isArray(item.criteria) ||
              typeof item.requirementId === "string"
            ? {
              location: {
                ...(typeof item.file === "string"
                  ? { files: [item.file] }
                  : {}),
                ...(Array.isArray(item.criteria)
                  ? {
                    criteria: item.criteria.filter((id): id is string =>
                      typeof id === "string"
                    ),
                  }
                  : {}),
                ...(typeof item.requirementId === "string"
                  ? { requirements: [item.requirementId] }
                  : {}),
              },
            }
            : {}),
        };
      })
      : [];
    return {
      exitCode: code,
      result: {
        ok: parsed.ok === true,
        command: "test",
        schema: typeof parsed.schema === "string"
          ? parsed.schema
          : "sleepy-hollow-test-result/v1",
        summary: parsed.ok === true
          ? "Test run passed."
          : code === 2
          ? "Invalid test invocation."
          : "Test run failed.",
        diagnostics,
        json: parsed,
      },
    };
  };
}

export function createCliHandlers(
  dependencies: CliDependencies = {},
): CliCommandHandlers {
  const defaults: CliCommandHandlers = {
    create,
    dev,
    test: testHandler(
      dependencies.testInventoryLoader,
      dependencies.testRunner,
    ),
    check: checkHandler(dependencies.checkInventoryLoader),
    generate,
    deploy: dependencies.deployInventoryLoader
      ? deployHandler(
        dependencies.deployInventoryLoader,
        dependencies.deployAdapter,
        dependencies.deployToken,
      )
      : unavailable("deploy"),
  };
  return Object.fromEntries(CLI_COMMANDS.map((command) => [
    command,
    dependencies.commands?.[command] ?? defaults[command],
  ])) as unknown as CliCommandHandlers;
}
