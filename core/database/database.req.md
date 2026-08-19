---
schema: sgad-component/v0.2
id: SH-F004
title: Relational database and repositories
status: approved
risk: high
source_sections:
  - "6.3"
  - "6.4"
  - "14"
  - "15.1"
depends_on:
  - SH-F003
  - SH-F012
  - SH-F021
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Relational database and repositories

## Purpose

Give every Sleepy Hollow application a typed relational database without
requiring a separately operated database service, while allowing applications
that need multi-instance concurrency to select an external PostgreSQL database
explicitly.

## Authorized scope

- Drizzle ORM as the pinned schema, query, and migration layer.
- Embedded SQLite as the zero-configuration default for development, testing,
  and production on a durable local volume.
- A Node SQLite driver and a Bun SQLite driver behind one framework database
  adapter contract and one SQLite schema.
- Optional external PostgreSQL selected explicitly through application
  configuration and a secret connection URL.
- A framework-owned, provider-neutral resource and repository API over a
  deliberate portable relational subset.
- Declared primary, unique, secondary, and relationship indexes; transactions;
  optimistic concurrency; bounded cursor pagination; isolated tests; migration
  planning and execution; and a justified raw-SQL escape hatch.

## Database profiles

Embedded SQLite is the default profile. A new application shall run locally and
in tests without a database server, account, network, username, password, or
connection string. The framework shall create the database file and apply its
approved migrations automatically. Development defaults to a project-contained
ignored data path, tests use an isolated in-memory database, and production
requires an explicit durable path supplied by the deployment environment.

Node shall use pinned `better-sqlite3`; Bun shall use its built-in `bun:sqlite`
driver. Both shall be reached through their pinned Drizzle adapters. Both adapters
shall execute the same Drizzle SQLite schema, migrations, repository contract,
transactions, and conformance fixtures. Runtime-specific driver objects shall
not enter application repositories or generated contracts.

PostgreSQL is the only first external database profile. It shall be selected
explicitly in application configuration and shall require a secret
`DATABASE_URL`. Production shall never silently fall back from a configured
PostgreSQL profile to SQLite. The connection shall validate TLS policy, use a
bounded pool, expose readiness without returning credentials, and close on
shutdown. Missing, malformed, unreachable, or rejected configuration fails
before migrations or traffic.

SQLite and PostgreSQL are separate deployment profiles, not interchangeable
files. Switching an existing application between profiles requires an explicit
schema and data migration plan; changing a connection setting shall not pretend
to migrate existing data.

## Schema and repository contract

The canonical resource definition shall use framework-owned field, index, and
relationship declarations from which the framework constructs the selected
Drizzle schema and immutable verification metadata. The portable subset shall
include text, bounded integers, booleans, UUID text, UTC timestamps, JSON, and
binary values; primary keys; nullable and required fields; unique constraints;
secondary indexes; and explicit foreign-key relationships.

The repository shall expose typed primary `get`, `create`, version-checked
`update` and `delete`, unique lookup, bounded declared-index listing, references,
and relationship lookup. Zod validation shall run before writes and after reads.
Database constraints remain authoritative for concurrency. Create shall return a
typed conflict on primary or unique collision. Update and delete shall compare a
framework-owned integer version in the same SQL statement and return a typed
conflict when no current row matches; no implicit unbounded retry is allowed.

List operations shall require a declared index, explicit positive limit no
greater than 100, deterministic index-plus-primary-key ordering, optional
ascending or descending direction, and a validated opaque cursor bound to the
resource, index, value, ordering, and last row. The repository shall fetch at
most one extra row to determine whether a continuation exists. Arbitrary
in-memory filtering and unbounded canonical listing are prohibited.

Transactions shall atomically cover every row and relationship mutation owned by
one repository operation. The portable API shall not claim distributed
transactions or identical behavior for database-specific extensions. Raw SQL
requires a non-empty requirement ID, reason, and declared dialect; using it marks
the repository or operation dialect-specific in verification metadata.

## SQLite production safety

Production SQLite shall require a durable filesystem and one writable
application instance. Startup shall enable foreign keys, WAL mode, a bounded busy
timeout, and defensive settings supported by the selected driver. Deployment
shall refuse ephemeral storage or multiple writable instances. Backup and
restore instructions shall use a database-safe snapshot mechanism, and a
destructive or incompatible migration shall require a verified backup and
explicit deployment confirmation.

## Migrations

Application schema is version controlled. The framework shall generate and
retain dialect-specific migration artifacts from the same approved logical
schema revision, bind them to its digest, show pending and destructive changes
in verification and deployment plans, and apply them exactly once under a
database-appropriate migration lock before traffic reaches the new revision.

Automatic migration from the removed legacy KV representation is not included.
No credentialed live deployment or supported production dataset exists in the
repository evidence. If an operator has external data, export and import require
a separately reviewed migration requirement and shall not be inferred from this
breaking pre-1.0 change.

## Acceptance criteria

- AC-F004-001: A newly created application starts on Node and Bun with an
  embedded SQLite database, applies its schema, and performs typed reads and
  writes without a database service or connection string.
- AC-F004-002: The same SQLite schema, migrations, constraints, repository
  operations, and fixtures pass through the Node and Bun driver adapters.
- AC-F004-003: An explicitly configured PostgreSQL profile connects through a
  secret `DATABASE_URL`, passes the same portable repository contract against a
  real PostgreSQL service, and exposes no credential in output or evidence.
- AC-F004-004: Missing, malformed, unreachable, or rejected PostgreSQL
  configuration fails before migration or traffic and never falls back to a new
  SQLite database.
- AC-F004-005: Declared primary, unique, secondary, and relationship indexes are
  enforced by database constraints and support deterministic bounded queries;
  undeclared indexes and limits outside 1 through 100 are rejected.
- AC-F004-006: Cursor pagination returns a bounded page and validated
  continuation without skipping or duplicating unchanged rows when reused with
  the same query parameters.
- AC-F004-007: Concurrent unique claims permit at most one owner, while
  version-checked update and delete return a deterministic typed conflict rather
  than overwriting a newer row.
- AC-F004-008: Repository mutations and migration records are transactional,
  isolated test databases do not affect one another, and each driver closes all
  resources during shutdown.
- AC-F004-009: Verification metadata distinguishes portable canonical access
  from a justified, requirement-bound, dialect-specific raw-SQL escape hatch.
- AC-F004-010: Production SQLite refuses an ephemeral path or multiple writable
  instances and enables the declared durability and contention settings on a
  durable volume.
- AC-F004-011: Migration planning identifies pending and destructive changes
  without secrets, applies each migration once under a lock, and blocks a risky
  production migration without the required backup evidence and confirmation.
- AC-F004-012: No active database API, type, test, export, example, or
  documentation depends on the removed KV implementation.

## Out of scope

- MySQL, MariaDB, SQL Server, Oracle, and arbitrary ORM driver support.
- Transparent data conversion between SQLite and PostgreSQL.
- Automatic migration of legacy KV data.
- Multi-writer or multi-region embedded SQLite replication.
- A general-purpose ORM surface or unrestricted query language.
- Distributed transactions, automatic cross-service cascades, file storage, or
  object storage.

## Dependencies and assumptions

SH-F003 supplies Zod validation, SH-F012 supplies explicit environment and
secret configuration, and SH-F021 supplies the Node and Bun adapters. SH-F013
must enforce storage and topology capabilities during deployment. The selected
Drizzle and driver versions shall be pinned and verified rather than floated.

## Change impact

This requirement replaces the public KV resource, repository, raw-access, test
context, tuple-key, versionstamp, and cursor contracts with a relational API. It
changes examples, generated projects, services, capture metadata, verification,
documentation, exports, deployment planning, and packaging. The old approval and
verification entries below remain historical but are invalid for this content.

## Approval scope

Approval authorizes AC-F004-001 through AC-F004-012 and the declared breaking
replacement. It does not authorize external data migration, database purchase,
credential creation, publication, or deployment.

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

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: all acceptance criteria currently owned by SH-F004.
- Governed-content digest:
  `sha256:81793dd947766dd8efd822c2a30bd2b06d6f2561f1f1f10a8a4bd53fc5767dd7`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.

### Red-state evidence, platform migration baseline

- Status: failed as expected before implementation.
- Observed at: 2026-08-19T13:52:03Z.
- Command: `node --test tests/platform-migration-baseline.test.mjs`.
- Result: AC-F004-001 failed because `core/database/mod.ts` does not exist and
  the legacy `core/kv` implementation remains present.
