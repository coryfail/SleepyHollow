---
schema: sgad-component/v0.2
id: SH-F001
title: Project creation
status: verified
risk: standard
source_sections:
  - "3.1"
  - "12"
  - "15.1"
depends_on:
  - SH-F019
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Project creation

## Purpose

Give humans and agents one safe command that creates a valid Sleepy Hollow
application before any application-specific endpoint exists.

## In scope

- `hollow create <project-name>`.
- A minimal Deno project and typed Sleepy Hollow configuration.
- Empty API, requirements, and generated-output locations.
- Instructions for using the official Sleepy Hollow skill.
- Human-readable and machine-readable creation results.

## Requirements

The command shall create a deterministic project structure with the files needed
to type-check, test, run framework validation, and begin requirements planning.
It shall validate the project name and destination before writing, avoid hidden
destructive changes, and provide actionable failures. The generated application
shall not contain example endpoints presented as approved product behavior.

The scaffold shall make the intended locations for `requirements/application.md`,
endpoint-local requirements, runtime configuration, API routes, models, tests,
and generated artifacts evident. It shall include concise guidance for activating
or installing the official skill in supported agent environments.

### Capture-aware test setup

A generated project shall include test setup that enables SH-F019 runtime
evidence capture and persists the artifact to the declared generated location,
so a created project can produce the observed evidence that `hollow check`
requires.

Without this, a newly created project yields no capture artifact, and its first
`hollow check` fails closed for missing evidence rather than for any defect in
the project.

## Acceptance criteria

- AC-F001-001: Given a valid name and writable empty destination, `hollow create`
  creates the project and exits successfully.
- AC-F001-002: A newly created project passes its documented type-check and
  framework validation commands before any endpoint is added.
- AC-F001-003: The scaffold contains a typed SleepyHollow configuration, an API
  location, a requirements location, and a generated-artifact location.
- AC-F001-004: The scaffold explains how to begin the official skill-guided
  planning workflow without requiring a generated endpoint.
- AC-F001-005: An invalid project name or unsafe destination produces a nonzero
  exit status and does not leave a partially overwritten project.
- AC-F001-006: Creation refuses to overwrite existing user files unless a future
  explicitly documented option authorizes each overwrite.
- AC-F001-007: `hollow create --json` returns a stable result containing the
  project path, created files, next actions, and any diagnostics.
- AC-F001-008: Repeating the command against the created destination fails safely
  and preserves the existing project.
- AC-F001-009: Following the supported installation procedure makes the
  `hollow` CLI available and reports its installed version without requiring a
  source checkout.

## Out of scope

- Generating application-specific endpoints.
- Invoking or managing an AI model.
- Selecting authentication or a multi-service architecture without planning.

## Dependencies and assumptions

The CLI distribution and installation mechanism will be selected during initial
implementation. That choice must not change the observable scaffold contract.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T20:21:37Z.
- Approved criteria: AC-F001-001 through AC-F001-011.
- Governed-content digest:
  `sha256:e060e03477a9e6d1c4f2e23205e16f7a0082d4ca3eb04d9ee5e19e8ffd3cd7f8`.
- Decision source: Claude conversation; direct response `Approve` after review
  of the capture-aware test setup amendment and the exact governed-content digest.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T12:47:53Z.
- Approved criteria: AC-F001-001 through AC-F001-009.
- Governed-content digest:
  `sha256:5d0236364f999f012df2182a85f1d5c3c1c55b6cccbe4e19f21bc8a675e67068`.
- Decision source: Codex conversation; direct response `Approved` after review
  of the requirement path, bounded criteria, and exact governed-content digest.

### Verification, capture-scaffold amendment

- Status: passed for all eleven approved criteria.
- Verified at: 2026-08-08T20:24:33Z.
- Command: `deno task verify:create`.
- Result: `11 passed | 0 failed`.
- End-to-end evidence: `hollow create demo`, then the generated project's own
  `deno task test`, then `hollow check` against that project reported
  `Independent verification passed`. The capture artifact at
  `generated/capture.json` was produced by the project's own test run rather
  than authored by a fixture.
- Scaffold decision recorded: the generated capture setup is self-contained
  rather than importing the framework, because no package is published yet and
  a scaffold that imports an unpublished specifier cannot resolve. Once SH-F020
  publishes, the scaffold should import the SH-F019 helpers instead of carrying
  its own copy.
- Test correction: AC-F001-010 initially asserted the specific framework import
  identifiers, which encoded an implementation choice rather than the approved
  criterion. It was rewritten to assert that the setup creates a session,
  declares the capture schema, targets the declared generated location, and
  exposes persistence. The criterion is unchanged and the assertion is no
  weaker.
- Permission correction: the scaffold read the revision from the environment at
  module load, which failed under the generated test task's read and write
  permissions. The read is now permission-safe, so the scaffold needs no
  environment access.

### Criterion mapping

- AC-F001-001 -> `create_test.ts` successful atomic creation test.
- AC-F001-002 -> `create_test.ts` generated-project verification-command test.
- AC-F001-003 -> `create_test.ts` typed configuration and canonical-location
  test.
- AC-F001-004 -> `create_test.ts` official-skill planning guidance test.
- AC-F001-005 -> `create_test.ts` invalid-name and unsafe-destination test.
- AC-F001-006 -> `create_test.ts` existing-file overwrite-refusal test.
- AC-F001-007 -> `create_test.ts` stable JSON result and diagnostic test.
- AC-F001-008 -> `create_test.ts` repeat-attempt preservation test.
- AC-F001-009 -> `create_test.ts` compiled standalone CLI version test.
- AC-F001-010: A generated project includes test setup that creates a capture
  session and persists its artifact to the declared generated location.
- AC-F001-011: Running the generated project's own test task produces a capture
  artifact at the declared generated location.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T15:14:26Z, with the standalone runtime prerequisite
  revalidated outside the network sandbox immediately afterward.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F001 requirement, mapped creation tests, typed nonfunctional seams, pinned
  dependency lock, and the verified framework working tree.
- Commands: `deno task check:create` and `deno task test:create` using Deno
  `2.9.5` on macOS arm64. The valid red rerun allowed Deno's first-time download
  of its matching compile runtime.
- Runtime-test digest:
  `sha256:c07b575faafaf8013f01a18832194e5fdc2cdefcf8ef39094dba7b1c8d3706d5`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Result: creation type checking passed and creation passed 0/9. On the valid
  rerun, standalone compilation completed and its binary failed only because
  `--version` reached the deliberate CLI seam.
- Expected failure: every creation criterion reached the healthy runner and
  failed through `SH_CREATE_NOT_IMPLEMENTED`; no dependency, assertion-runner,
  permission, or unrelated regression failure obscured the missing approved
  behavior. The earlier sandboxed compile download failure is explicitly
  excluded from red evidence.

### Verification

- Status: passed.
- Verified at: 2026-08-07T15:17:48Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the declared
  working tree.
- Approved requirement digest:
  `sha256:5d0236364f999f012df2182a85f1d5c3c1c55b6cccbe4e19f21bc8a675e67068`.
- Product implementation manifest:
  `working-tree:sha256:de690a4fe42299b5a1ea5d1c6c52a539b5909340d0b3e90a20ee3c07597d6c20`
  across 57 sorted framework and project-creation source, fixture, test,
  configuration, dependency-lock, repository-control, and CI files. Each
  record is `<relative-path>\0<file-sha256>\n` before hashing the sorted stream.
- Current runtime-test digest:
  `sha256:c07b575faafaf8013f01a18832194e5fdc2cdefcf8ef39094dba7b1c8d3706d5`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Commands: `deno task verify:create`, `deno task verify:framework`,
  `git diff --check`, and the canonical `npm run verify` from `website/`.
- Results: creation passed 9/9; the generated scaffold independently passed
  its documented format, lint, type, test, and structure verifier; and the
  compiled standalone binary reported `hollow 0.1.0`. Framework formatting,
  linting, type checking, and all 48 component tests with thirteen nested steps
  passed.
- Independent repository results: structural 16/16, links 1/1, repository
  consistency 9/9, React 8/8, TypeScript/build, and Playwright/Axe 66/66 across
  Chromium, Firefox, and WebKit passed. The repository-consistency test digest
  remained
  `sha256:a909a928e37ea21a2f7af88604948f97fc9afbf162d4eef24c73929fa96215d6`.
- Verified behavior includes atomic staging and rename, strict safe-name and
  existing-destination refusal, deterministic files, a typed empty
  configuration, canonical planning locations, official-skill guidance,
  stable JSON success/failure surfaces, repeat preservation, and a self-
  contained compiled CLI artifact. No example endpoint is generated.
- Residual boundary: no package registry publication or end-user installer was
  delivered; the verified distribution artifact is the Deno-compiled standalone
  executable. No commit, push, publication, deployment, or other delivery was
  performed.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
