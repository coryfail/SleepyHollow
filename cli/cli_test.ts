import assert from "node:assert/strict";

import {
  CLI_COMMANDS,
  type CliCommandHandler,
  type CliCommandHandlers,
  type CliCommandName,
  type CliCommandResponse,
  type CliCommandResult,
  type CliDiagnostic,
  runCommandSurface,
} from "./dispatcher.ts";

interface Capture {
  readonly stdout: string[];
  readonly stderr: string[];
  readonly io: {
    readonly cwd: string;
    readonly stdout: (value: string) => void;
    readonly stderr: (value: string) => void;
  };
}

function capture(): Capture {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    io: {
      cwd: "/project",
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    },
  };
}

function result(
  command: CliCommandName,
  options: {
    readonly ok?: boolean;
    readonly summary?: string;
    readonly diagnostics?: readonly CliDiagnostic[];
  } = {},
): CliCommandResult {
  return {
    ok: options.ok ?? true,
    command,
    schema: `sleepy-hollow-${command}-result/v1`,
    summary: options.summary ?? `${command} complete`,
    diagnostics: options.diagnostics ?? [],
  };
}

function handlers(
  overrides: Partial<Record<CliCommandName, CliCommandHandler>> = {},
): CliCommandHandlers {
  return Object.fromEntries(CLI_COMMANDS.map((command) => [
    command,
    overrides[command] ?? (() => ({ result: result(command) })),
  ])) as unknown as CliCommandHandlers;
}

async function invoke(
  args: readonly string[],
  commandHandlers = handlers(),
): Promise<Capture & { readonly code: number }> {
  const output = capture();
  const code = await runCommandSurface(args, output.io, commandHandlers);
  return { ...output, code };
}

Deno.test("AC-F011-001 · help exposes exactly the fixed command surface", async () => {
  let calls = 0;
  const commandHandlers = handlers(
    Object.fromEntries(CLI_COMMANDS.map((name) => [
      name,
      () => {
        calls++;
        return { result: result(name) };
      },
    ])) as Partial<Record<CliCommandName, CliCommandHandler>>,
  );
  const top = await invoke([], commandHandlers);
  assert.equal(top.code, 0);
  let position = -1;
  for (const command of CLI_COMMANDS) {
    const next = top.stdout[0].indexOf(command, position + 1);
    assert.ok(next > position, command);
    position = next;
  }
  assert.doesNotMatch(top.stdout[0], /\b(agent|model)\b/i);
  const helpFirst = await invoke(["help", "check"], commandHandlers);
  const helpLast = await invoke(["check", "--help"], commandHandlers);
  assert.equal(helpFirst.code, 0);
  assert.deepEqual(helpLast.stdout, helpFirst.stdout);
  assert.match(helpFirst.stdout[0], /^Usage: hollow check /);
  assert.equal(calls, 0);
});

Deno.test("AC-F011-002 · exit status distinguishes success, failure, and usage", async () => {
  const commandHandlers = handlers({
    create: () => ({ result: result("create") }),
    check: () => ({
      result: result("check", {
        ok: false,
        diagnostics: [{
          code: "SH_CHECK_FAILED",
          severity: "error",
          summary: "Required verification failed",
        }],
      }),
    }),
    generate: () => {
      throw new Error("bounded fixture failure");
    },
  });
  assert.equal((await invoke(["create", "app"], commandHandlers)).code, 0);
  assert.equal((await invoke(["check"], commandHandlers)).code, 1);
  assert.equal((await invoke(["unknown"], commandHandlers)).code, 2);
  const thrown = await invoke(["generate"], commandHandlers);
  assert.equal(thrown.code, 1);
  assert.match(thrown.stderr[0], /SH_CLI_COMMAND_FAILED/);
  assert.doesNotMatch(thrown.stderr[0], /\bat\s+.*:\d+/);
});

Deno.test("AC-F011-003 · every command supports a versioned JSON result", async () => {
  for (const command of CLI_COMMANDS) {
    const output = await invoke([command, "--json"]);
    assert.equal(output.code, 0, command);
    assert.equal(output.stderr.length, 0, command);
    const parsed = JSON.parse(output.stdout[0]);
    assert.equal(parsed.ok, true, command);
    assert.equal(parsed.command, command);
    assert.match(parsed.schema ?? parsed.version, /(?:\/v\d+|\d+\.\d+\.\d+)$/);
    assert.deepEqual(parsed.diagnostics, []);
  }
  const invalid = await invoke(["unknown", "--json"]);
  const parsed = JSON.parse(invalid.stderr[0]);
  assert.equal(parsed.schema, "sleepy-hollow-cli-result/v1");
  assert.equal(parsed.diagnostics[0].code, "SH_CLI_COMMAND_UNKNOWN");
});

Deno.test("AC-F011-004 · human and JSON render the same normalized evidence", async () => {
  const diagnostic: CliDiagnostic = {
    code: "SH_ROUTE_UNCOVERED",
    severity: "warning",
    summary: "Route lacks criterion evidence",
    correction: "Map the route to an approved criterion.",
    location: {
      criteria: ["AC-APP-002"],
      routes: [{ method: "GET", path: "/bookmarks/:id" }],
    },
  };
  const commandHandlers = handlers({
    check: () => ({
      result: result("check", { diagnostics: [diagnostic] }),
    }),
  });
  const human = await invoke(["check"], commandHandlers);
  const json = await invoke(["check", "--json"], commandHandlers);
  const parsed = JSON.parse(json.stdout[0]);
  assert.match(human.stdout[0], /SH_ROUTE_UNCOVERED/);
  assert.match(human.stdout[0], /AC-APP-002/);
  assert.match(human.stdout[0], /GET \/bookmarks\/:id/);
  assert.deepEqual(parsed.diagnostics, [diagnostic]);
});

Deno.test("AC-F011-005 · diagnostics retain every sorted affected object", async () => {
  const commandHandlers = handlers({
    check: () => ({
      result: result("check", {
        ok: false,
        diagnostics: [{
          code: "SH_CHECK_CONTEXT",
          severity: "error",
          summary: "Several governed objects are affected",
          correction: "Correct every named object.",
          location: {
            requirements: ["REQ-B", "REQ-A", "REQ-A"],
            criteria: ["AC-B", "AC-A"],
            routes: [
              { method: "POST", path: "/z" },
              { method: "GET", path: "/a" },
              { method: "GET", path: "/a" },
            ],
            operations: ["updateZ", "getA"],
            fields: ["body.z", "body.a"],
            indexes: ["by_z", "by_a"],
            files: ["api/z/route.ts", "api/a/route.ts"],
            configuration: ["Z_KEY", "A_KEY"],
          },
        }],
      }),
    }),
  });
  const output = await invoke(["check", "--json"], commandHandlers);
  const location = JSON.parse(output.stderr[0]).diagnostics[0].location;
  assert.deepEqual(location.requirements, ["REQ-A", "REQ-B"]);
  assert.deepEqual(location.criteria, ["AC-A", "AC-B"]);
  assert.deepEqual(location.routes, [
    { method: "GET", path: "/a" },
    { method: "POST", path: "/z" },
  ]);
  assert.deepEqual(location.operations, ["getA", "updateZ"]);
  assert.deepEqual(location.fields, ["body.a", "body.z"]);
  assert.deepEqual(location.indexes, ["by_a", "by_z"]);
  assert.deepEqual(location.files, ["api/a/route.ts", "api/z/route.ts"]);
  assert.deepEqual(location.configuration, ["A_KEY", "Z_KEY"]);
});

Deno.test("AC-F011-006 · invalid usage cannot reach a command effect", async () => {
  let effects = 0;
  const commandHandlers = handlers(
    Object.fromEntries(CLI_COMMANDS.map((name) => [
      name,
      () => {
        effects++;
        return { result: result(name) };
      },
    ])) as Partial<Record<CliCommandName, CliCommandHandler>>,
  );
  for (const args of [["unknown"], ["--bogus"], ["help", "check", "extra"]]) {
    const output = await invoke(args, commandHandlers);
    assert.equal(output.code, 2);
    assert.match(output.stderr[0], /SH_CLI_(?:COMMAND_UNKNOWN|USAGE_INVALID)/);
  }
  assert.equal(effects, 0);
});

Deno.test("AC-F011-007 · destructive application requires the exact preview digest", async () => {
  let applied = 0;
  const deploy: CliCommandHandler = ({ args }): CliCommandResponse => {
    const confirmationIndex = args.indexOf("--confirm");
    const providedConfirmation = confirmationIndex >= 0
      ? args[confirmationIndex + 1]
      : undefined;
    return {
      result: {
        ...result("deploy", { summary: "Deployment preview" }),
        data: { target: "project-a", confirmationDigest: "sha256:plan-a" },
      },
      operation: {
        intent: args.includes("--preview") ? "preview" : "apply",
        confirmationDigest: "sha256:plan-a",
        ...(providedConfirmation ? { providedConfirmation } : {}),
        apply: () => {
          applied++;
          return result("deploy", { summary: "Deployment applied" });
        },
      },
    };
  };
  const commandHandlers = handlers({ deploy });
  assert.equal(
    (await invoke(["deploy", "--preview"], commandHandlers)).code,
    0,
  );
  assert.equal(applied, 0);
  const missing = await invoke(["deploy"], commandHandlers);
  assert.equal(missing.code, 1);
  assert.match(missing.stderr[0], /SH_CLI_CONFIRMATION_REQUIRED/);
  const stale = await invoke(
    ["deploy", "--confirm", "sha256:stale"],
    commandHandlers,
  );
  assert.equal(stale.code, 1);
  assert.equal(applied, 0);
  const matched = await invoke(
    ["deploy", "--confirm", "sha256:plan-a"],
    commandHandlers,
  );
  assert.equal(matched.code, 0);
  assert.equal(applied, 1);
});

Deno.test("AC-F011-008 · dispatch invokes exactly one canonical adapter", async () => {
  const calls = Object.fromEntries(
    CLI_COMMANDS.map((name) => [name, 0]),
  ) as Record<CliCommandName, number>;
  const commandHandlers = handlers(
    Object.fromEntries(CLI_COMMANDS.map((name) => [
      name,
      () => {
        calls[name]++;
        return { result: result(name) };
      },
    ])) as Partial<Record<CliCommandName, CliCommandHandler>>,
  );
  for (const command of CLI_COMMANDS) {
    const before = Object.values(calls).reduce(
      (total, count) => total + count,
      0,
    );
    assert.equal((await invoke([command], commandHandlers)).code, 0);
    assert.equal(calls[command], 1);
    assert.equal(
      Object.values(calls).reduce((total, count) => total + count, 0),
      before + 1,
    );
  }
});

Deno.test("AC-F011-009 · model and agent invocation stays outside the CLI", async () => {
  let calls = 0;
  const commandHandlers = handlers(
    Object.fromEntries(CLI_COMMANDS.map((name) => [
      name,
      () => {
        calls++;
        return { result: result(name) };
      },
    ])) as Partial<Record<CliCommandName, CliCommandHandler>>,
  );
  for (
    const args of [
      ["agent"],
      ["model"],
      ["create", "app", "--model", "gpt-example"],
      ["check", "--model=gpt-example"],
    ]
  ) {
    const output = await invoke(args, commandHandlers);
    assert.equal(output.code, 2);
    assert.doesNotMatch(output.stderr[0], /gpt-example/);
  }
  assert.equal(calls, 0);
});
