export const CLI_COMMANDS = [
  "create",
  "dev",
  "test",
  "check",
  "generate",
  "deploy",
] as const;

export const CLI_VERSION = "0.1.0";

export type CliCommandName = typeof CLI_COMMANDS[number];

export interface CliIo {
  readonly cwd: string;
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}

export interface CliDiagnosticLocation {
  readonly requirements?: readonly string[];
  readonly criteria?: readonly string[];
  readonly routes?: readonly {
    readonly method: string;
    readonly path: string;
  }[];
  readonly operations?: readonly string[];
  readonly fields?: readonly string[];
  readonly indexes?: readonly string[];
  readonly files?: readonly string[];
  readonly configuration?: readonly string[];
}

export interface CliDiagnostic {
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly summary: string;
  readonly correction?: string;
  readonly location?: CliDiagnosticLocation;
}

export interface CliCommandResult {
  readonly ok: boolean;
  readonly command: CliCommandName;
  readonly schema?: string;
  readonly version?: string;
  readonly summary: string;
  readonly diagnostics: readonly CliDiagnostic[];
  readonly data?: Readonly<Record<string, unknown>>;
  readonly json?: Readonly<Record<string, unknown>>;
}

export interface CliPendingOperation {
  readonly intent: "preview" | "apply";
  readonly confirmationDigest: string;
  readonly providedConfirmation?: string;
  readonly apply: () => CliCommandResult | Promise<CliCommandResult>;
}

export interface CliCommandResponse {
  readonly result: CliCommandResult;
  readonly operation?: CliPendingOperation;
  readonly exitCode?: 0 | 1 | 2;
  readonly rendered?: boolean;
}

export interface CliCommandInvocation {
  readonly args: readonly string[];
  readonly cwd: string;
  readonly json: boolean;
  readonly io: CliIo;
}

export type CliCommandHandler = (
  invocation: CliCommandInvocation,
) => CliCommandResponse | Promise<CliCommandResponse>;

export type CliCommandHandlers = Readonly<
  Record<CliCommandName, CliCommandHandler>
>;

const commandMetadata: Readonly<
  Record<
    CliCommandName,
    { readonly description: string; readonly usage: string }
  >
> = {
  create: {
    description: "Create one deterministic Sleepy Hollow project.",
    usage: "hollow create <project-name> [--json]",
  },
  dev: {
    description: "Run the project locally in development mode.",
    usage: "hollow dev [--port <1-65535>] [--json]",
  },
  test: {
    description: "Run full or safely targeted project tests.",
    usage: "hollow test [options] [--json]",
  },
  check: {
    description: "Independently verify project evidence.",
    usage:
      "hollow check [--full | --requirement <id> | --route <METHOD> <path>] [--json]",
  },
  generate: {
    description: "Generate or check owned API contracts.",
    usage: "hollow generate [--check] [--json]",
  },
  deploy: {
    description: "Preview and deliver one verified Deno Deploy revision.",
    usage: "hollow deploy [--preview] [--confirm <digest>] [--json]",
  },
};

function topLevelHelp(): string {
  return [
    "Usage: hollow <command> [options]",
    "",
    "Commands:",
    ...CLI_COMMANDS.map((command) =>
      `  ${command.padEnd(10)}${commandMetadata[command].description}`
    ),
    "",
    "Use hollow help <command> for command-specific usage.",
  ].join("\n");
}

function commandHelp(command: CliCommandName): string {
  const metadata = commandMetadata[command];
  return [
    `Usage: ${metadata.usage}`,
    "",
    metadata.description,
  ].join("\n");
}

function commandName(value: string | undefined): value is CliCommandName {
  return CLI_COMMANDS.includes(value as CliCommandName);
}

function sortedUnique(values: readonly string[] | undefined) {
  return values ? [...new Set(values)].sort() : undefined;
}

function safeText(value: string): string {
  return value
    .replace(
      /((?:api[-_]?key|token|secret|password|credential)\s*[=:]\s*)\S+/gi,
      "$1<redacted>",
    )
    .replace(
      /(?:[A-Za-z]:\\|\/(?:Users|home|private|tmp)\/)[^\s,;]+/g,
      "<host-path>",
    )
    .slice(0, 500);
}

function safeFile(value: string): string {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)
    ? "<host-path>"
    : value;
}

function normalizeLocation(
  location: CliDiagnosticLocation | undefined,
): CliDiagnosticLocation | undefined {
  if (!location) return undefined;
  const routeMap = new Map<
    string,
    { readonly method: string; readonly path: string }
  >();
  for (const route of location.routes ?? []) {
    const method = route.method.toUpperCase();
    routeMap.set(`${method}\0${route.path}`, { method, path: route.path });
  }
  const routes = [...routeMap.values()].sort((left, right) =>
    left.method.localeCompare(right.method) ||
    left.path.localeCompare(right.path)
  );
  const normalized: CliDiagnosticLocation = {
    ...(location.requirements?.length
      ? { requirements: sortedUnique(location.requirements) }
      : {}),
    ...(location.criteria?.length
      ? { criteria: sortedUnique(location.criteria) }
      : {}),
    ...(routes.length ? { routes } : {}),
    ...(location.operations?.length
      ? { operations: sortedUnique(location.operations) }
      : {}),
    ...(location.fields?.length
      ? { fields: sortedUnique(location.fields) }
      : {}),
    ...(location.indexes?.length
      ? { indexes: sortedUnique(location.indexes) }
      : {}),
    ...(location.files?.length
      ? { files: sortedUnique(location.files.map(safeFile)) }
      : {}),
    ...(location.configuration?.length
      ? { configuration: sortedUnique(location.configuration) }
      : {}),
  };
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeResult(result: CliCommandResult): CliCommandResult {
  return {
    ...result,
    diagnostics: result.diagnostics.map((diagnostic) => {
      const location = normalizeLocation(diagnostic.location);
      const { location: _location, ...rest } = diagnostic;
      return {
        ...rest,
        summary: safeText(diagnostic.summary),
        ...(diagnostic.correction
          ? { correction: safeText(diagnostic.correction) }
          : {}),
        ...(location ? { location } : {}),
      };
    }),
  };
}

function renderLocation(location: CliDiagnosticLocation | undefined): string[] {
  if (!location) return [];
  const lines: string[] = [];
  const add = (label: string, values: readonly string[] | undefined) => {
    if (values?.length) lines.push(`  ${label}: ${values.join(", ")}`);
  };
  add("requirements", location.requirements);
  add("criteria", location.criteria);
  add(
    "routes",
    location.routes?.map((route) => `${route.method} ${route.path}`),
  );
  add("operations", location.operations);
  add("fields", location.fields);
  add("indexes", location.indexes);
  add("files", location.files);
  add("configuration", location.configuration);
  return lines;
}

function renderHuman(result: CliCommandResult): string {
  const lines = [result.summary];
  for (const diagnostic of result.diagnostics) {
    lines.push(
      `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.summary}`,
      ...renderLocation(diagnostic.location),
    );
    if (diagnostic.correction) {
      lines.push(`  correction: ${diagnostic.correction}`);
    }
  }
  return lines.join("\n");
}

function renderJson(result: CliCommandResult): string {
  if (result.json) {
    return JSON.stringify({
      ...result.json,
      ok: result.ok,
      command: result.command,
      ...(result.schema ? { schema: result.schema } : {}),
      ...(result.version ? { version: result.version } : {}),
      diagnostics: result.diagnostics,
    });
  }
  return JSON.stringify({
    ...result.data,
    ok: result.ok,
    command: result.command,
    ...(result.schema ? { schema: result.schema } : {}),
    ...(result.version ? { version: result.version } : {}),
    summary: result.summary,
    diagnostics: result.diagnostics,
  });
}

function emitResult(
  result: CliCommandResult,
  json: boolean,
  io: CliIo,
  exitCode?: 0 | 1 | 2,
): number {
  const normalized = normalizeResult(result);
  const output = json ? renderJson(normalized) : renderHuman(normalized);
  (normalized.ok ? io.stdout : io.stderr)(output);
  return exitCode ?? (normalized.ok ? 0 : 1);
}

function usageResult(
  code: "SH_CLI_COMMAND_UNKNOWN" | "SH_CLI_USAGE_INVALID",
  summary: string,
): string {
  return JSON.stringify({
    ok: false,
    command: null,
    schema: "sleepy-hollow-cli-result/v1",
    summary,
    diagnostics: [{
      code,
      severity: "error",
      summary,
      correction: "Run hollow --help and use one documented invocation.",
    }],
  });
}

function emitUsage(
  code: "SH_CLI_COMMAND_UNKNOWN" | "SH_CLI_USAGE_INVALID",
  summary: string,
  json: boolean,
  io: CliIo,
): 2 {
  io.stderr(
    json
      ? usageResult(code, summary)
      : `${code}: ${summary}\nRun hollow --help and use one documented invocation.`,
  );
  return 2;
}

function containsModelOption(args: readonly string[]): boolean {
  return args.some((argument) =>
    argument === "--model" || argument.startsWith("--model=")
  );
}

function safeToken(value: string | undefined): string {
  if (!value) return "<missing>";
  const bounded = [...value].slice(0, 80).map((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? "?" : character;
  }).join("");
  if (
    /^(?:--)?(?:api[-_]?key|token|secret|password|credential)=/i.test(bounded)
  ) {
    return `${bounded.slice(0, bounded.indexOf("="))}=<redacted>`;
  }
  return bounded;
}

function confirmationFailure(result: CliCommandResult): CliCommandResult {
  return {
    ...result,
    ok: false,
    summary: "Explicit confirmation is required before application.",
    diagnostics: [...result.diagnostics, {
      code: "SH_CLI_CONFIRMATION_REQUIRED",
      severity: "error",
      summary: "The supplied confirmation is missing, stale, or mismatched.",
      correction:
        "Review a fresh preview and provide its exact confirmation digest through the documented option.",
    }],
  };
}

export async function runCommandSurface(
  args: readonly string[],
  io: CliIo,
  handlers: CliCommandHandlers,
): Promise<number> {
  const json = args.includes("--json");
  if (containsModelOption(args)) {
    return emitUsage(
      "SH_CLI_USAGE_INVALID",
      "Model selection is not part of the Sleepy Hollow CLI.",
      json,
      io,
    );
  }
  if (
    args.length === 0 ||
    (args.length === 1 && (args[0] === "help" || args[0] === "--help"))
  ) {
    io.stdout(topLevelHelp());
    return 0;
  }
  if (args.length === 1 && (args[0] === "--version" || args[0] === "-V")) {
    io.stdout(`hollow ${CLI_VERSION}`);
    return 0;
  }
  if (args[0] === "help") {
    if (args.length === 2 && commandName(args[1])) {
      io.stdout(commandHelp(args[1]));
      return 0;
    }
    return emitUsage(
      "SH_CLI_USAGE_INVALID",
      "Help expects exactly one supported command.",
      json,
      io,
    );
  }
  if (!commandName(args[0])) {
    const invalid = args[0]?.startsWith("--") ? "option" : "command";
    return emitUsage(
      invalid === "option" ? "SH_CLI_USAGE_INVALID" : "SH_CLI_COMMAND_UNKNOWN",
      `Unknown ${invalid}: ${safeToken(args[0])}`,
      json,
      io,
    );
  }
  const selected = args[0];
  if (args.includes("--help")) {
    if (args.length === 2 && args[1] === "--help") {
      io.stdout(commandHelp(selected));
      return 0;
    }
    return emitUsage(
      "SH_CLI_USAGE_INVALID",
      `Invalid help invocation for ${selected}.`,
      json,
      io,
    );
  }
  try {
    const response = await handlers[selected]({
      args: args.slice(1),
      cwd: io.cwd,
      json,
      io,
    });
    if (response.result.command !== selected) {
      throw new TypeError("Command adapter returned a mismatched result");
    }
    if (!response.result.schema && !response.result.version) {
      throw new TypeError("Command adapter returned an unversioned result");
    }
    if (
      response.result.diagnostics.some((diagnostic) =>
        !/^SH_[A-Z0-9_]+$/.test(diagnostic.code)
      )
    ) {
      throw new TypeError(
        "Command adapter returned an unstable diagnostic code",
      );
    }
    if (!response.result.ok) {
      if (response.rendered) return response.exitCode ?? 1;
      return emitResult(response.result, json, io, response.exitCode);
    }
    if (response.rendered) return response.exitCode ?? 0;
    if (!response.operation || response.operation.intent === "preview") {
      return emitResult(response.result, json, io, response.exitCode);
    }
    if (
      !response.operation.providedConfirmation ||
      response.operation.providedConfirmation !==
        response.operation.confirmationDigest
    ) {
      return emitResult(confirmationFailure(response.result), json, io);
    }
    const applied = await response.operation.apply();
    if (applied.command !== selected) {
      throw new TypeError("Command application returned a mismatched result");
    }
    if (!applied.schema && !applied.version) {
      throw new TypeError("Command application returned an unversioned result");
    }
    return emitResult(applied, json, io);
  } catch {
    return emitResult(
      {
        ok: false,
        command: selected,
        schema: "sleepy-hollow-cli-result/v1",
        summary: `${selected} failed before producing a valid result.`,
        diagnostics: [{
          code: "SH_CLI_COMMAND_FAILED",
          severity: "error",
          summary:
            `The ${selected} command failed at its canonical adapter boundary.`,
          correction:
            "Inspect the project evidence and retry the documented command.",
        }],
      },
      json,
      io,
    );
  }
}
