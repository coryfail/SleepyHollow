import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { runCli } from "../main.ts";
import { createProject, CreationError } from "./mod.ts";

async function temporary<T>(run: (path: string) => Promise<T>): Promise<T> {
  const path = await Deno.makeTempDir({ prefix: "sleepy-hollow-create-" });
  try {
    return await run(path);
  } finally {
    await Deno.remove(path, { recursive: true });
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

Deno.test("AC-F001-001 · valid creation writes one deterministic project", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "hollow-app", directory });
    assert.equal(result.ok, true);
    assert.equal(await exists(result.projectPath), true);
    assert.deepEqual(result.createdFiles, [...result.createdFiles].sort());
  }));

Deno.test("AC-F001-002 · a new project passes its documented verifier", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "verified-app", directory });
    const command = new Deno.Command(Deno.execPath(), {
      cwd: result.projectPath,
      args: ["task", "verify"],
      stdout: "piped",
      stderr: "piped",
    });
    const output = await command.output();
    assert.equal(output.code, 0, new TextDecoder().decode(output.stderr));
  }));

Deno.test("AC-F001-003 · scaffold exposes typed config and canonical locations", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "structured-app", directory });
    for (
      const path of [
        "sleepyhollow.config.ts",
        "api/.gitkeep",
        "requirements/application.md",
        "generated/.gitkeep",
        "models/.gitkeep",
        "tests/scaffold_test.ts",
      ]
    ) assert.equal(await exists(join(result.projectPath, path)), true, path);
    assert.match(
      await Deno.readTextFile(
        join(result.projectPath, "sleepyhollow.config.ts"),
      ),
      /satisfies|defineProject/,
    );
  }));

Deno.test("AC-F001-004 · scaffold directs planning through the official skill", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "planned-app", directory });
    const readme = await Deno.readTextFile(
      join(result.projectPath, "README.md"),
    );
    assert.match(readme, /Sleepy Hollow skill/i);
    assert.match(readme, /requirements\/application\.md/);
    assert.doesNotMatch(readme, /generated endpoint/i);
  }));

Deno.test("AC-F001-005 · invalid names and unsafe destinations leave no project", () =>
  temporary(async (directory) => {
    await assert.rejects(
      () => createProject({ name: "../unsafe", directory }),
      CreationError,
    );
    assert.equal(await exists(join(directory, "unsafe")), false);
  }));

Deno.test("AC-F001-006 · existing user files are never overwritten", () =>
  temporary(async (directory) => {
    const destination = join(directory, "existing-app");
    await Deno.mkdir(destination);
    await Deno.writeTextFile(join(destination, "important.txt"), "preserve-me");
    await assert.rejects(
      () => createProject({ name: "existing-app", directory }),
      CreationError,
    );
    assert.equal(
      await Deno.readTextFile(join(destination, "important.txt")),
      "preserve-me",
    );
  }));

Deno.test("AC-F001-007 · JSON output has stable success and failure shapes", () =>
  temporary(async (directory) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = await runCli(["create", "json-app", "--json"], {
      cwd: directory,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    });
    assert.equal(code, 0);
    assert.equal(stderr.length, 0);
    assert.deepEqual(Object.keys(JSON.parse(stdout[0])).sort(), [
      "command",
      "createdFiles",
      "diagnostics",
      "nextActions",
      "ok",
      "projectPath",
      "version",
    ]);
  }));

Deno.test("AC-F001-008 · repeat creation preserves the first project", () =>
  temporary(async (directory) => {
    const first = await createProject({ name: "repeat-app", directory });
    const configPath = join(first.projectPath, "sleepyhollow.config.ts");
    const before = createHash("sha256").update(await Deno.readFile(configPath))
      .digest("hex");
    await assert.rejects(
      () => createProject({ name: "repeat-app", directory }),
      CreationError,
    );
    const after = createHash("sha256").update(await Deno.readFile(configPath))
      .digest("hex");
    assert.equal(after, before);
  }));

Deno.test("AC-F001-009 · compiled installation artifact reports its version standalone", () =>
  temporary(async (directory) => {
    const binary = join(directory, "hollow");
    const compiled = await new Deno.Command(Deno.execPath(), {
      args: [
        "compile",
        "--allow-read",
        "--allow-write",
        "--output",
        binary,
        new URL("../main.ts", import.meta.url).pathname,
      ],
      stdout: "piped",
      stderr: "piped",
    }).output();
    assert.equal(compiled.code, 0, new TextDecoder().decode(compiled.stderr));
    const version = await new Deno.Command(binary, {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    }).output();
    assert.equal(version.code, 0);
    assert.match(
      new TextDecoder().decode(version.stdout),
      /^hollow \d+\.\d+\.\d+\s*$/,
    );
  }));

Deno.test("AC-F001-010 · generated projects include capture-aware test setup", () =>
  temporary(async (directory) => {
    await createProject({ name: "captured", directory });
    const setup = await Deno.readTextFile(
      join(directory, "captured", "tests", "capture.ts"),
    );
    assert.match(setup, /session/);
    assert.match(setup, /sleepy-hollow-capture\/v1/);
    assert.match(setup, /generated\/capture\.json/);
    assert.match(setup, /export async function persist/);
    const config = JSON.parse(
      await Deno.readTextFile(join(directory, "captured", "deno.json")),
    );
    assert.ok(
      String(config.tasks?.test ?? "").length > 0,
      "generated project must declare a test task",
    );
  }));

Deno.test("AC-F001-011 · the generated test task produces a capture artifact", () =>
  temporary(async (directory) => {
    await createProject({ name: "captured", directory });
    const root = join(directory, "captured");
    const run = await new Deno.Command(Deno.execPath(), {
      args: ["task", "test"],
      cwd: root,
      stdout: "piped",
      stderr: "piped",
    }).output();
    assert.equal(run.code, 0, new TextDecoder().decode(run.stderr));
    const artifact = JSON.parse(
      await Deno.readTextFile(join(root, "generated", "capture.json")),
    );
    assert.equal(artifact.schema, "sleepy-hollow-capture/v1");
    assert.ok(typeof artifact.revision === "string");
  }));
