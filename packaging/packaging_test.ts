import assert from "node:assert/strict";

import { gateRelease } from "./mod.ts";
import type { PackageIdentity, ReleaseRequest } from "./types.ts";

const SEMVER = /^\d+\.\d+\.\d+$/;

async function manifest(): Promise<
  { name?: string; version?: string; exports?: Record<string, string> }
> {
  return JSON.parse(
    await Deno.readTextFile(new URL("../deno.json", import.meta.url)),
  );
}

function identity(overrides: Partial<PackageIdentity> = {}): PackageIdentity {
  return {
    name: "@sleepy-hollow/framework",
    version: "0.1.0",
    exports: { ".": "./mod.ts" },
    ...overrides,
  };
}

function request(overrides: Partial<ReleaseRequest> = {}): ReleaseRequest {
  return {
    identity: identity(),
    verificationPassed: true,
    verificationEvidence: ["all component suites passed"],
    publishedVersions: [],
    uncommittedPaths: [],
    ...overrides,
  };
}

Deno.test("AC-F020-001 · the repository declares one name and one semantic version", async () => {
  const declared = await manifest();
  assert.equal(typeof declared.name, "string");
  assert.ok(declared.name && declared.name.length > 0);
  assert.match(declared.version ?? "", SEMVER);
  const result = gateRelease(request({
    identity: identity({ name: declared.name, version: declared.version }),
  }));
  assert.equal(result.name, declared.name);
  assert.equal(result.version, declared.version);
  assert.deepEqual(result.registries, ["jsr", "npm"]);
});

Deno.test("AC-F020-002 · every declared export entry point resolves", async () => {
  const declared = await manifest();
  const entries = Object.entries(declared.exports ?? {});
  assert.ok(entries.length > 0);
  for (const [name, target] of entries) {
    const url = new URL(`../${target.replace(/^\.\//, "")}`, import.meta.url);
    const stat = await Deno.stat(url);
    assert.ok(stat.isFile, `${name} -> ${target} does not resolve`);
  }
});

Deno.test("AC-F020-003 · an internal module is not named in the export map", async () => {
  const declared = await manifest();
  const targets = Object.values(declared.exports ?? {});
  for (
    const internal of [
      "./cli/evidence/mod.ts",
      "./cli/check/verifier.ts",
      "./core/capture/session.ts",
    ]
  ) {
    assert.ok(
      !targets.includes(internal),
      `${internal} must not be public API`,
    );
  }
});

Deno.test("AC-F020-004 · the release result declares the Deno runtime target", () => {
  assert.equal(gateRelease(request()).runtime, "deno");
});

Deno.test("AC-F020-005 · documented installation resolves against the declared package", async () => {
  const declared = await manifest();
  const readme = await Deno.readTextFile(
    new URL("../README.md", import.meta.url),
  );
  assert.ok(
    readme.includes(declared.name ?? "\u0000"),
    "installation documentation must name the declared package",
  );
  const specifiers = [...readme.matchAll(/(?:jsr|npm):(@[\w.-]+\/[\w.-]+)/g)]
    .map((match) => match[1]);
  assert.ok(
    specifiers.length > 0,
    "documentation must show an install command",
  );
  for (const specifier of specifiers) {
    assert.equal(
      specifier,
      declared.name,
      `documented specifier ${specifier} does not match the declared package`,
    );
  }
  const entries = Object.keys(declared.exports ?? {});
  for (
    const sub of [
      ...readme.matchAll(/(?:jsr|npm):@[\w.-]+\/[\w.-]+(\/[\w-]+)/g),
    ]
  ) {
    assert.ok(
      entries.includes(`.${sub[1]}`),
      `documented entry point ${sub[1]} is not in the export map`,
    );
  }
});

Deno.test("release gate · a clean verified release is permitted", () => {
  const result = gateRelease(request());
  assert.equal(result.ok, true);
  assert.deepEqual(result.diagnostics, []);
});

Deno.test("AC-F020-006 · a release from a failing tree is refused with evidence", () => {
  const result = gateRelease(request({
    verificationPassed: false,
    verificationEvidence: ["verify:check failed with 1 failed test"],
  }));
  assert.equal(result.ok, false);
  const diagnostic = result.diagnostics.find((item) =>
    item.code === "SH_RELEASE_VERIFICATION_FAILED"
  );
  assert.ok(diagnostic);
  assert.ok(
    diagnostic.evidence.some((item) => item.includes("verify:check failed")),
  );
});

Deno.test("AC-F020-007 · reusing a published version is refused", () => {
  const result = gateRelease(request({ publishedVersions: ["0.1.0"] }));
  assert.equal(result.ok, false);
  assert.ok(
    result.diagnostics.some((item) =>
      item.code === "SH_RELEASE_VERSION_REUSED"
    ),
  );
});

Deno.test("AC-F020-008 · a release from a dirty tree is refused", () => {
  const result = gateRelease(request({
    uncommittedPaths: ["cli/main.ts", "deno.json"],
  }));
  assert.equal(result.ok, false);
  const diagnostic = result.diagnostics.find((item) =>
    item.code === "SH_RELEASE_TREE_DIRTY"
  );
  assert.ok(diagnostic);
  assert.ok(diagnostic.evidence.includes("cli/main.ts"));
});
