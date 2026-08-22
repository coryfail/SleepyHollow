import { platform } from "#platform";
import assert from "assert/strict";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

import { createProject } from "../create/mod.ts";
import { runCheckCommand } from "../check/mod.ts";
import { runTestCommand } from "../test/mod.ts";
import {
  createCheckInventoryLoader,
  createTestInventoryLoader,
  loadVerificationInventory,
  resolveProjectLocations,
} from "./mod.ts";

function digest(source: string): string {
  const governed = source.slice(0, source.indexOf("## Governance record"));
  const frontmatter = governed.match(/^---\n[\s\S]*?\n---\n/)?.[0];
  assert.ok(frontmatter);
  return createHash("sha256").update(
    frontmatter.replace(/^status:[^\n]*\n/m, "") +
      governed.slice(frontmatter.length),
  ).digest("hex");
}

function applicationRequirement(): string {
  const prefix = `---
schema: sgad-application/v0.2
id: cory-fail-api-application
title: Cory Fail API
status: approved
risk: standard
depends_on: []
owners:
  - application owner
---

# Application requirements

## Cross-cutting acceptance criteria

- AC-APP-001: The application returns bounded JSON responses.

`;
  return `${prefix}## Governance record

### Approval

- Status: approved.
- Approver: application-owner.
- Approved at: 2026-08-21T00:00:00Z.
- Approved criteria: AC-APP-001.
- Governed-content digest: \`sha256:${digest(`${prefix}## Governance record\n`)}\`.
- Decision source: regression fixture.

### Red-state evidence

- Status: credible red state captured.
- Base revision: fixture.
- Result: the mapped test failed for missing behavior before implementation.
`;
}

function endpointRequirement(): string {
  const prefix = `---
id: EP-MUSIC-RELEASES
path: /music/releases
status: approved
methods:
  - GET
depends_on:
  - cory-fail-api-application
service: api
---

# Music releases

## Purpose

Return music releases.

## GET

Returns the releases.

## Inputs

No input.

## Success responses

Returns 200.

## Errors

Uses RFC 9457 problem details.

## Security

Authentication: none. Authorization: none.

## Data access and indexes

No data access.

## Side effects

None.

## Abuse considerations

The response is bounded.

## Dependencies and assumptions

The application requirement supplies shared behavior.

## Acceptance criteria

- AC-EP-RELEASES-001: GET returns the approved release collection.

`;
  return `${prefix}## Governance record

### Approval

- Status: approved.
- Approver: endpoint-owner.
- Approved at: 2026-08-21T00:00:00Z.
- Approved criteria: AC-EP-RELEASES-001.
- Governed-content digest: \`sha256:${digest(`${prefix}## Governance record\n`)}\`.
- Decision source: regression fixture.

### Red-state evidence

- Status: credible red state captured.
- Base revision: fixture.
- Result: the mapped test failed for missing behavior before implementation.
`;
}

async function projectFixture(): Promise<string> {
  const parent = await platform.makeTempDir({ prefix: "sh-evidence-regression-" });
  await createProject({ name: "cory-fail-api", directory: parent });
  const root = `${parent}/cory-fail-api`;
  await platform.writeTextFile(
    `${root}/requirements/application.req.md`,
    applicationRequirement(),
  );
  await platform.mkdir(`${root}/api/music/releases`, { recursive: true });
  const routing = new URL("../../core/routing/mod.ts", import.meta.url).href;
  await platform.writeTextFile(
    `${root}/api/music/releases/route.ts`,
    `import { defineRoute } from ${JSON.stringify(routing)};

export default defineRoute({
  GET: {
    schemas: { responses: { 200: { contract: { type: "object" } } } },
    security: { authentication: { mode: "none" } },
    contract: { operationId: "getMusicReleases" },
    handler: () => Response.json({ releases: [] }),
  },
});
`,
  );
  await platform.writeTextFile(
    `${root}/api/music/releases/music-releases.req.md`,
    endpointRequirement(),
  );
  await platform.writeTextFile(
    `${root}/generated/capture.json`,
    JSON.stringify({
      schema: "sleepy-hollow-capture/v1",
      runner: "vitest",
      revision: "test-revision",
      requests: [{
        method: "GET",
        path: "/music/releases",
        readLocations: [],
        responseStatus: 200,
      }],
      dataOperations: [],
      uncapturedRoutes: [],
    }),
  );
  return root;
}

test("AC-F018-009 · configured application requirements and route owners enter verification evidence", async () => {
  const root = await projectFixture();
  const project = await resolveProjectLocations({ projectRoot: root });
  const evidence = await loadVerificationInventory(project, {
    projectRoot: root,
    revision: "test-revision",
  });
  assert.deepEqual(evidence.requirements.map((item) => item.id), [
    "cory-fail-api-application",
    "EP-MUSIC-RELEASES",
  ]);
  assert.equal(evidence.requirements[1]?.dependsOn?.[0], "cory-fail-api-application");
  assert.equal(evidence.routes[0]?.requirementId, "EP-MUSIC-RELEASES");
  assert.equal(evidence.routes[0]?.source, "api/music/releases/route.ts");
});

test("AC-F018-010 · hollow test discovers criterionTest registrations", async () => {
  const root = await projectFixture();
  const testing = new URL("../../core/testing/mod.ts", import.meta.url).href;
  await platform.mkdir(`${root}/tests`, { recursive: true });
  await platform.writeTextFile(
    `${root}/tests/music_releases_test.ts`,
    `import { criterionTest } from ${JSON.stringify(testing)};

criterionTest({
  id: "T-MUSIC-RELEASES-001",
  requirementId: "EP-MUSIC-RELEASES",
  criteria: ["AC-EP-RELEASES-001"],
  name: "returns releases",
  sourcePath: "tests/music_releases_test.ts",
  fn: async () => {},
}, { requirements: [{
  id: "EP-MUSIC-RELEASES",
  status: "approved",
  governedContentDigest: "fixture",
  criteria: [{ id: "AC-EP-RELEASES-001" }],
  approval: { valid: true, digest: "fixture", criteria: ["AC-EP-RELEASES-001"] },
}] });
`,
  );
  const inventory = await createTestInventoryLoader()({ projectRoot: root });
  assert.deepEqual(inventory.manifest.tests.map((item) => item.id), [
    "T-MUSIC-RELEASES-001",
  ]);
  assert.equal(inventory.manifest.tests[0]?.sourcePath, "tests/music_releases_test.ts");
});

test("AC-F018-012 · hollow test smoke persists evidence consumed by check", async () => {
  const root = await projectFixture();
  const testing = new URL("../../core/testing/mod.ts", import.meta.url).href;
  await platform.mkdir(`${root}/tests`, { recursive: true });
  await platform.writeTextFile(
    `${root}/tests/music_releases_test.ts`,
    `import { criterionTest } from ${JSON.stringify(testing)};

const requirements = [
  { id: "cory-fail-api-application", status: "approved", governedContentDigest: "fixture", criteria: [{ id: "AC-APP-001" }], approval: { valid: true, digest: "fixture", criteria: ["AC-APP-001"] } },
  { id: "EP-MUSIC-RELEASES", status: "approved", governedContentDigest: "fixture", criteria: [{ id: "AC-EP-RELEASES-001" }], approval: { valid: true, digest: "fixture", criteria: ["AC-EP-RELEASES-001"] } },
];

criterionTest({ id: "T-APP-001", requirementId: "cory-fail-api-application", criteria: ["AC-APP-001"], name: "application contract", sourcePath: "tests/music_releases_test.ts", fn: async () => {} }, { requirements });
criterionTest({ id: "T-MUSIC-RELEASES-001", requirementId: "EP-MUSIC-RELEASES", criteria: ["AC-EP-RELEASES-001"], name: "returns releases", sourcePath: "tests/music_releases_test.ts", fn: async () => {} }, { requirements });
`,
  );
  const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
  await platform.symlink(`${repositoryRoot}/node_modules`, `${root}/node_modules`);
  const stdout: string[] = [];
  const stderr: string[] = [];
  try {
    const code = await runTestCommand(
      ["--json"],
      { cwd: root, stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
      () => createTestInventoryLoader()({ projectRoot: root }),
    );
    assert.equal(code, 0, stderr.join("\n"));
    const result = JSON.parse(stdout[0] ?? "{}");
    assert.deepEqual(result.selectedTests, ["T-APP-001", "T-MUSIC-RELEASES-001"]);
    assert.equal(result.ok, true);
    const manifest = JSON.parse(await platform.readTextFile(`${root}/generated/test-manifest.json`));
    const persisted = JSON.parse(await platform.readTextFile(`${root}/generated/test-results.json`));
    assert.deepEqual(manifest.tests.map((item: { id: string }) => item.id), [
      "T-APP-001",
      "T-MUSIC-RELEASES-001",
    ]);
    assert.deepEqual(persisted.results.map((item: { testId: string }) => item.testId), [
      "T-APP-001",
      "T-MUSIC-RELEASES-001",
    ]);
    const checkOutput: string[] = [];
    const checkCode = await runCheckCommand(
      ["--json"],
      { cwd: root, stdout: (value) => checkOutput.push(value), stderr: () => undefined },
      (request) => createCheckInventoryLoader({ revision: "test-revision" })(request),
    );
    assert.equal(checkCode, 0, checkOutput[0]);
    assert.equal(JSON.parse(checkOutput[0] ?? "{}").ok, true);
  } finally {
    await platform.remove(root, { recursive: true });
  }
});

test("AC-F018-011 · hollow check loads persisted manifest and result evidence", async () => {
  const root = await projectFixture();
  const manifest = {
    schema: "sleepy-hollow-test-manifest/v1",
    tests: [{
      id: "T-MUSIC-RELEASES-001",
      requirementId: "EP-MUSIC-RELEASES",
      criteria: ["AC-EP-RELEASES-001"],
      name: "returns releases",
      registeredName: "AC-EP-RELEASES-001 · returns releases",
      sourcePath: "tests/music_releases_test.ts",
      sourceDigest: "fixture-test-digest",
    }],
  } as const;
  await platform.writeTextFile(
    `${root}/generated/test-manifest.json`,
    JSON.stringify(manifest),
  );
  await platform.writeTextFile(
    `${root}/generated/test-results.json`,
    JSON.stringify({
      schema: "sleepy-hollow-test-results/v1",
      results: [{ testId: "T-MUSIC-RELEASES-001", status: "passed" }],
    }),
  );
  const inventory = await createCheckInventoryLoader({ revision: "test-revision" })({
    projectRoot: root,
    scope: { kind: "full" },
  });
  assert.deepEqual(inventory.testManifest.tests.map((item) => item.id), [
    "T-MUSIC-RELEASES-001",
  ]);
  assert.deepEqual(inventory.testResults, [{
    testId: "T-MUSIC-RELEASES-001",
    status: "passed",
  }]);
});
