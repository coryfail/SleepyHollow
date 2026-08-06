---
schema: sgad-component/v0.2
id: SH-F011
title: CLI and diagnostics
status: draft
risk: standard
source_sections:
  - "12"
depends_on:
  - SH-F001
  - SH-F007
  - SH-F008
  - SH-F010
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# CLI and diagnostics

## Purpose

Provide one small, predictable command surface that humans, agents, and
automation can invoke without parsing unstable prose or accepting hidden changes.

## In scope

- `hollow create`, `dev`, `test`, `check`, `generate`, and `deploy`.
- Consistent help, exit status, human output, and `--json` output.
- Stable diagnostic codes and precise affected-object locations.
- Preview of data and contract changes before application.

## Requirements

The CLI shall orchestrate the underlying feature implementations rather than
reimplementing their logic. Every command consumed programmatically shall support
structured output. Required failures shall return nonzero status. Diagnostics
shall name affected requirements, criteria, routes, fields, indexes, files, or
configuration keys and shall include a safe correction path when known.

Commands shall avoid hidden destructive behavior. Data or contract changes shall
be previewed before application. The first-release CLI shall not contain commands
for invoking or managing AI models; that responsibility belongs to the official
skill and its host.

## Acceptance criteria

- AC-F011-001: Top-level help lists exactly the supported first-release commands
  with concise descriptions and command-specific help.
- AC-F011-002: Each command returns zero only when its required operation
  succeeds and returns nonzero for a required failure.
- AC-F011-003: Each programmatically consumed command supports `--json` with a
  versioned result envelope and stable diagnostic codes.
- AC-F011-004: Human and JSON modes report the same underlying successes,
  warnings, and failures without requiring prose parsing for automation.
- AC-F011-005: A diagnostic identifies every applicable requirement, criterion,
  route, field, index, file, or configuration key involved in the failure.
- AC-F011-006: An unknown command or invalid option fails without changing the
  project and suggests valid usage.
- AC-F011-007: A pending destructive data or contract operation is shown as a
  preview and is not applied without the command's explicit confirmation path.
- AC-F011-008: The CLI dispatches test, check, generation, and deployment behavior
  to their canonical feature APIs rather than maintaining divergent rules.
- AC-F011-009: No first-release command accepts a model name, manages model
  credentials, or presents the CLI as an agent runtime.

## Out of scope

- Model invocation, routing, and token accounting.
- A universal plugin or extension marketplace.
- Interactive behavior that cannot be represented in structured automation.

## Dependencies and assumptions

Feature-specific command behavior remains governed by the corresponding feature
requirement. This feature owns consistent invocation and diagnostics.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: pending exact-content approval.
- Approver, time, bounded criteria, digest, and decision source: pending.

### Criterion mapping

- Status: pending approval and governed tests.

### Red-state evidence

- Status: pending approved test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
