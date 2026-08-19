import { platform } from "#platform";
import assert from "assert/strict";

import { gateRelease } from "./mod.ts";
import type {
  PackageIdentity,
  RegistryTransport,
  ReleaseRequest,
} from "./types.ts";

const SEMVER = /^\d+\.\d+\.\d+$/;

async function manifest(): Promise<
  {
    name?: string;
    version?: string;
    exports?: Record<string, { readonly import?: string; readonly types?: string }>;
  }
> {
  return JSON.parse(
    await platform.readTextFile(new URL("../package.json", import.meta.url)),
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

/**
 * A registry that answers with the given versions. The seam keeps the suite
 * hermetic: no test reaches the npm registry, and the live query happens only when a
 * release is attempted.
 */
function listing(...versions: readonly string[]): RegistryTransport {
  return () => Promise.resolve({ ok: true, versions });
}

/** A registry that does not answer the question the gate asked. */
function unreachable(evidence: string): RegistryTransport {
  return () => Promise.resolve({ ok: false, evidence });
}

function request(overrides: Partial<ReleaseRequest> = {}): ReleaseRequest {
  return {
    identity: identity(),
    verificationPassed: true,
    verificationEvidence: ["all component suites passed"],
    registry: listing(),
    uncommittedPaths: [],
    ...overrides,
  };
}

test("AC-F020-001 · the declared version is checked against the registry listing", async () => {
  const declared = await manifest();
  assert.equal(typeof declared.name, "string");
  assert.ok(declared.name && declared.name.length > 0);
  assert.match(declared.version ?? "", SEMVER);

  // The gate must ask the registry about the declared package, and must ask
  // it rather than trust a caller-supplied set.
  const asked: string[] = [];
  const result = await gateRelease(request({
    identity: identity({ name: declared.name, version: declared.version }),
    registry: (name) => {
      asked.push(name);
      return Promise.resolve({ ok: true, versions: ["0.0.1"] });
    },
  }));
  assert.deepEqual(
    asked,
    [declared.name],
    "the gate must resolve published versions from the registry listing",
  );
  assert.equal(result.name, declared.name);
  assert.equal(result.version, declared.version);
  assert.deepEqual(result.registries, ["npm"]);
  assert.equal(result.ok, true);

  // The same declared version, now present in the listing, must be refused.
  const reused = await gateRelease(request({
    identity: identity({ name: declared.name, version: declared.version }),
    registry: listing(declared.version ?? ""),
  }));
  assert.equal(reused.ok, false);
  assert.ok(
    reused.diagnostics.some((item) =>
      item.code === "SH_RELEASE_VERSION_REUSED"
    ),
  );
});

test("AC-F020-002 · every declared export entry point resolves", async () => {
  const declared = await manifest();
  const entries = Object.entries(declared.exports ?? {});
  assert.ok(entries.length > 0);
  for (const [name, targets] of entries) {
    const target = targets.import;
    assert.equal(typeof target, "string", `${name} must have an ESM import target`);
    const url = new URL(`../${target.replace(/^\.\//, "")}`, import.meta.url);
    const stat = await platform.stat(url);
    assert.ok(stat.isFile, `${name} -> ${target} does not resolve`);
  }
});

test("AC-F020-003 · an internal module is not named in the export map", async () => {
  const declared = await manifest();
  const targets = Object.values(declared.exports ?? {}).flatMap((entry) => [entry.import, entry.types]);
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

test("AC-F020-004 · the release result declares the platform runtime target", async () => {
  assert.equal((await gateRelease(request())).runtime, "node-bun");
});

test("AC-F020-005 · documented installation resolves against the declared package", async () => {
  const declared = await manifest();
  const readme = await platform.readTextFile(
    new URL("../README.md", import.meta.url),
  );
  assert.ok(
    readme.includes(declared.name ?? "\u0000"),
    "installation documentation must name the declared package",
  );
  const specifiers = [...readme.matchAll(/(?:npm install(?: -g)?|bun add) (@[\w.-]+\/[\w.-]+)/g)]
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
      ...readme.matchAll(/(?:npm install(?: -g)?|bun add) @[\w.-]+\/[\w.-]+(\/[\w-]+)/g),
    ]
  ) {
    assert.ok(
      entries.includes(`.${sub[1]}`),
      `documented entry point ${sub[1]} is not in the export map`,
    );
  }
});

test("release gate · a clean verified release is permitted", async () => {
  const result = await gateRelease(request());
  assert.equal(result.ok, true);
  assert.deepEqual(result.diagnostics, []);
});

test("AC-F020-006 · a release from a failing tree is refused with evidence", async () => {
  const result = await gateRelease(request({
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

test("AC-F020-007 · reusing a published version is refused", async () => {
  const result = await gateRelease(request({
    registry: listing("0.0.9", "0.1.0"),
  }));
  assert.equal(result.ok, false);
  const diagnostic = result.diagnostics.find((item) =>
    item.code === "SH_RELEASE_VERSION_REUSED"
  );
  assert.ok(diagnostic);
  assert.ok(
    diagnostic.evidence.includes("0.1.0"),
    "the registry's listing is the evidence for refusal",
  );
});

test("AC-F020-009 · a release is refused when the registry cannot be read", async () => {
  const result = await gateRelease(request({
    registry: unreachable("GET https://registry.npmjs.org/... responded 503"),
  }));
  assert.equal(
    result.ok,
    false,
    "an unanswered question about the version is not permission to publish",
  );
  const diagnostic = result.diagnostics.find((item) =>
    item.code === "SH_RELEASE_REGISTRY_UNAVAILABLE"
  );
  assert.ok(diagnostic);
  assert.ok(
    diagnostic.evidence.some((item) => item.includes("503")),
    "the registry's response is reported as evidence",
  );
});

test("AC-F020-008 · a release from a dirty tree is refused", async () => {
  const result = await gateRelease(request({
    uncommittedPaths: ["cli/main.ts", "package.json"],
  }));
  assert.equal(result.ok, false);
  const diagnostic = result.diagnostics.find((item) =>
    item.code === "SH_RELEASE_TREE_DIRTY"
  );
  assert.ok(diagnostic);
  assert.ok(diagnostic.evidence.includes("cli/main.ts"));
});

test("release gate · the scaffolded framework pin matches the declared version", async () => {
  const declared = await manifest();
  const source = await platform.readTextFile(
    new URL("../cli/create/create.ts", import.meta.url),
  );
  const pinned = source.match(/FRAMEWORK_VERSION = "([^"]+)"/)?.[1];
  assert.equal(
    pinned,
    declared.version,
    "generated projects must pin the declared framework version",
  );
  assert.ok(
    source.includes(declared.name ?? " "),
    "generated projects must import the declared package name",
  );
});
