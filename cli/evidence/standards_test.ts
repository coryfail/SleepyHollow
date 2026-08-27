import { platform } from "#platform";
import assert from "assert/strict";

import { createProject } from "../create/mod.ts";
import {
  loadCodeStandards,
  loadRequirementEvidence,
  resolveProjectLocations,
} from "./mod.ts";

/** Creates one disposable generated project for standards evidence tests. */
async function projectFixture(): Promise<string> {
  const parent = await platform.makeTempDir({ prefix: "sh-standards-" });
  const result = await createProject({ name: "standards-app", directory: parent });
  return result.projectPath;
}

/** Returns stable diagnostic codes from a standards evidence result. */
function codes(result: Awaited<ReturnType<typeof loadCodeStandards>>): string[] {
  return result.violations.map((item) => item.code);
}

/** Returns one structurally complete draft model requirement. */
function modelRequirement(): string {
  return `---
schema: sgad-model/v0.1
id: MODEL-BOOKMARK
model: bookmark
status: draft
persistence: drizzle
database: postgres
depends_on: []
owners:
  - application owner
---

# Bookmark model

## Purpose

Persist a bookmark.

## Fields

An identifier and URL.

## Relationships

No relationships.

## Constraints and indexes

The identifier is the primary key.

## Data access

Reads by identifier are bounded.

## Retention and deletion

Bookmarks remain until deleted.

## Security

Sensitive fields: none.

## Migration strategy

Drizzle owns forward migrations.

## Acceptance criteria

- AC-MODEL-BOOKMARK-001: A bookmark identifier is unique.

## Governance record
`;
}

/** Returns a model requirement that records a complete non-Drizzle exception. */
function alternativeModelRequirement(): string {
  return modelRequirement().replace(
    `persistence: drizzle
database: postgres`,
    `persistence: alternative
persistence_exception:
  technology: managed document API
  reason: The approved service is the system of record.
  approver: human-project-owner
  decision_source: Current application architecture review.`,
  );
}

/** Returns source that violates the objective application engineering limits. */
function unsafeQualitySource(): string {
  const statements = Array.from(
    { length: 41 },
    (_, index) => `  const value${String(index).padStart(2, "0")} = first;`,
  ).join("\n");
  const decisions = Array.from(
    { length: 11 },
    (_, index) => `  if (first === ${index}) return String(first);`,
  ).join("\n");
  return `/* eslint-disable */
/** Demonstrates unsafe source that the independent verifier must reject. */
export function unsafeSource(
  first: any,
  second: string,
  third: string,
  fourth: string,
  fifth: string,
): string {
  // @ts-ignore
  console.log(second, third, fourth, fifth, first!);
  try {
    throw new Error("failure");
  } catch {}
  if (first) {
    if (second) {
      if (third) {
        if (fourth) return fifth;
      }
    }
  }
${decisions}
${statements}
  return String(first);
}
`;
}

test("AC-F018-016 · model persistence and readable-source standards fail closed", async () => {
  const root = await projectFixture();
  const manifestPath = `${root}/package.json`;
  const manifest = JSON.parse(await platform.readTextFile(manifestPath));
  delete manifest.dependencies["drizzle-orm"];
  await platform.writeTextFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await platform.mkdir(`${root}/models/bookmark`, { recursive: true });
  await platform.writeTextFile(
    `${root}/models/bookmark/schema.ts`,
    `import { pgTable, text } from "drizzle-orm/pg-core";

export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
});
`,
  );
  await platform.mkdir(`${root}/api/bookmarks`, { recursive: true });
  await platform.writeTextFile(
    `${root}/api/bookmarks/route.ts`,
    `import { sql } from "drizzle-orm";

const listBookmarks = () => sql\`select 1\`;

export { listBookmarks };
`,
  );

  const project = await resolveProjectLocations({ projectRoot: root });
  const result = await loadCodeStandards(project);
  const reported = codes(result);

  assert.ok(reported.includes("SH_CHECK_MODEL_REQUIREMENT_MISSING"));
  assert.ok(reported.includes("SH_CHECK_MODEL_REPOSITORY_MISSING"));
  assert.ok(reported.includes("SH_CHECK_MODEL_TYPES_MISSING"));
  assert.ok(reported.includes("SH_CHECK_DRIZZLE_DEPENDENCY_MISSING"));
  assert.ok(reported.includes("SH_CHECK_ROUTE_DATA_ACCESS_FORBIDDEN"));
  assert.ok(reported.includes("SH_CHECK_FUNCTION_DOCUMENTATION_MISSING"));
  assert.ok(reported.includes("SH_CHECK_FUNCTION_MULTILINE_REQUIRED"));
});

test("AC-F018-016 · a split governed Drizzle model passes source standards", async () => {
  const root = await projectFixture();
  await platform.mkdir(`${root}/models/bookmark`, { recursive: true });
  await platform.writeTextFile(
    `${root}/models/bookmark/bookmark.req.md`,
    modelRequirement(),
  );
  await platform.writeTextFile(
    `${root}/models/bookmark/schema.ts`,
    `import { pgTable, text } from "drizzle-orm/pg-core";

export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
});
`,
  );
  await platform.writeTextFile(
    `${root}/models/bookmark/repository.ts`,
    "export {};\n",
  );
  await platform.writeTextFile(
    `${root}/models/bookmark/types.ts`,
    "export interface Bookmark { readonly id: string; }\n",
  );
  await platform.writeTextFile(
    `${root}/drizzle.config.ts`,
    "export default {};\n",
  );

  const project = await resolveProjectLocations({ projectRoot: root });
  const result = await loadCodeStandards(project);

  assert.deepEqual(result.violations, []);
  assert.equal(result.hasDurableModels, true);
  const requirements = await loadRequirementEvidence(project, {
    projectRoot: root,
  });
  assert.ok(
    requirements.requirements.some((item) => item.id === "MODEL-BOOKMARK"),
  );
});

test("AC-F018-016 · a complete non-Drizzle exception waives Drizzle checks", async () => {
  const root = await projectFixture();
  const manifestPath = `${root}/package.json`;
  const manifest = JSON.parse(await platform.readTextFile(manifestPath));
  delete manifest.dependencies["drizzle-orm"];
  await platform.writeTextFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await platform.mkdir(`${root}/models/bookmark`, { recursive: true });
  await platform.writeTextFile(
    `${root}/models/bookmark/bookmark.req.md`,
    alternativeModelRequirement(),
  );
  await platform.writeTextFile(
    `${root}/models/bookmark/schema.ts`,
    `export const bookmarkCollection = "managed-bookmarks";\n`,
  );
  await platform.writeTextFile(
    `${root}/models/bookmark/repository.ts`,
    "export {};\n",
  );
  await platform.writeTextFile(
    `${root}/models/bookmark/types.ts`,
    "export interface Bookmark { readonly id: string; }\n",
  );

  const project = await resolveProjectLocations({ projectRoot: root });
  const result = await loadCodeStandards(project);

  assert.deepEqual(result.violations, []);
  assert.equal(result.hasDurableModels, true);
});

test("AC-F018-017 · unsafe types, suppressions, logging, and function limits fail", async () => {
  const root = await projectFixture();
  await platform.mkdir(`${root}/api/unsafe`, { recursive: true });
  await platform.writeTextFile(
    `${root}/api/unsafe/route.ts`,
    unsafeQualitySource(),
  );

  const project = await resolveProjectLocations({ projectRoot: root });
  const result = await loadCodeStandards(project);
  const reported = codes(result);

  for (const expected of [
    "SH_CHECK_CONSOLE_FORBIDDEN",
    "SH_CHECK_EMPTY_CATCH_FORBIDDEN",
    "SH_CHECK_EXPLICIT_ANY_FORBIDDEN",
    "SH_CHECK_FUNCTION_COMPLEXITY_LIMIT",
    "SH_CHECK_FUNCTION_LENGTH_LIMIT",
    "SH_CHECK_FUNCTION_NESTING_LIMIT",
    "SH_CHECK_FUNCTION_PARAMETER_LIMIT",
    "SH_CHECK_LINT_SUPPRESSION_INVALID",
    "SH_CHECK_NON_NULL_ASSERTION_FORBIDDEN",
    "SH_CHECK_TYPESCRIPT_SUPPRESSION_FORBIDDEN",
  ]) {
    assert.ok(reported.includes(expected), expected);
  }
});
