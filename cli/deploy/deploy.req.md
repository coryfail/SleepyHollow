---
schema: sgad-component/v0.2
id: SH-F013
title: Portable container deployment and Fly.io delivery
status: approved
risk: high
source_sections:
  - "3.7"
  - "14"
depends_on:
  - SH-F004
  - SH-F008
  - SH-F010
  - SH-F011
  - SH-F012
  - SH-F020
  - SH-F021
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Portable container deployment and Fly.io delivery

## Purpose

Deploy a verified Sleepy Hollow application through a provider-neutral
production bundle and adapter contract, with Fly.io as the first supported live
provider and without coupling verification, credentials, storage, or smoke tests
to one hosting platform.

## Authorized scope

- Deterministic production bundles for Node and Bun containing compiled
  application code, package metadata, an OCI-compatible Dockerfile, health
  configuration, schema migrations, and a start command.
- A deployment-provider registry with explicit capability metadata and injected
  command, transport, clock, credential, and filesystem seams.
- Fly.io application deployment through the official `flyctl` executable.
- Provider-neutral verification, plan, confirmation, idempotence, result,
  credential redaction, health, and representative-operation smoke behavior.
- Storage-aware deployment planning for embedded SQLite and external
  PostgreSQL.
- A stable boundary for future providers without claiming that an unimplemented
  provider is supported.

## Production bundle

The same verified source revision shall produce a deterministic production
bundle for the selected Node or Bun runtime. The bundle shall contain no secret,
local database file, development dependency, unapproved generated change, or
host-specific absolute path. It shall listen on `0.0.0.0` at the configured
internal port, use production configuration and security composition, expose a
health endpoint, handle termination cleanly, and run the exact validated router
and repository contract verified before deployment.

Container packaging is the portability boundary. A provider adapter may supply
provider configuration and execute provider tooling, but it shall not rewrite
application behavior, schemas, migrations, contracts, or verification evidence.
The adapter registry shall identify provider name, supported runtimes,
persistent-volume support, secret support, health-check support, multi-instance
support, deployment command requirements, and provider revision semantics.

## Deployment configuration and plan

Application configuration shall select one provider explicitly. `hollow deploy`
shall not infer a provider from an installed executable or credential. An
unknown or unimplemented provider fails before build or mutation and lists only
implemented providers.

Before external mutation, the deployment plan shall identify:

- Provider, application, region, selected runtime, source revision, bundle
  digest, prior provider revision, and intended instance count.
- Database profile and required storage topology.
- Environment-key and secret-name changes without values.
- Contract and migration changes, destructive migration or backup requirements,
  and compatibility impact.
- Build, upload, health, and representative smoke checks.
- Whether confirmation is required and the exact plan digest it authorizes.

Full independent verification must pass before bundle construction or upload.
The first external deployment, a breaking contract, a destructive migration, a
database-profile change, a storage-topology change, or another materially risky
production change requires explicit confirmation bound to the plan digest.

## Fly.io adapter

The Fly adapter shall require a configured Fly application name and the
official `flyctl` executable. Noninteractive authentication shall use an
operator-supplied, app-scoped token from `FLY_API_TOKEN`. A missing, empty, or
malformed token or executable fails before a remote command. The token shall be
passed only in the child-process environment for the bounded Fly invocation and
shall never appear in arguments, URLs, logs, plans, generated files,
diagnostics, evidence, or results.

The adapter shall generate or validate bounded Fly configuration from the
provider-neutral plan and invoke `flyctl deploy --remote-only` without a shell.
It shall use structured status output after deployment to identify the live URL,
release or Machine revision, instance state, and health. Command output shall be
bounded, normalized, and redacted before it becomes evidence.

Embedded SQLite requires a named Fly volume mounted at `/data`, a database path
within that mount, and exactly one writable Machine. The plan shall refuse an
ephemeral root filesystem, absent volume, path outside the mount, or multiple
writable Machines. PostgreSQL requires no application volume and may permit
multiple Machines after connection and migration readiness pass.

The framework shall not create an account, organization, paid resource, app,
volume, database, token, or secret without a separate explicit confirmation of
that external mutation and any spend. The first implementation may require the
operator to provision the Fly app and volume and shall report exact setup
commands without executing them.

## Results and failure handling

A successful upload is followed by a live health check and every configured
representative smoke test. Required failure returns a failed deployment result
that still identifies the live provider revision and URL. Transport, command,
authentication, build, upload, status, migration, health, or smoke failure shall
be actionable and shall never become partial success by rendering differently.

Results distinguish source revision, bundle digest, and provider revision.
Repeating an unchanged verified source, bundle, environment-key set, contract,
migration set, and provider configuration shall return a predictable unchanged
result or a provider-confirmed idempotent release rather than an unnecessary
upload.

## Acceptance criteria

- AC-F013-001: `hollow deploy` refuses bundle construction and upload when full
  verification fails and reports the blocking evidence.
- AC-F013-002: The plan contains every declared provider, runtime, source,
  bundle, database, topology, environment-name, contract, migration, and smoke
  field without exposing a secret value.
- AC-F013-003: Every first or materially risky deployment pauses after the plan
  and accepts only confirmation bound to the current plan digest.
- AC-F013-004: Node and Bun production bundles are deterministic for the same
  inputs, contain the required runtime and migration artifacts, and contain no
  secret, local data file, development-only input, or absolute host path.
- AC-F013-005: Provider selection is explicit; unsupported providers fail before
  build or mutation, while the registry can accept a test provider without
  changing provider-neutral orchestration.
- AC-F013-006: A missing Fly executable, app name, or valid `FLY_API_TOKEN`
  fails before remote execution and names the safe corrective action.
- AC-F013-007: The Fly token reaches only the bounded child-process environment
  and never appears in arguments, generated configuration, output, evidence,
  diagnostics, or results.
- AC-F013-008: The Fly adapter constructs the non-shell remote deployment and
  structured status commands through an injected runner and interprets success,
  authentication failure, platform refusal, timeout, malformed output, and
  process failure without an account or network.
- AC-F013-009: Embedded SQLite deployment requires a `/data` volume and one
  writable Machine, while PostgreSQL deployment requires no application volume
  and may plan multiple Machines.
- AC-F013-010: A successful provider upload runs health and representative smoke
  tests, and a required failure returns a failed result with the live URL,
  provider revision, and actionable evidence.
- AC-F013-011: Human and JSON results contain equivalent provider, URL, source
  revision, bundle digest, provider revision, contract locations, migration,
  smoke, and completion evidence.
- AC-F013-012: An unchanged verified deployment returns a predictable unchanged
  or provider-confirmed idempotent outcome without redundant upload.
- AC-F013-013: The active deployment implementation and documentation contain no
  removed platform adapter or credential contract.

## Out of scope

- Implementing providers other than Fly.io in this change.
- Creating or purchasing hosting accounts, applications, volumes, databases,
  domains, certificates, or paid plans.
- Automatic rollback unsupported by the provider.
- Multi-region writable embedded SQLite.
- Coordinated atomic deployment of multiple services.
- A Kubernetes operator or general infrastructure-as-code engine.

## Dependencies and assumptions

SH-F004 owns database topology and migrations, SH-F008 supplies independent
verification, SH-F010 supplies generated contracts, SH-F012 supplies redacted
configuration, SH-F020 supplies the package and production artifacts, and
SH-F021 supplies Node and Bun runtime adapters. Fly live acceptance remains
unproven without operator credentials; the injected runner proves construction
and interpretation, while the first authorized deployment must record actual
platform evidence.

## Change impact

This requirement removes the old provider-specific API adapter and generic
single-token request shape. It changes deploy target types, credentials,
inventory loading, production server behavior, result schemas, docs, skill
guidance, CLI integration, tests, and generated project configuration. Prior
approval and verification below remain historical and are invalid for this
content.

## Approval scope

Approval authorizes AC-F013-001 through AC-F013-013, deterministic container
packaging, the provider registry, and the non-mutating/injected Fly adapter
implementation. It does not authorize installing Fly tooling globally, creating
external resources, spending money, publishing, or performing a live deploy.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T23:49:26Z.
- Approved criteria: AC-F013-001 through AC-F013-013.
- Governed-content digest:
  `sha256:b0b2eedd36108b92c9cc836862ecc975211bc4989788b7e4a84b2e0215eeb21d`.
- Decision source: owner review; direct response `Approve` after review
  of the operator-supplied credential model, the injectable transport boundary,
  the OPEN-011 resolution, and the exact governed-content digest.

### Superseded approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T22:36:53Z.
- Approved criteria: AC-F013-001 through AC-F013-009.
- Governed-content digest:
  `sha256:fc354689a9b796f3be3563516920e8f443069a57a8f4a9bd5bd7d774d13996f2`.
- Decision source: owner review; direct response `Approve` after review
  of the requirement scope, bounded criteria, dependencies, open decisions, and
  exact governed-content digest.

### Verification, operator-credential amendment

- Status: passed for all thirteen approved criteria.
- Verified at: 2026-08-08T23:50:54Z.
- Command: `deno task verify:deploy`.
- Result: `13 passed | 0 failed`.
- Criterion mapping for the four added criteria: AC-F013-010 -> missing, empty,
  and whitespace token refusal test asserting the diagnostic names the
  environment variable and that no request was attempted; AC-F013-011 -> header
  and origin containment test asserting the token appears in no other header and
  not in the URL; AC-F013-012 -> upload and health exercised through an injected
  transport with no account, token, or network; AC-F013-013 -> transport
  rejection and a non-success platform response reported as failure with
  evidence.
- Red state: `9 passed | 4 failed` against a healthy typed baseline, the four
  failures being the newly mapped criteria against nonfunctional seams.
- OPEN-011 resolved: the framework verifies token sourcing, request
  construction, response interpretation, and failure handling. It holds no
  account and no token. Live platform acceptance is established by the
  operator's own first deployment, which AC-F013-003 already gates behind
  explicit confirmation.
- Residual risk, stated plainly: no deployment has been executed against Deno
  Deploy from this repository. The adapter's request shape reflects the
  documented API and is verified for construction, not for acceptance. The first
  operator deployment is the point at which the live contract is confirmed, and
  a mismatch there is a defect in this adapter rather than in the operator's
  project.

### Criterion mapping

- AC-F013-001 -> `deploy_test.ts` failed-verification upload-refusal test.
- AC-F013-002 -> `deploy_test.ts` plan target and value-free env-key test.
- AC-F013-003 -> `deploy_test.ts` first-deployment confirmation pause test.
- AC-F013-004 -> `deploy_test.ts` credential non-disclosure test across result,
  human output, and JSON output.
- AC-F013-005 -> `deploy_test.ts` upload, health, and smoke ordering test.
- AC-F013-006 -> `deploy_test.ts` failed required smoke-test evidence test.
- AC-F013-007 -> `deploy_test.ts` complete success-result location and time
  test.
- AC-F013-008 -> `deploy_test.ts` unchanged-revision idempotence test.
- AC-F013-009 -> `deploy_test.ts` sole-supported-target test.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T22:58:41Z.
- Base revision: `836cbc2` plus the approved SH-F013 requirement, mapped
  deployment tests, and typed nonfunctional seams.
- Commands: `deno task check:deploy` and `deno task test:deploy` using Deno
  `2.9.5` on macOS arm64.
- Result: `deno task check:deploy` passed, establishing a healthy typed
  baseline. `deno task test:deploy` reported `0 passed | 9 failed`. Every
  failure was an assertion failure identifying approved behavior absent from the
  seams, not a compilation error or unresolved import.

### Verification

- Status: passed for the governed command boundary.
- Verified at: 2026-08-07T23:03:43Z.
- Command: `deno task verify:deploy`, comprising `deno fmt --check`,
  `deno lint`, `deno task check:deploy`, and `deno task test:deploy`.
- Result: `9 passed | 0 failed`.
- Regression scope: `verify:framework`, `verify:create`, `verify:planning`,
  `verify:check`, `verify:cli`, `verify:test-command`, `verify:dev`, and
  `verify:skill` all passed at the same revision.
- Reuse: credential redaction reuses `redactSecurityData` from SH-F005 rather
  than introducing a second redaction implementation.
- Residual risk: OPEN-011 is unresolved. The command owns plan construction,
  the verification gate, the confirmation gate, smoke-result interpretation,
  idempotence, and result shaping, all verified against an injected
  `DeployAdapter`. No Deno Deploy adapter implementation exists, and no
  credentialed upload, live URL discovery, or live smoke test has been executed
  against the real platform. AC-F013-005, AC-F013-006, and AC-F013-007 are
  therefore closed only at the command boundary.
- Residual risk: `hollow deploy` has no host-supplied `DeployInventoryLoader`,
  matching the unimplemented SH-F008 evidence-loader boundary. The command
  cannot yet assemble a real project's deployment inventory.

### Verification, confirmation-binding correction

- Status: passed. AC-F013-003 is now satisfied by the designed protocol rather
  than by a weaker substitute.
- Verified at: 2026-08-09T01:22:12Z.
- Commands: `deno task verify:deploy`, `deno task verify:cli`, and
  `deno task verify:evidence`.
- Defect found while writing the CLI reference: the deploy handler accepted a
  bare `--confirm` flag, while the shared CLI advertises `--confirm <digest>`
  and implements a pending-operation protocol that binds confirmation to a
  specific plan. The handler bypassed that protocol, so a confirmation was not
  tied to the plan the operator reviewed and a stale plan could be applied.
- Correction: the handler now returns a pending operation carrying a digest of
  the deployment plan. The shared dispatcher refuses application when the
  supplied confirmation is missing, stale, or mismatched. Observed behavior: a
  first deployment prints `Confirm with --confirm <digest>` and refuses both an
  absent confirmation and a wrong digest.
- This strengthens AC-F013-003. The prior implementation would have accepted
  confirmation of a plan the operator never saw.

### Delivery

- Status: not applicable. No deployment has been authorized or attempted, and
  no Deno Deploy adapter exists to attempt one.

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: all acceptance criteria currently owned by SH-F013.
- Governed-content digest:
  `sha256:fae69fd6cd8942b587a814544f7a53f5574ca2c07628271ae2424b20b8395a78`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.

### Red-state evidence, platform migration baseline

- Status: failed as expected before implementation.
- Observed at: 2026-08-19T13:52:03Z.
- Command: `node --test tests/platform-migration-baseline.test.mjs`.
- Result: AC-F013-001 failed because no `Dockerfile` exists; the existing
  deployment adapter still targets the retired Deno deployment surface.
