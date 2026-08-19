import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const atRoot = (...segments) => path.join(root, ...segments);

test("AC-F021-001: the repository is installable with npm and has no active Deno artifacts", () => {
  assert.equal(existsSync(atRoot("package.json")), true, "root package.json is required");
  assert.equal(existsSync(atRoot("package-lock.json")), true, "committed npm lockfile is required");
  assert.equal(existsSync(atRoot("deno.json")), false, "deno.json must be removed");
  assert.equal(existsSync(atRoot("deno.lock")), false, "deno.lock must be removed");
});

test("AC-F004-001: a framework-owned relational database module replaces Deno KV", () => {
  assert.equal(existsSync(atRoot("core", "database", "mod.ts")), true, "database export is required");
  const databaseSource = readFileSync(atRoot("core", "database", "mod.ts"), "utf8");
  assert.match(databaseSource, /drizzle-orm/, "database module must expose the ORM-backed contract");
  assert.equal(existsSync(atRoot("core", "kv")), false, "legacy Deno KV module must be removed");
});

test("AC-F013-001: deployment uses a portable OCI bundle rather than Deno Deploy", () => {
  assert.equal(existsSync(atRoot("Dockerfile")), true, "portable Dockerfile is required");
  const deploymentSource = readFileSync(atRoot("cli", "deploy", "adapter.ts"), "utf8");
  assert.doesNotMatch(deploymentSource, /Deno Deploy|deployctl|deno deploy/i);
  assert.match(deploymentSource, /flyctl/, "the first provider adapter must invoke flyctl");
});

test("AC-F020-003: the package includes a changelog explaining the platform change", () => {
  assert.equal(existsSync(atRoot("CHANGELOG.md")), true);
  const changelog = readFileSync(atRoot("CHANGELOG.md"), "utf8");
  assert.match(changelog, /Node and Bun platform migration/);
});
