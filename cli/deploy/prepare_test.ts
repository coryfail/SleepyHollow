import assert from "assert/strict";
import { createHash } from "crypto";
import { join } from "path";

import { platform } from "#platform";
import { runCli } from "../main.ts";
import { DeploymentPreparationError, prepareFlyDeployment } from "./mod.ts";

async function temporary<T>(run: (root: string) => Promise<T>): Promise<T> {
  const root = await platform.makeTempDir({ prefix: "sleepy-hollow-deploy-" });
  try {
    return await run(root);
  } finally {
    await platform.remove(root, { recursive: true });
  }
}

async function project(root: string, packageManager?: string): Promise<void> {
  await platform.writeTextFile(join(root, "package.json"), JSON.stringify({
    name: "notes",
    type: "module",
    ...(packageManager ? { packageManager } : {}),
    scripts: { start: "node server.js" },
  }, null, 2) + "\n");
  await platform.writeTextFile(join(root, "server.js"), "process.stdout.write('ready');\n");
}

function sqlite(root: string, options: { readonly app?: string; readonly region?: string; readonly force?: boolean } = {}) {
  return prepareFlyDeployment({
    projectRoot: root,
    target: { kind: "fly", app: options.app ?? "notes" },
    database: "sqlite",
    region: options.region ?? "iad",
    force: options.force,
  });
}

test("AC-F022-001 · preparation accepts only a Fly target and explicit supported database profile", async () => {
  await temporary(async (root) => {
    await project(root);
    await assert.rejects(
      () => prepareFlyDeployment({
        projectRoot: root,
        target: { kind: "fly", app: "notes" },
        database: "sqlite",
      }),
      DeploymentPreparationError,
    );
    await assert.rejects(
      () => prepareFlyDeployment({
        projectRoot: root,
        target: { kind: "fly", app: "notes" },
        database: "mysql" as "sqlite",
        region: "iad",
      }),
      DeploymentPreparationError,
    );
  });
});

test("AC-F022-001 AC-F022-007 · the CLI rejects legacy deploy execution and returns a versioned preparation result", async () => {
  await temporary(async (root) => {
    await project(root);
    const stdout: string[] = [];
    const stderr: string[] = [];
    const legacy = await runCli(["deploy", "--confirm", "obsolete"], {
      cwd: root,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    });
    assert.equal(legacy, 2);
    assert.equal(await readAbsent(join(root, "fly.toml")), true);
    const code = await runCli([
      "deploy", "prepare", "--target", "fly:notes", "--database", "sqlite", "--region", "iad", "--json",
    ], {
      cwd: root,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    });
    assert.equal(code, 0);
    const result = JSON.parse(stdout.at(-1)!);
    assert.equal(result.schema, "sleepy-hollow-deploy-prepare-result/v1");
    assert.deepEqual(result.commands, [
      "fly apps create notes",
      "fly volumes create data --app notes --region iad",
      "fly deploy --app notes",
    ]);
    const human = await runCli([
      "deploy", "prepare", "--target", "fly:notes", "--database", "sqlite", "--region", "iad",
    ], {
      cwd: root,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    });
    assert.equal(human, 0);
    assert.match(stdout.at(-1)!, /fly volumes create data --app notes --region iad/);
  });
});

async function readAbsent(path: string): Promise<boolean> {
  try {
    await platform.readTextFile(path);
    return false;
  } catch (error) {
    if (platform.isNotFound(error)) return true;
    throw error;
  }
}

test("AC-F022-002 · SQLite preparation writes a managed volume configuration", async () => {
  await temporary(async (root) => {
    await project(root);
    const result = await sqlite(root);
    assert.equal(result.database, "sqlite");
    assert.deepEqual(result.storage, { volume: "data", mountPath: "/data", machines: 1 });
    const configuration = await platform.readTextFile(join(root, "fly.toml"));
    assert.match(configuration, /app = "notes"/);
    assert.match(configuration, /destination = "\/data"/);
    assert.match(configuration, /DATABASE_URL = "file:\/data\/sleepy-hollow\.db"/);
    assert.match(configuration, /\[\[http_service\.checks\]\]/);
  });
});

test("AC-F022-003 · PostgreSQL preparation does not generate a volume or a secret value", async () => {
  await temporary(async (root) => {
    await project(root);
    const result = await prepareFlyDeployment({
      projectRoot: root,
      target: { kind: "fly", app: "notes" },
      database: "postgres",
    });
    assert.equal(result.storage, undefined);
    assert.deepEqual(result.environmentKeys, ["DATABASE_URL"]);
    const configuration = await platform.readTextFile(join(root, "fly.toml"));
    assert.doesNotMatch(configuration, /\[mounts\]/);
    assert.doesNotMatch(configuration, /DATABASE_URL\s*=/);
    assert.ok(result.commands.some((command) => command.includes("fly secrets set DATABASE_URL=")));
  });
});

test("AC-F022-004 · preparation returns local file evidence without a token or provider-execution surface", async () => {
  await temporary(async (root) => {
    await project(root);
    const prior = process.env.FLY_API_TOKEN;
    process.env.FLY_API_TOKEN = "must-not-appear";
    try {
      const result = await sqlite(root);
      assert.doesNotMatch(JSON.stringify(result), /must-not-appear|FLY_API_TOKEN|flyctl/);
      assert.ok(result.commands.every((command) => command.startsWith("fly ")));
    } finally {
      if (prior === undefined) delete process.env.FLY_API_TOKEN;
      else process.env.FLY_API_TOKEN = prior;
    }
  });
});

test("AC-F022-005 · unrecognized deployment artifacts are never overwritten", async () => {
  await temporary(async (root) => {
    await project(root);
    const path = join(root, "fly.toml");
    await platform.writeTextFile(path, "app = \"user-owned\"\n");
    await assert.rejects(() => sqlite(root, { force: true }), DeploymentPreparationError);
    assert.equal(await platform.readTextFile(path), "app = \"user-owned\"\n");
  });
});

test("AC-F022-006 · repeat input is byte-identical and changed managed input needs force", async () => {
  await temporary(async (root) => {
    await project(root);
    const first = await sqlite(root);
    const firstDigest = createHash("sha256").update(await platform.readFile(join(root, "fly.toml"))).digest("hex");
    const second = await sqlite(root);
    const secondDigest = createHash("sha256").update(await platform.readFile(join(root, "fly.toml"))).digest("hex");
    assert.ok(first.artifacts.every((artifact) => artifact.status === "created"));
    assert.ok(second.artifacts.every((artifact) => artifact.status === "unchanged"));
    assert.equal(secondDigest, firstDigest);
    await assert.rejects(() => sqlite(root, { app: "changed" }), DeploymentPreparationError);
    const forced = await sqlite(root, { app: "changed", force: true });
    assert.ok(forced.artifacts.some((artifact) => artifact.status === "updated"));
  });
});

test("AC-F022-007 · result reports stable artifact digests and copyable operator commands", async () => {
  await temporary(async (root) => {
    await project(root, "bun@1.3.14");
    const result = await sqlite(root);
    assert.deepEqual(result.artifacts.map((artifact) => artifact.path), [".dockerignore", "Dockerfile", "fly.toml"]);
    assert.ok(result.artifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.digest)));
    assert.deepEqual(result.commands, [
      "fly apps create notes",
      "fly volumes create data --app notes --region iad",
      "fly deploy --app notes",
    ]);
    assert.match(await platform.readTextFile(join(root, "Dockerfile")), /oven\/bun/);
  });
});
