import { platform } from "#platform";
import assert from "assert/strict";
import { createHash } from "crypto";

import {
  applyPlanningDecision,
  decomposeApplication,
  type EndpointProposal,
  parseRequirement,
  type PlanningDocument,
  PlanningError,
  validateApplicationRequirement,
} from "./mod.ts";

const applicationBody = `# Bookmark service

## Purpose and user goals
Save and retrieve bookmarks.

## Actors and API consumers
Browser clients.

## In scope and out of scope
Bookmark storage is in scope. Social sharing is out of scope.

## Resource and data model
Bookmarks have an ID and URL.

## Proposed endpoints and methods
GET and POST /bookmarks.

## Relationships and indexes
Bookmarks are indexed by owner.

## Request and response conventions
JSON requests and responses.

## Error behavior
RFC 9457 problem details.

## Authentication and authorization
Authentication: none. Authorization: none.

## Security constraints
Validate URLs and bound request bodies.

## Deployment model
platform Deploy.

## Service architecture
One API.

## Cross-cutting acceptance criteria
- AC-APP-001: Every error response uses RFC 9457.

## Endpoint inventory and dependencies
bookmarks has no endpoint dependencies.

## Open questions, assumptions, and risks
- OPEN-APP-001: Retention duration remains unresolved.
`;

function governedPrefix(status = "draft"): string {
  return `---
schema: sgad-application/v0.2
id: bookmark-application
title: Bookmark application
status: ${status}
risk: standard
depends_on: []
owners:
  - bookmark maintainers
---

${applicationBody}`;
}

function digest(source: string): string {
  const governed = source.slice(0, source.indexOf("## Governance record"));
  const frontmatter = governed.match(/^---\n[\s\S]*?\n---\n/)?.[0];
  assert.ok(frontmatter);
  const normalized = frontmatter.replace(/^status:[^\n]*\n/m, "") +
    governed.slice(frontmatter.length);
  return createHash("sha256").update(normalized).digest("hex");
}

function applicationSource(status: "draft" | "approved" = "draft"): string {
  const prefix = governedPrefix(status);
  const approval = status === "approved"
    ? `- Status: approved.
- Approver: application-owner.
- Approved at: 2026-08-07T12:00:00Z.
- Approved criteria: AC-APP-001.
- Governed-content digest: \`sha256:${
      digest(`${prefix}## Governance record\n`)
    }\`.
- Decision source: fixture approval.
`
    : "- Status: pending exact-content approval.\n";
  return `${prefix}## Governance record

### Approval

${approval}`;
}

const endpoint: EndpointProposal = {
  id: "bookmarks",
  path: "/bookmarks",
  title: "Bookmarks",
  methods: ["GET", "POST"],
  service: "application",
  purpose: "List and create bookmarks.",
  inputs: "POST accepts a bounded URL payload.",
  successResponses: "GET returns 200; POST returns 201.",
  errors: "Invalid input returns an RFC 9457 400 response.",
  security: "Authentication: none. Authorization: none.",
  dataAccess: "Use the declared owner index with a finite limit.",
  sideEffects: "POST stores one bookmark.",
  abuseConsiderations: "Bound request size and list limit.",
  assumptions: "The application requirement remains approved.",
  acceptanceCriteria: [
    { id: "AC-BOOKMARKS-001", text: "GET returns a bounded bookmark list." },
    { id: "AC-BOOKMARKS-002", text: "POST stores one valid bookmark." },
  ],
  sourceSections: ["Proposed endpoints and methods"],
};

function endpointSource(
  id: string,
  path: string,
  dependsOn: readonly string[] = [],
): string {
  const dependencies = dependsOn.length === 0
    ? "depends_on: []"
    : `depends_on:\n${dependsOn.map((item) => `  - ${item}`).join("\n")}`;
  return `---
id: ${id}
path: ${path}
status: draft
methods:
  - GET
${dependencies}
service: application
---

# ${id}

## Purpose
Read ${id}.

## GET

### Inputs
No input.

### Success responses
Returns 200.

### Errors
Uses RFC 9457.

### Security
Authentication: none. Authorization: none.

### Data access and indexes
Bounded read.

### Side effects
None.

### Abuse considerations
Bounded response.

### Dependencies and assumptions
Declared in frontmatter.

### Acceptance criteria
- AC-${id.toUpperCase()}-001: Returns a bounded response.

## Governance record

### Approval

- Status: pending exact-content approval.
`;
}

test("AC-F006-001 · application planning requires every mandatory topic", () => {
  const parsed = validateApplicationRequirement(applicationSource());
  assert.equal(parsed.kind, "application");
  assert.equal(parsed.sections.has("Security constraints"), true);
  assert.throws(
    () =>
      validateApplicationRequirement(
        applicationSource().replace("## Deployment model", "## Omitted model"),
      ),
    (error) =>
      error instanceof PlanningError &&
      error.diagnostics.some((item) =>
        item.code === "SH_PLANNING_APPLICATION_SECTION_MISSING"
      ),
  );
});

test("AC-F006-002 · unresolved material decisions remain explicit", () => {
  const parsed = validateApplicationRequirement(applicationSource());
  assert.match(
    parsed.sections.get("Open questions, assumptions, and risks") ?? "",
    /OPEN-APP-001.*unresolved/,
  );
});

test("AC-F006-003 · decomposition proposes only directories and requirements", () => {
  const plan = decomposeApplication(
    {
      path: "requirements/application.req.md",
      source: applicationSource("approved"),
    },
    [endpoint],
  );
  assert.deepEqual(plan.directories, ["api/bookmarks"]);
  assert.deepEqual(plan.files.map((item) => item.path), [
    "api/bookmarks/bookmarks.req.md",
  ]);
  assert.ok(
    plan.files.every((item) => !/route(?:\.test)?\.ts$/.test(item.path)),
  );
});

test("AC-NRF-006 · decomposition rejects portable named-file collisions", () => {
  assert.throws(
    () =>
      decomposeApplication(
        {
          path: "requirements/application.req.md",
          source: applicationSource("approved"),
        },
        [
          endpoint,
          {
            ...endpoint,
            id: "BOOKMARKS",
            acceptanceCriteria: [{
              id: "AC-BOOKMARKS-UPPER-001",
              text: "GET returns a bounded bookmark list.",
            }],
          },
        ],
      ),
    (error) =>
      error instanceof PlanningError &&
      error.diagnostics.some((item) =>
        item.code === "SH_PLANNING_REQUIREMENT_PATH_DUPLICATE"
      ),
  );
});

test("AC-F006-004 · endpoint frontmatter is strict and machine-readable", () => {
  const parsed = parseRequirement(
    endpointSource("bookmarks", "/bookmarks"),
    "api/bookmarks/bookmarks.req.md",
    "endpoint",
  );
  assert.equal(parsed.id, "bookmarks");
  assert.deepEqual(parsed.metadata.methods, ["GET"]);
  assert.equal(parsed.metadata.service, "application");
});

test("AC-F006-005 · endpoint requirements include every mandatory section", () => {
  assert.throws(
    () =>
      parseRequirement(
        endpointSource("bookmarks", "/bookmarks").replace(
          "### Data access and indexes",
          "### Missing data section",
        ),
        "api/bookmarks/bookmarks.req.md",
        "endpoint",
      ),
    (error) =>
      error instanceof PlanningError &&
      error.diagnostics.some((item) =>
        item.code === "SH_PLANNING_ENDPOINT_SECTION_MISSING"
      ),
  );
});

const decisionDocuments: readonly PlanningDocument[] = [
  {
    path: "api/bookmarks/bookmarks.req.md",
    source: endpointSource("bookmarks", "/bookmarks"),
  },
  {
    path: "api/collections/collections.req.md",
    source: endpointSource("collections", "/collections", ["bookmarks"]),
  },
];

test("AC-F006-006 · one endpoint decision does not approve another", () => {
  const result = applyPlanningDecision(decisionDocuments, {
    action: "approve",
    requirementIds: ["bookmarks"],
    actor: "owner",
    at: "2026-08-07T12:00:00Z",
    decisionSource: "test approval",
  });
  assert.match(result.documents[0].source, /status: approved/);
  assert.match(result.documents[1].source, /status: draft/);
});

test("AC-F006-007 · explicit group approval changes only named endpoints", () => {
  const third = {
    path: "api/tags/tags.req.md",
    source: endpointSource("tags", "/tags"),
  };
  const result = applyPlanningDecision([...decisionDocuments, third], {
    action: "approve",
    requirementIds: ["bookmarks", "collections"],
    actor: "owner",
    at: "2026-08-07T12:00:00Z",
    decisionSource: "test group approval",
  });
  assert.deepEqual(result.changedRequirementIds, ["bookmarks", "collections"]);
  assert.match(result.documents[2].source, /status: draft/);
});

test("AC-F006-008 · revision returns affected behavior to draft and reports dependents", () => {
  const initiallyApproved = applyPlanningDecision(decisionDocuments, {
    action: "approve",
    requirementIds: ["bookmarks", "collections"],
    actor: "owner",
    at: "2026-08-07T12:00:00Z",
    decisionSource: "test approval",
  });
  const revised = applyPlanningDecision(initiallyApproved.documents, {
    action: "revise",
    requirementIds: ["bookmarks"],
    actor: "owner",
    at: "2026-08-07T13:00:00Z",
    decisionSource: "test revision",
    rationale: "Bookmark behavior must change.",
  });
  assert.match(revised.documents[0].source, /status: draft/);
  assert.deepEqual(revised.reviewRequired, ["collections"]);
});

test("AC-F006-009 · decomposition reports approved-source conflicts", () => {
  assert.throws(
    () =>
      decomposeApplication(
        {
          path: "requirements/application.req.md",
          source: applicationSource("approved"),
        },
        [{
          ...endpoint,
          conflicts: [{
            applicationText: "Authentication: none.",
            proposedText: "Require user authentication.",
          }],
        }],
      ),
    (error) =>
      error instanceof PlanningError &&
      error.diagnostics.some((item) =>
        item.code === "SH_PLANNING_APPLICATION_CONFLICT" &&
        item.message.includes("Authentication: none.")
      ),
  );
});

test("AC-F006-010 · malformed and duplicate criteria report source locations", () => {
  const source = endpointSource("bookmarks", "/bookmarks").replace(
    "- AC-BOOKMARKS-001: Returns a bounded response.",
    "- AC-BOOKMARKS-001: First behavior.\n- AC-BOOKMARKS-001: Duplicate behavior.",
  );
  assert.throws(
    () =>
      parseRequirement(source, "api/bookmarks/bookmarks.req.md", "endpoint"),
    (error) => {
      assert.ok(error instanceof PlanningError);
      const duplicate = error.diagnostics.find((item) =>
        item.code === "SH_PLANNING_CRITERION_DUPLICATE"
      );
      assert.equal(duplicate?.path, "api/bookmarks/bookmarks.req.md");
      assert.ok((duplicate?.line ?? 0) > 1);
      return true;
    },
  );
});

test("AC-F006-008 · the latest append-only approval supersedes an invalidated approval", () => {
  const prefix = governedPrefix("approved");
  const approved = `- Status: approved.
- Approver: original-owner.
- Approved at: 2026-08-07T12:00:00Z.
- Approved criteria: AC-APP-001.
- Governed-content digest: \`sha256:${digest(`${prefix}## Governance record\n`)}\`.
- Decision source: original approval.
`;
  const current = `- Status: approved.
- Approver: current-owner.
- Approved at: 2026-08-21T12:00:00Z.
- Approved criteria: AC-APP-001.
- Governed-content digest: \`sha256:${digest(`${prefix}## Governance record\n`)}\`.
- Decision source: current implementation approval.
`;
  const source = `${prefix}## Governance record

### Approval

${approved}
### Invalidation, implementation revision

- Status: invalidated.
- Reason: the implementation changed after the original approval.

### Approval, current implementation

${current}`;
  const parsed = validateApplicationRequirement(source);
  assert.equal(parsed.approval?.approver, "current-owner");
  assert.equal(parsed.approval?.decisionSource, "current implementation approval");
  assert.equal(parsed.approval?.valid, true);
});
