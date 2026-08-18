---
schema: sgad-component/v0.2
id: SH-F004
title: Deno KV data access
status: verified
risk: standard
source_sections:
  - "6.3"
  - "6.4"
  - "15.1"
depends_on:
  - SH-F003
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Deno KV data access

## Purpose

Provide small, typed persistence primitives that make common Deno KV operations
bounded, index-aware, atomic where possible, and testable.

## In scope

- Typed keys and values.
- Resource-oriented repositories or equivalent primitives.
- Declared secondary indexes and uniqueness.
- Cursor pagination and bounded list operations.
- Simple references and indexed `belongsTo` lookups.
- Atomic operations, isolated test databases, and an explicit raw-KV escape
  hatch.

## Requirements

Deno KV is the only supported first-release persistence system. This slice shall
target the Deno `2.9.5` KV API and invoke it explicitly with `--unstable-kv`
while that API remains unstable. The first canonical API shall be a small
resource definition and bound repository:

```ts
const Bookmark = z.strictObject({
  id: z.string(),
  collectionId: z.string(),
  url: z.url(),
});

const bookmarks = defineKvResource({
  name: "bookmarks",
  id: z.string(),
  value: Bookmark,
  indexes: {
    byCollection: {
      kind: "belongsTo",
      value: (bookmark) => bookmark.collectionId,
    },
    byUrl: {
      kind: "unique",
      value: (bookmark) => bookmark.url,
    },
  },
});

const repository = createKvRepository(kv, bookmarks);
```

Resource names and index names shall be non-empty stable identifiers. A
resource ID and every index value shall be one supported `Deno.KvKeyPart`.
Resource ID and value schemas shall be Zod 4 schemas, and schema parsing shall
occur before a mutation or after a read so corrupt or incompatible values are
not silently returned as typed data.

OPEN-003 is resolved by using native Deno KV tuple key parts without string
concatenation. Primary entries shall use
`["sh", resource, "primary", id]`. A unique pointer index shall use
`["sh", resource, "unique", index, value]`. A non-unique and `belongsTo`
pointer index shall use
`["sh", resource, "index", index, value, id]`. Index values shall point to the
primary key rather than duplicate the resource value. This encoding makes
resource, index, value, and primary-ID boundaries explicit, avoids delimiter
injection, and orders matching non-unique entries by primary ID.

The repository shall expose primary `get`, atomic `create`, version-checked
`update` and `delete`, unique lookup, and non-unique or `belongsTo` lookup. Every
write that affects a primary value and its indexes shall update all affected
keys in one Deno KV atomic operation. Creation shall check for an absent primary
key and absent unique-index keys. Update and delete shall check the previously
read primary versionstamp, remove obsolete index pointers, and write the new
primary and index state atomically. A failed check shall return the same typed
conflict result without an unbounded implicit retry.

Non-unique lookup shall require an explicit positive integer `limit` no greater
than `100`, accept an optional `asc` or `desc` direction, and accept only a
declared index plus one exact index value. It shall return `{ items, cursor }`,
use the native Deno KV iterator cursor, and probe at most one additional entry to
return a cursor only when another result exists. Reusing the cursor with the same
resource, index, value, direction, and limit shall not skip or duplicate
unchanged records. Pagination is not a
multi-page snapshot: concurrent inserts, updates, or deletes may change later
pages and shall be documented as such. Arbitrary in-memory filtering and an
unbounded canonical list operation shall not be exposed.

A reference shall be the typed resource identity plus primary ID. Resolving a
reference shall perform a primary-key read. A `belongsTo` index shall be a
non-unique pointer index and use the same bounded lookup API; it shall not imply
referential enforcement, joins, or cascading writes.

Tests shall obtain independent stores through `openKvTestContext()`, which shall
open a separate `Deno.openKv(":memory:")` database and expose explicit cleanup.
Closing or cleaning one context shall not modify another context.

The canonical repository shall expose immutable verification metadata naming
its resource, primary key shape, declared index kinds, maximum page size,
supported operations, and `access: "canonical"`. Purpose-specific direct access
shall require `rawKv(kv, { requirementId, reason })`, return metadata marked
`access: "raw"`, and preserve the non-empty justification. Direct `Deno.openKv`
or raw `Deno.Kv` use in application code outside that escape hatch remains
noncanonical and is intended to be flagged by the later independent verifier.

## Acceptance criteria

- AC-F004-001: A resource can be written and read through inferred typed ID and
  value schemas without application-level key encoding; invalid writes and
  corrupt reads fail safely.
- AC-F004-002: A declared secondary index returns matching resources in a
  deterministic primary-ID order through a query whose required limit is at
  most 100; undeclared indexes and unbounded access are rejected.
- AC-F004-003: Cursor pagination returns a bounded page and a usable continuation
  cursor without skipping or duplicating unchanged records when reused with the
  same query parameters.
- AC-F004-004: Concurrent attempts to claim a declared unique value allow no more
  than one successful owner.
- AC-F004-005: Create, version-checked update, and version-checked delete keep
  primary and pointer-index keys consistent through Deno KV atomic operations
  and expose a deterministic typed conflict result without implicit retry.
- AC-F004-006: Two test contexts use isolated KV state and can be cleaned without
  affecting each other.
- AC-F004-007: A simple reference can be resolved by primary key and a declared
  `belongsTo` lookup can be served by a compatible index.
- AC-F004-008: Verification metadata distinguishes canonical bounded access from
  an explicit raw-KV escape hatch.
- AC-F004-009: The API does not claim SQL joins, automatic cascades, or
  distributed transactions.

## Out of scope

- Additional databases.
- SQL-style joins and automatic cascading behavior.
- Full migration automation.
- A general range-query language, arbitrary filters, or snapshot pagination
  across multiple pages.
- File or object storage.

## Dependencies and assumptions

This component depends on the pinned Zod 4 schema boundary in SH-F003. Deno KV
uses optimistic concurrency control: versionstamp check failures are expected
conflicts, and callers decide whether a bounded retry is appropriate. Native KV
cursors are opaque and scoped to the same list selector and options. Deno KV
limits and instability remain upstream compatibility risks; this slice shall
test the pinned runtime behavior and shall not claim a stable cross-version
cursor format.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T14:11:32Z.
- Approved criteria: AC-F004-001 through AC-F004-009.
- Governed-content digest:
  `sha256:907a8e8cd07974545db0f5a4f01ac91b56d42ea28c1dc4899de511f56cab5a96`.
- Decision source: owner review; direct response `Approved` after review
  of the requirement path, bounded criteria, risk, dependency, resolved
  OPEN-003 design, and exact governed-content digest.

### Criterion mapping

- AC-F004-001 -> `kv_test.ts` typed resource validation and corrupt-data test;
  `type_test.ts` compile-time ID and value inference assertions.
- AC-F004-002 -> `kv_test.ts` deterministic declared-index and page-boundary
  test.
- AC-F004-003 -> `kv_test.ts` ascending, descending, and multi-page native-
  cursor test.
- AC-F004-004 -> `kv_test.ts` concurrent unique-claim test.
- AC-F004-005 -> `kv_test.ts` version-conflict and atomic index-maintenance test.
- AC-F004-006 -> `kv_test.ts` independent in-memory context test.
- AC-F004-007 -> `kv_test.ts` primary reference and bounded `belongsTo` test.
- AC-F004-008 -> `kv_test.ts` immutable canonical and justified raw metadata
  test.
- AC-F004-009 -> `kv_test.ts` absent relational and distributed-transaction
  surface test.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T14:15:16Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  requirement, mapped KV tests, typed nonfunctional seam, pinned dependency
  lock, and Deno task configuration in the working tree.
- Commands: `deno task check:kv`, `deno task test:routing`,
  `deno task test:validation`, and `deno task test:kv` using Deno `2.9.5` with
  `--unstable-kv` on macOS arm64.
- Runtime-test digest:
  `sha256:4a659ed5389fa371205b808d7d0292dcae88ea17141e515a5ba857323ab90d91`.
- Compile-time-test digest:
  `sha256:a66f50adb8137d3a5e853e42e36bbcb7a1034ef01e9fe0b3d61cfe7af2da3123`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Result: KV type checking passed, verified routing passed 9/9 with two nested
  steps, verified validation passed 10/10 with two nested steps, and KV passed
  0/9.
- Expected failure: every KV test reached the healthy Deno runner and failed at
  `openKvTestContext()` because the explicit seam raised
  `SH_KV_NOT_IMPLEMENTED`; no assertion, dependency, permission, or unrelated
  regression failure obscured the missing approved behavior.

### Verification

- Status: passed.
- Verified at: 2026-08-07T14:19:24Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the declared
  working tree.
- Approved requirement digest:
  `sha256:907a8e8cd07974545db0f5a4f01ac91b56d42ea28c1dc4899de511f56cab5a96`.
- Framework implementation manifest:
  `working-tree:sha256:f7e1e76626c370eefd6b6dd602e4140e6d7bbde16d130e464097a4e9dcedc30f`
  across 37 sorted routing, validation, and KV source, fixture, test,
  configuration, dependency-lock, repository-control, and CI files. Each record
  is `<relative-path>\0<file-sha256>\n` before hashing the sorted stream.
- Current runtime-test digest:
  `sha256:6d688c1dc560949af0f481cda32f48b274d1bc108266c568a58c721838999b20`.
- Current compile-time-test digest:
  `sha256:a66f50adb8137d3a5e853e42e36bbcb7a1034ef01e9fe0b3d61cfe7af2da3123`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Test-history note: after the recorded red run, the runtime test received only
  nonsemantic harness corrections for a redundant async callback and Node's
  assertion-predicate form; approved expectations and the implementation seam
  were unchanged.
- Framework verifier: `deno task verify:framework` using Deno `2.9.5` passed
  formatting and linting across 33 TypeScript files, all type checks, routing
  9/9 with two nested steps, validation 10/10 with two nested steps, and KV 9/9
  using `--unstable-kv`.
- Independent repository verifier: `npm run verify` from `website/` passed
  structural 16/16, links 1/1, repository consistency 9/9, React 8/8,
  TypeScript/build, and Playwright/Axe 66/66 across Chromium, Firefox, and
  WebKit.
- Repository consistency control digest:
  `sha256:a909a928e37ea21a2f7af88604948f97fc9afbf162d4eef24c73929fa96215d6`.
- CI control: the existing Pages verification job runs
  `deno task verify:framework`, which now includes the pinned unstable-KV check,
  lint, type, and acceptance-test task before website verification.
- Residual risks: Deno KV remains upstream-unstable; native cursors are opaque
  and provide no multi-page snapshot; the repository intentionally supports
  exact declared-index lookup rather than a general query language; CI has not
  run against this uncommitted branch; no delivery was attempted.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
