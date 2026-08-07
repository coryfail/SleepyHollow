---
schema: sgad-component/v0.2
id: SH-F013
title: Deno Deploy delivery
status: approved
risk: standard
source_sections:
  - "3.7"
  - "14"
depends_on:
  - SH-F008
  - SH-F010
  - SH-F011
  - SH-F012
open_decisions:
  - OPEN-011
owners:
  - Sleepy Hollow maintainers
---

# Deno Deploy delivery

## Purpose

Provide one excellent, deterministic path from a verified Sleepy Hollow
application to a live Deno Deploy service with post-deployment evidence.

## In scope

- Local Deno development compatibility.
- Environment and credential validation.
- Deployment preview or plan.
- Full verification before upload.
- Deployment through `hollow deploy`.
- Health and representative-operation smoke tests.
- Live URL, contract locations, and structured deployment results.

## Requirements

The CLI shall own deterministic build, validation, upload, and smoke-test steps.
The official skill may guide and interpret them but shall not bypass them. A
deployment plan shall identify the target, application revision, environment
changes, contract changes, and checks before external mutation.

The first external deployment and materially risky production changes require
explicit user confirmation in the guided workflow. Credentials and environment
values shall be handled without inclusion in logs, generated files, or command
results. A deployment is not successful until required smoke tests pass.

## Acceptance criteria

- AC-F013-001: `hollow deploy` refuses to upload when required full verification
  fails and reports the blocking check evidence.
- AC-F013-002: A deployment plan identifies the Deno Deploy target, revision,
  environment-key changes without values, contract changes, and planned smoke
  tests before upload.
- AC-F013-003: The guided first external deployment pauses for explicit
  confirmation after presenting the plan.
- AC-F013-004: Valid deployment credentials are consumed without appearing in
  logs, generated artifacts, diagnostics, or structured output.
- AC-F013-005: A successful upload is followed by a live health check and one
  configured representative API smoke test.
- AC-F013-006: A failed required smoke test returns a failed deployment result
  that includes the live revision and actionable failure evidence rather than a
  false success.
- AC-F013-007: Successful human and JSON results include the live URL, deployed
  revision, OpenAPI location, documentation location, smoke-test evidence, and
  completion time.
- AC-F013-008: Repeating deployment for an unchanged verified revision produces
  a predictable no-change or idempotent deployment result.
- AC-F013-009: The first-release deployment API exposes Deno Deploy as its sole
  production adapter and does not imply support for unimplemented targets.

## Out of scope

- Additional cloud adapters.
- Standalone executable deployment.
- Coordinated multi-service deployment.
- Automatic rollback behavior not supported by the selected target.

## Dependencies and assumptions

OPEN-011 must validate Deno Deploy setup, safe credentials, upload behavior, URL
discovery, and reliable smoke tests against the current platform API.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T22:36:53Z.
- Approved criteria: AC-F013-001 through AC-F013-009.
- Governed-content digest:
  `sha256:fc354689a9b796f3be3563516920e8f443069a57a8f4a9bd5bd7d774d13996f2`.
- Decision source: Claude conversation; direct response `Approve` after review
  of the requirement scope, bounded criteria, dependencies, open decisions, and
  exact governed-content digest.

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

### Delivery

- Status: not applicable. No deployment has been authorized or attempted, and
  no Deno Deploy adapter exists to attempt one.
