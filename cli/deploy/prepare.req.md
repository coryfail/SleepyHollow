---
schema: sgad-component/v0.2
id: SH-F022
title: Fly deployment preparation
status: approved
risk: high
source_sections:
  - "3.7"
  - "14"
depends_on:
  - SH-F004
  - SH-F008
  - SH-F011
  - SH-F012
  - SH-F013
  - SH-F020
  - SH-F021
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Fly deployment preparation

## Purpose

Replace `hollow deploy`'s attempted provider execution with a local,
provider-aware preparation command. Sleepy Hollow owns the repeatable files,
validation, and operator hand-off needed to make an application ready for
Fly.io; the operator continues to use `flyctl`, `fly.toml`, and Fly's own
documentation for every cloud mutation and provider-specific option.

## Authorized scope

- The `hollow deploy prepare` command for a named Fly application.
- Deterministic generation and validation of project-local `Dockerfile`,
  `.dockerignore`, and `fly.toml` artifacts suitable for a Node or Bun Sleepy
  Hollow application.
- Explicit embedded-SQLite and PostgreSQL preparation profiles, including the
  Fly volume and environment-key guidance each profile requires.
- Bounded, copyable `flyctl` hand-off commands and a versioned human/JSON
  preparation result.
- Safe no-overwrite behavior, deterministic regeneration, and tests proving
  that preparation cannot invoke `flyctl`, use a Fly credential, or create a
  remote resource.
- Removal of the current `hollow deploy` upload, token, confirmation, health,
  smoke-test, and provider-execution behavior.

## Command boundary

`hollow deploy prepare --target fly:<app> --database <sqlite|postgres>` shall
prepare one project in the current working directory. `--region <region>` is
required for the SQLite profile and optional for PostgreSQL. `--force` permits
replacement only of prior Sleepy Hollow-managed deployment artifacts; it shall
refuse to overwrite an unrecognized user-owned artifact. `--json` renders the
same preparation result as one JSON object.

`hollow deploy` without `prepare`, every confirmation option, and every option
that asks Sleepy Hollow to execute Fly tooling shall be rejected as invalid
usage. Preparation shall not inspect `FLY_API_TOKEN`, require `flyctl`, make a
network request, start a child process, create an account, app, volume, token,
secret, database, or deployment, or incur provider spend.

## Generated artifacts

For a valid project and explicit profile, preparation shall create or validate:

- a runtime-appropriate, production Dockerfile that builds the application and
  starts its declared HTTP server;
- a `.dockerignore` that excludes secrets, local databases, dependencies,
  coverage, and other non-deployment inputs; and
- a `fly.toml` with the named Fly app, internal service port, health check, and
  profile-specific storage or process configuration.

The SQLite profile shall require a named `data` volume mounted at `/data`, use
one writable Machine, and declare a database path inside that mount. The
PostgreSQL profile shall declare no application volume and shall name
`DATABASE_URL` as an operator-provided secret without exposing a value.

Generated files shall contain a stable Sleepy Hollow ownership marker. A repeat
preparation with the same normalized input shall leave managed artifacts
byte-identical and report `unchanged`; changing normalized input shall return a
new preparation plan. The command shall never write secret values.

## Operator hand-off

The result shall report the artifact paths and digests, selected profile, app,
region when supplied, non-secret environment-key names, volume requirements,
and the exact follow-up commands the operator should run. The commands shall
use official Fly tooling and preserve `fly.toml` as the source of truth for
regions, Machines, scaling, process groups, deploy strategy, release commands,
and future Fly-specific options.

For SQLite, the hand-off shall include the separately authorized Fly app and
volume creation steps before `fly deploy`. For PostgreSQL, it shall include the
separately authorized secret configuration and `fly deploy` steps. These are
instructions only; no command output, token, or secret value may enter the
result.

## Acceptance criteria

- AC-F022-001: `hollow deploy prepare` accepts only the documented Fly target,
  explicit database profile, allowed region, force, and JSON options; legacy
  execution and confirmation options fail as usage errors without writes.
- AC-F022-002: Valid SQLite preparation creates or validates managed
  `Dockerfile`, `.dockerignore`, and `fly.toml` files with an app, health
  check, one writable `/data` volume, and a database path under `/data`.
- AC-F022-003: Valid PostgreSQL preparation creates or validates managed
  artifacts with no application volume and guidance that names `DATABASE_URL`
  without exposing a value.
- AC-F022-004: Preparation never reads `FLY_API_TOKEN`, invokes `flyctl`,
  starts a child process, contacts a network endpoint, or creates an external
  resource.
- AC-F022-005: Existing unrecognized deployment files fail without mutation;
  `--force` replaces only a recognized Sleepy Hollow-managed artifact.
- AC-F022-006: Repeating normalized preparation input is byte-identical and
  reports unchanged, while a changed app, profile, or region produces a new
  plan and artifacts.
- AC-F022-007: Human and JSON results contain equivalent artifact paths and
  digests, profile, non-secret environment-key names, storage requirements, and
  copyable Fly command hand-off without credential or secret values.
- AC-F022-008: Current public CLI help, README, framework deployment guide,
  generated project guidance, and official skill guidance describe preparation
  and operator-run Fly commands only; they do not claim that Sleepy Hollow
  deploys to Fly.

## Out of scope

- Running `flyctl`, calling Fly APIs, or managing Fly authentication.
- Creating or purchasing a Fly account, organization, app, volume, database,
  secret, domain, certificate, or paid plan.
- Reimplementing Fly's command-line options, status API, or infrastructure
  model.
- Implementing any provider other than Fly.io.
- Migrating, backing up, or deploying a database.

## Dependencies and assumptions

SH-F004 owns database contracts; SH-F008 owns independent verification; SH-F011
owns CLI dispatch and diagnostics; SH-F012 owns safe configuration handling;
SH-F013 remains historical evidence for the removed execution model; SH-F020
owns packaged artifacts; and SH-F021 owns Node/Bun platform behavior. A project
must provide a supported Node or Bun package manifest and HTTP start command.

## Change impact

This supersedes the externally executing Fly adapter contract in SH-F013. It
changes deploy types, CLI parsing, tests, documentation, skill guidance, and
generated project configuration. All SH-F013 approval and verification evidence
remain historical and do not authorize this command boundary.

## Approval scope

Approval authorizes AC-F022-001 through AC-F022-008 and only the local,
non-network preparation implementation described above. It does not authorize
global tool installation, cloud-resource creation, spending, package
publication, or a live Fly deployment.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection only; no other digest
normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-20.
- Governed-content digest:
  `sha256:139c57fb6a2df35d1aecdc6ac2ef7fca0e64a56555125a9a4e33adf614ab18c5`.
- Decision source: owner direct response `Approved` after review of the exact
  governed-content digest.
- Scope: local preparation only; no cloud mutation is authorized.

### Criterion mapping

- AC-F022-001 -> `cli/deploy/prepare_test.ts` command-grammar and legacy
  execution-rejection tests.
- AC-F022-002 through AC-F022-007 -> `cli/deploy/prepare_test.ts` local
  artifact, profile, non-execution, ownership, idempotence, and result tests.
- AC-F022-008 -> `cli/create/create_test.ts` scaffold guidance test plus
  repository documentation verification.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-20.
- Command: `npm test -- --run cli/deploy/prepare_test.ts`.
- Result: all seven mapped tests failed because `prepareFlyDeployment` was not
  a function, proving that the local preparation boundary did not exist before
  implementation.

### Verification

- Status: passed.
- Verified at: 2026-08-20.
- Commands: `npm run verify`, `node --test website/tests/repository-consistency.test.mjs`,
  `npm run pack:check`, `git diff --check`, and a compiled-CLI preparation run
  in a fresh temporary project.
- Result: Node and Bun each passed 220 tests with 3 skipped; the migration
  baseline passed 4 tests; repository consistency passed 12 tests; and package
  dry-run verification reported the 0.3.1 npm tarball. The compiled executable
  created only `.dockerignore`, `Dockerfile`, and `fly.toml`, then printed Fly
  commands without invoking them.

### Delivery

- Status: not applicable. No Fly account, credential, command, deployment, or
  other external resource is created by this change.
