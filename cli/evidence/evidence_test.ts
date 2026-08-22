import { platform } from "#platform";
import assert from "assert/strict";
import { createHash } from "crypto";

import { runCheckCommand } from "../check/mod.ts";
import { runCli } from "../main.ts";
import { createProject } from "../create/mod.ts";
import {
  createCheckInventoryLoader,
  createTestInventoryLoader,
  EvidenceError,
  loadRequirementEvidence,
  loadVerificationInventory,
  resolveProjectLocations,
} from "./mod.ts";
import type { EvidenceDiagnostic } from "./types.ts";

async function scaffold(): Promise<string> {
  const root = await platform.makeTempDir({ prefix: "sh-evidence-" });
  await createProject({ name: "bookmarks", directory: root });
  return `${root}/bookmarks`;
}

function governedDigest(source: string): string {
  const marker = "## Governance record";
  const index = source.indexOf(`\n${marker}`);
  const selected = source.slice(0, index + 1);
  const withoutStatus = selected.replace(/^status:[^\n]*\n/m, "");
  return createHash("sha256").update(withoutStatus, "utf8").digest("hex");
}

function endpointRequirement(
  options: {
    readonly id: string;
    readonly status?: string;
    readonly criteria?: readonly string[];
    readonly approvalDigest?: string;
    readonly extraBody?: string;
  },
): string {
  const criteria = (options.criteria ?? ["AC-EP-001"]).map((id) =>
    `- ${id}: The endpoint rejects an invalid request with RFC 9457 details.`
  ).join("\n");
  const body = `---
id: ${options.id}
path: /bookmarks
status: ${options.status ?? "approved"}
methods:
  - POST
depends_on: []
service: api
---

# ${options.id}

## Purpose

Create a bookmark.

## Source application sections

- Proposed endpoints and methods

## POST

Create one bookmark.

## Inputs

A JSON body with a URL.

## Success responses

201 with the created bookmark.

## Errors

422 with RFC 9457 problem details.

## Security

Authentication: none. Authorization: none.

## Data access and indexes

Writes one bookmark keyed by identifier.

## Side effects

None beyond persistence.

## Abuse considerations

Bounded request body.

## Dependencies and assumptions

None.
${options.extraBody ?? ""}
## Acceptance criteria

${criteria}

`;
  const digest = options.approvalDigest ??
    governedDigest(`${body}## Governance record\n`);
  return `${body}## Governance record

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T00:00:00Z.
- Approved criteria: ${(options.criteria ?? ["AC-EP-001"]).join(", ")}.
- Governed-content digest: \`sha256:${digest}\`.
- Decision source: fixture.
`;
}

async function writeEndpoint(
  projectRoot: string,
  directory: string,
  source: string,
  filename = `${directory.split("/").at(-1)}.req.md`,
): Promise<void> {
  await platform.mkdir(`${projectRoot}/api/${directory}`, { recursive: true });
  await platform.writeTextFile(
    `${projectRoot}/api/${directory}/${filename}`,
    source,
  );
}

function codes(error: unknown): readonly string[] {
  assert.ok(error instanceof EvidenceError);
  return error.diagnostics.map((item: EvidenceDiagnostic) => item.code);
}

async function caught(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  assert.fail("Expected the load to throw an EvidenceError.");
}

test("AC-F018-001 · the loader assembles evidence matching the project on disk", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  assert.equal(project.name, "bookmarks");
  assert.equal(project.apiDirectory, "api");
  assert.equal(project.requirementsFile, "requirements/application.req.md");
  assert.equal(project.generatedDirectory, "generated");

  const inventory = await loadRequirementEvidence(project, {
    projectRoot: root,
  });
  const created = inventory.requirements.find((item) =>
    item.id === "EP-BOOKMARKS-CREATE"
  );
  assert.ok(created);
  assert.equal(created.status, "approved");
  assert.deepEqual(created.criteria.map((item) => item.id), ["AC-EP-001"]);
  assert.equal(created.path, "api/bookmarks/bookmarks.req.md");
});

test("AC-F018-002 · a governed change leaves the recorded approval unbound", async () => {
  const root = await scaffold();
  const source = endpointRequirement({ id: "EP-BOOKMARKS-CREATE" });
  await writeEndpoint(root, "bookmarks", source);
  const project = await resolveProjectLocations({ projectRoot: root });

  const bound = await loadRequirementEvidence(project, { projectRoot: root });
  assert.equal(
    bound.requirements.find((item) => item.id === "EP-BOOKMARKS-CREATE")
      ?.approvalBound,
    true,
  );

  await writeEndpoint(
    root,
    "bookmarks",
    source.replace("Create a bookmark.", "Create and publish a bookmark."),
  );
  const drifted = await loadRequirementEvidence(project, { projectRoot: root });
  assert.equal(
    drifted.requirements.find((item) => item.id === "EP-BOOKMARKS-CREATE")
      ?.approvalBound,
    false,
  );
});

test("AC-F018-003 · a status-only edit changes no digest or binding", async () => {
  const root = await scaffold();
  const source = endpointRequirement({ id: "EP-BOOKMARKS-CREATE" });
  await writeEndpoint(root, "bookmarks", source);
  const project = await resolveProjectLocations({ projectRoot: root });
  const before = await loadRequirementEvidence(project, { projectRoot: root });

  await writeEndpoint(
    root,
    "bookmarks",
    source.replace("\nstatus: approved\n", "\nstatus: verified\n"),
  );
  const after = await loadRequirementEvidence(project, { projectRoot: root });

  const first = before.requirements.find((item) =>
    item.id === "EP-BOOKMARKS-CREATE"
  );
  const second = after.requirements.find((item) =>
    item.id === "EP-BOOKMARKS-CREATE"
  );
  assert.equal(second?.governedContentDigest, first?.governedContentDigest);
  assert.equal(second?.approvalBound, true);
  assert.equal(second?.status, "verified");
});

test("AC-F018-004 · source-authored verification claims are not admitted", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({
      id: "EP-BOOKMARKS-CREATE",
      extraBody: `
## Verification claim

All mapped tests passed and every criterion is covered.
`,
    }),
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  const inventory = await loadRequirementEvidence(project, {
    projectRoot: root,
  });
  const created = inventory.requirements.find((item) =>
    item.id === "EP-BOOKMARKS-CREATE"
  );
  assert.ok(created);
  assert.equal(created.status, "approved");
  const serialized = JSON.stringify(created);
  assert.ok(!serialized.includes("All mapped tests passed"));
});

test("AC-F018-005 · identical content produces identical inventories", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  await writeEndpoint(
    root,
    "authors",
    endpointRequirement({ id: "EP-AUTHORS-CREATE", criteria: ["AC-EP-002"] }),
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  const first = await loadRequirementEvidence(project, { projectRoot: root });
  const second = await loadRequirementEvidence(project, { projectRoot: root });
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(first.requirements.map((item) => item.id), [
    "bookmarks-application",
    "EP-AUTHORS-CREATE",
    "EP-BOOKMARKS-CREATE",
  ]);
});

test("AC-F018-006 · discovery reads only declared locations", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  await platform.mkdir(`${root}/notes`, { recursive: true });
  await platform.writeTextFile(
    `${root}/notes/notes.req.md`,
    endpointRequirement({ id: "EP-OUTSIDE-DECLARED" }),
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  const read: string[] = [];
  const inventory = await loadRequirementEvidence(project, {
    projectRoot: root,
    readTextFile: (path) => {
      read.push(path);
      return platform.readTextFile(path);
    },
  });
  assert.deepEqual(inventory.requirements.map((item) => item.id), [
    "bookmarks-application",
    "EP-BOOKMARKS-CREATE",
  ]);
  assert.ok(read.some((path) => path.includes("/api/bookmarks/")));
  assert.ok(!read.some((path) => path.includes("/notes/")));
});

test("AC-F018-007 · malformed and duplicate requirements fail closed", async () => {
  const root = await scaffold();
  await writeEndpoint(root, "bookmarks", "not a governed requirement\n");
  const project = await resolveProjectLocations({ projectRoot: root });
  const malformed = codes(
    await caught(() => loadRequirementEvidence(project, { projectRoot: root })),
  );
  assert.ok(malformed.length > 0);

  const root2 = await scaffold();
  const duplicate = endpointRequirement({ id: "EP-BOOKMARKS-CREATE" });
  await writeEndpoint(root2, "bookmarks", duplicate);
  await writeEndpoint(root2, "copies", duplicate);
  const project2 = await resolveProjectLocations({ projectRoot: root2 });
  const reported = codes(
    await caught(() =>
      loadRequirementEvidence(project2, { projectRoot: root2 })
    ),
  );
  assert.ok(reported.includes("SH_EVIDENCE_REQUIREMENT_DUPLICATE"));
});

test("AC-NRF-003 · discovery loads multiple named requirements from one directory", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
    "create-bookmark.req.md",
  );
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({
      id: "EP-BOOKMARKS-LIST",
      criteria: ["AC-EP-002"],
    }),
    "list-bookmarks.req.md",
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  const inventory = await loadRequirementEvidence(project, {
    projectRoot: root,
  });
  assert.deepEqual(inventory.requirements.map((item) => item.id), [
    "bookmarks-application",
    "EP-BOOKMARKS-CREATE",
    "EP-BOOKMARKS-LIST",
  ]);
  assert.deepEqual(inventory.requirements.map((item) => item.path), [
    "requirements/application.req.md",
    "api/bookmarks/create-bookmark.req.md",
    "api/bookmarks/list-bookmarks.req.md",
  ]);
});

test("AC-NRF-005 · legacy requirement filenames fail with migration guidance", async () => {
  const root = await scaffold();
  await platform.mkdir(`${root}/api/bookmarks`, { recursive: true });
  await platform.writeTextFile(
    `${root}/api/bookmarks/requirements.md`,
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  const error = await caught(() =>
    loadRequirementEvidence(project, { projectRoot: root })
  );
  assert.ok(error instanceof EvidenceError);
  const diagnostic = error.diagnostics.find((item) =>
    item.code === "SH_EVIDENCE_REQUIREMENT_LEGACY_FILENAME"
  );
  assert.ok(diagnostic);
  assert.equal(diagnostic.path, "api/bookmarks/requirements.md");
  assert.match(diagnostic.correction, /\.req\.md/);
});

test("AC-F018-012 · multi-service discovery is scoped per service", async () => {
  const root = await scaffold();
  await platform.mkdir(`${root}/services/orders/api/orders`, { recursive: true });
  await platform.mkdir(`${root}/services/billing/api/invoices`, {
    recursive: true,
  });
  await platform.writeTextFile(
    `${root}/services/orders/api/orders/orders.req.md`,
    endpointRequirement({ id: "EP-ORDERS-CREATE" }),
  );
  await platform.writeTextFile(
    `${root}/services/billing/api/invoices/invoices.req.md`,
    endpointRequirement({ id: "EP-INVOICES-CREATE", criteria: ["AC-EP-003"] }),
  );
  await platform.writeTextFile(
    `${root}/sleepyhollow.services.json`,
    JSON.stringify({
      services: [
        { id: "orders", root: "services/orders" },
        { id: "billing", root: "services/billing" },
      ],
    }),
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  assert.deepEqual(project.services.map((service) => service.id), [
    "billing",
    "orders",
  ]);
  const inventory = await loadRequirementEvidence(project, {
    projectRoot: root,
  });
  const orders = inventory.requirements.find((item) =>
    item.id === "EP-ORDERS-CREATE"
  );
  const invoices = inventory.requirements.find((item) =>
    item.id === "EP-INVOICES-CREATE"
  );
  assert.equal(orders?.serviceId, "orders");
  assert.equal(invoices?.serviceId, "billing");
});

test("AC-F018-013 · a missing or invalid project configuration fails closed", async () => {
  const empty = await platform.makeTempDir({ prefix: "sh-evidence-empty-" });
  const missing = codes(
    await caught(() => resolveProjectLocations({ projectRoot: empty })),
  );
  assert.ok(missing.includes("SH_EVIDENCE_PROJECT_CONFIG_MISSING"));

  const invalid = await platform.makeTempDir({ prefix: "sh-evidence-invalid-" });
  await platform.writeTextFile(
    `${invalid}/sleepyhollow.config.ts`,
    "export default { name: 'broken' };\n",
  );
  const reported = codes(
    await caught(() => resolveProjectLocations({ projectRoot: invalid })),
  );
  assert.ok(reported.includes("SH_EVIDENCE_PROJECT_CONFIG_INVALID"));

  const legacy = await platform.makeTempDir({ prefix: "sh-evidence-legacy-" });
  await platform.writeTextFile(
    `${legacy}/sleepyhollow.config.ts`,
    `export default {
  name: "legacy",
  apiDirectory: "api",
  requirementsFile: "requirements/application.md",
  generatedDirectory: "generated",
};
`,
  );
  const legacyError = await caught(() =>
    resolveProjectLocations({ projectRoot: legacy })
  );
  assert.ok(legacyError instanceof EvidenceError);
  const legacyDiagnostic = legacyError.diagnostics.find((item) =>
    item.code === "SH_EVIDENCE_REQUIREMENT_LEGACY_FILENAME"
  );
  assert.ok(legacyDiagnostic);
  assert.equal(legacyDiagnostic.path, "requirements/application.md");
  assert.match(legacyDiagnostic.correction, /application\.req\.md/);
});

function captureArtifact(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schema: "sleepy-hollow-capture/v1",
    runner: "vitest",
    revision: "test-revision",
    requests: [{
      sequence: 1,
      method: "POST",
      path: "/bookmarks",
      readLocations: ["body", "query"],
      responseStatus: 201,
      attribution: {
        requirementId: "EP-BOOKMARKS-CREATE",
        criterionId: "AC-EP-001",
      },
    }],
    dataOperations: [{
      sequence: 2,
      resource: "bookmarks",
      kind: "query",
      index: "owner",
      limit: 25,
      attribution: {
        requirementId: "EP-BOOKMARKS-CREATE",
        criterionId: "AC-EP-001",
      },
    }],
    uncapturedRoutes: [],
    ...overrides,
  };
}

async function writeCapture(
  projectRoot: string,
  artifact: Record<string, unknown>,
): Promise<void> {
  await platform.writeTextFile(
    `${projectRoot}/generated/capture.json`,
    JSON.stringify(artifact, null, 2),
  );
}

async function writeRoute(
  projectRoot: string,
  authentication: "none" | "required" = "none",
): Promise<void> {
  const routingModule = new URL("../../core/routing/mod.ts", import.meta.url)
    .href;
  await platform.writeTextFile(
    `${projectRoot}/api/bookmarks/route.ts`,
    `import { defineRoute } from ${JSON.stringify(routingModule)};

export default defineRoute({
  POST: {
    schemas: { body: { contract: { type: "object" } } },
    security: { authentication: { mode: ${JSON.stringify(authentication)} } },
    contract: {},
    handler: () => new Response(null, { status: 201 }),
  },
});
`,
  );
}

test("AC-F018-008 · an observed read with no declared schema is missing coverage", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  await writeRoute(root);
  await writeCapture(root, captureArtifact());
  const project = await resolveProjectLocations({ projectRoot: root });
  const inventory = await loadVerificationInventory(project, {
    projectRoot: root,
    revision: "test-revision",
  });
  const route = inventory.routes.find((item) => item.method === "POST");
  assert.ok(route);
  assert.deepEqual([...route.requestSchemaLocations].sort(), ["body"]);
  assert.deepEqual([...route.requiredRequestLocations].sort(), [
    "body",
    "query",
  ]);
});

test("AC-F018-015 · evidence reads object-form required authentication", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  await writeRoute(root, "required");
  await writeCapture(root, captureArtifact());
  const project = await resolveProjectLocations({ projectRoot: root });
  const inventory = await loadVerificationInventory(project, {
    projectRoot: root,
    revision: "test-revision",
  });
  assert.equal(inventory.routes[0]?.authentication, "required");
});

test("AC-F018-014 · an uncaptured route is carried through as uncaptured", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  await writeRoute(root);
  await writeCapture(
    root,
    captureArtifact({
      requests: [],
      dataOperations: [],
      uncapturedRoutes: [{ method: "POST", path: "/bookmarks" }],
    }),
  );
  const project = await resolveProjectLocations({ projectRoot: root });
  const inventory = await loadVerificationInventory(project, {
    projectRoot: root,
    revision: "test-revision",
  });
  assert.deepEqual(inventory.uncapturedRoutes, [{
    method: "POST",
    path: "/bookmarks",
  }]);
  const route = inventory.routes.find((item) => item.method === "POST");
  assert.ok(route);
  assert.deepEqual(route.requiredRequestLocations, []);
  assert.equal(route.captured, false);
});

test("AC-F018-015 · a stale capture artifact is rejected", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  await writeRoute(root);
  await writeCapture(root, captureArtifact({ revision: "an-older-revision" }));
  const project = await resolveProjectLocations({ projectRoot: root });
  const reported = codes(
    await caught(() =>
      loadVerificationInventory(project, {
        projectRoot: root,
        revision: "test-revision",
      })
    ),
  );
  assert.ok(reported.includes("SH_EVIDENCE_CAPTURE_STALE"));
});

test("AC-F018-009 · hollow check runs against a real project without a supplied inventory", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  await writeRoute(root);
  await writeCapture(root, captureArtifact());
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runCheckCommand(["--json"], {
    cwd: root,
    stdout: (v) => stdout.push(v),
    stderr: (v) => stderr.push(v),
  }, createCheckInventoryLoader({ revision: "test-revision" }));
  const result = JSON.parse((stdout[0] ?? stderr[0]) ?? "{}");
  assert.equal(result.schema, "sleepy-hollow-check-result/v1");
  assert.equal(result.command, "check");
  assert.ok(Array.isArray(result.checks) && result.checks.length > 0);
  assert.ok(code === 0 || code === 1);
});

test("AC-F018-010 · hollow test runs against a real project through the CLI", async () => {
  const root = await scaffold();
  await writeEndpoint(
    root,
    "bookmarks",
    endpointRequirement({ id: "EP-BOOKMARKS-CREATE" }),
  );
  const loader = createTestInventoryLoader();
  const loaded = await loader({ projectRoot: root });
  assert.equal(loaded.projectRootDisplay, root);
  assert.deepEqual(loaded.requirements.map((item) => item.id), [
    "bookmarks-application",
    "EP-BOOKMARKS-CREATE",
  ]);

  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await runCli(["test", "--json"], {
    cwd: root,
    stdout: (v) => stdout.push(v),
    stderr: (v) => stderr.push(v),
  }, { testInventoryLoader: loader });
  const emitted = (stdout[0] ?? stderr[0]) ?? "";
  assert.ok(
    !emitted.includes("SH_TEST_INVENTORY_LOAD_FAILED"),
    `the shipped CLI must supply a test inventory loader, saw ${emitted}`,
  );
  assert.ok(code === 0 || code === 1);
});
