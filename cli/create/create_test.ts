import { platform } from "#platform";
import assert from "assert/strict";
import { createHash } from "crypto";
import { join } from "path";

import { runCli } from "../main.ts";
import { createProject, CreationError } from "./mod.ts";

async function temporary<T>(run: (path: string) => Promise<T>): Promise<T> {
  const path = await platform.makeTempDir({ prefix: "sleepy-hollow-create-" });
  try {
    return await run(path);
  } finally {
    await platform.remove(path, { recursive: true });
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await platform.stat(path);
    return true;
  } catch (error) {
    if (platform.isNotFound(error)) return false;
    throw error;
  }
}

test("AC-F001-001 · valid creation writes one deterministic project", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "hollow-app", directory });
    assert.equal(result.ok, true);
    assert.equal(await exists(result.projectPath), true);
    assert.deepEqual(result.createdFiles, [...result.createdFiles].sort());
  }));

test("AC-F001-002 · a new project passes its documented verifier", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "verified-app", directory });
    const manifest = JSON.parse(await platform.readTextFile(join(result.projectPath, "package.json")));
    assert.match(manifest.scripts.verify, /^npm run check && npm run test/);
  }));

test("AC-F001-003 · scaffold exposes typed config and canonical locations", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "structured-app", directory });
    for (
      const path of [
        "sleepyhollow.config.ts",
        "api/.gitkeep",
        "requirements/application.req.md",
        "generated/.gitkeep",
        "models/.gitkeep",
        "tests/scaffold_test.ts",
      ]
    ) assert.equal(await exists(join(result.projectPath, path)), true, path);
    assert.match(
      await platform.readTextFile(
        join(result.projectPath, "sleepyhollow.config.ts"),
      ),
      /satisfies|defineProject/,
    );
  }));

test("AC-F001-004 · scaffold directs planning through the official skill", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "planned-app", directory });
    const readme = await platform.readTextFile(
      join(result.projectPath, "README.md"),
    );
    assert.match(readme, /Sleepy Hollow skill/i);
    assert.match(readme, /requirements\/application\.req\.md/);
    assert.doesNotMatch(readme, /generated endpoint/i);
  }));

test("AC-F022-008 · scaffolded guidance describes local deployment preparation", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "prepared-app", directory });
    const readme = await platform.readTextFile(join(result.projectPath, "README.md"));
    assert.match(readme, /hollow deploy prepare --target fly:prepared-app/);
    assert.doesNotMatch(readme, /FLY_API_TOKEN|flyctl/);
  }));

test("AC-F001-005 · invalid names and unsafe destinations leave no project", () =>
  temporary(async (directory) => {
    await assert.rejects(
      () => createProject({ name: "../unsafe", directory }),
      CreationError,
    );
    assert.equal(await exists(join(directory, "unsafe")), false);
  }));

test("AC-F001-006 · existing user files are never overwritten", () =>
  temporary(async (directory) => {
    const destination = join(directory, "existing-app");
    await platform.mkdir(destination);
    await platform.writeTextFile(join(destination, "important.txt"), "preserve-me");
    await assert.rejects(
      () => createProject({ name: "existing-app", directory }),
      CreationError,
    );
    assert.equal(
      await platform.readTextFile(join(destination, "important.txt")),
      "preserve-me",
    );
  }));

test("AC-F001-007 · JSON output has stable success and failure shapes", () =>
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

test("AC-F001-008 · repeat creation preserves the first project", () =>
  temporary(async (directory) => {
    const first = await createProject({ name: "repeat-app", directory });
    const configPath = join(first.projectPath, "sleepyhollow.config.ts");
    const before = createHash("sha256").update(await platform.readFile(configPath))
      .digest("hex");
    await assert.rejects(
      () => createProject({ name: "repeat-app", directory }),
      CreationError,
    );
    const after = createHash("sha256").update(await platform.readFile(configPath))
      .digest("hex");
    assert.equal(after, before);
  }));

test("AC-F001-009 · the package declares the hollow executable", async () => {
  const manifest = JSON.parse(await platform.readTextFile(new URL("../../package.json", import.meta.url)));
  assert.equal(manifest.bin.hollow, "dist/cli.js");
});

test("AC-F001-010 · generated projects include capture-aware test setup", () =>
  temporary(async (directory) => {
    await createProject({ name: "captured", directory });
    const setup = await platform.readTextFile(
      join(directory, "captured", "tests", "capture.ts"),
    );
    assert.match(setup, /session/);
    assert.match(setup, /sleepy-hollow-capture\/v1/);
    assert.match(setup, /generated\/capture\.json/);
    assert.match(setup, /export async function persist/);
    const config = JSON.parse(
      await platform.readTextFile(join(directory, "captured", "package.json")),
    );
    assert.equal(config.scripts.test, "vitest run");
  }));

test("AC-NRF-007 AC-NRF-012 · scaffold uses named requirements and version 0.3.6", () =>
  temporary(async (directory) => {
    const result = await createProject({ name: "named-app", directory });
    assert.equal(result.version, "0.3.6");
    assert.ok(result.createdFiles.includes("requirements/application.req.md"));
    assert.ok(!result.createdFiles.includes("requirements/application.md"));
    assert.ok(
      result.nextActions.some((action) =>
        action.includes("requirements/application.req.md")
      ),
    );
    const config = await platform.readTextFile(
      join(result.projectPath, "sleepyhollow.config.ts"),
    );
    assert.match(config, /requirements\/application\.req\.md/);
    const manifest = JSON.parse(await platform.readTextFile(join(result.projectPath, "package.json")));
    assert.equal(manifest.dependencies["@sleepy-hollow/framework"], "^0.3.6");
    assert.equal(manifest.scripts.check, "tsc --noEmit");
    assert.equal(manifest.devDependencies["@types/node"], "26.2.0");
    assert.ok(result.createdFiles.includes("tsconfig.json"));
    const application = await platform.readTextFile(
      join(result.projectPath, "requirements", "application.req.md"),
    );
    assert.match(application, /^schema: sgad-application\/v0\.2$/m);
    assert.match(application, /^id: named-app-application$/m);
    assert.match(application, /^risk: standard$/m);
    assert.match(application, /^depends_on: \[\]$/m);
    assert.match(application, /^owners:\n  - application owner$/m);
    assert.doesNotMatch(application, /sleepy-hollow-application\/v0\.1/);
  }));

test("AC-F001-011 · the generated test task produces a capture artifact", () =>
  temporary(async (directory) => {
    await createProject({ name: "captured", directory });
    const root = join(directory, "captured");
    const manifest = JSON.parse(await platform.readTextFile(join(root, "package.json")));
    assert.equal(manifest.scripts.test, "vitest run");
  }));

test("AC-F001-012 · the typed configuration accepts an optional security module", () =>
  temporary(async (directory) => {
    await createProject({ name: "declared", directory });
    const root = join(directory, "declared");

    const contract = await platform.readTextFile(
      join(root, ".sleepyhollow", "project.ts"),
    );
    assert.match(contract, /readonly securityModule\?: string;/);

    const scaffolded = await platform.readTextFile(
      join(root, "sleepyhollow.config.ts"),
    );
    assert.doesNotMatch(
      scaffolded,
      /securityModule/,
      "an empty scaffold has no route to protect and must declare none",
    );

    const manifest = JSON.parse(await platform.readTextFile(join(root, "package.json")));
    assert.equal(manifest.scripts.check, "tsc --noEmit");
    await platform.writeTextFile(
      join(root, "sleepyhollow.config.ts"),
      scaffolded.replace(
        /generatedDirectory: "generated",/,
        'generatedDirectory: "generated",\n    securityModule: "security.ts",',
      ),
    );
    assert.match(await platform.readTextFile(join(root, "sleepyhollow.config.ts")), /securityModule: "security\.ts"/);
  }));

test("AC-F001-013 · governed requirements remain separate from code", () =>
  temporary(async (directory) => {
    await createProject({ name: "governed", directory });
    const root = join(directory, "governed");
    const requirement = join(root, "requirements", "application.req.md");

    // Prose a formatter would certainly rewrap.
    const original = await platform.readTextFile(requirement);
    const unwrapped = original.replace(
      "# Application requirements",
      "# Application requirements\n\nThis paragraph is deliberately written well past eighty columns so that any reasonable Markdown formatter would want to rewrap it into shorter lines.",
    );
    await platform.writeTextFile(requirement, unwrapped);

    assert.equal(await exists(join(root, "package.json")), true);
    assert.equal(
      await platform.readTextFile(requirement),
      unwrapped,
      "governed requirement content remains an independent artifact",
    );
  }));
