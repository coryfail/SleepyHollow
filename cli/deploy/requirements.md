---
id: SH-F013
title: Deno Deploy delivery
status: draft
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
---

# Deno Deploy delivery

## Purpose

Provide one excellent, deterministic path from a verified SleepyHollow
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
