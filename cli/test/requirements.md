---
schema: sgad-component/v0.2
id: SH-F016
title: Test command
status: draft
risk: standard
source_sections:
  - "11"
  - "12"
depends_on:
  - SH-F006
  - SH-F007
open_decisions:
  - OPEN-006
owners:
  - Sleepy Hollow maintainers
---

# Test command

## Purpose

Give humans and agents one deterministic command for running Sleepy Hollow tests
and reporting their acceptance-criterion coverage.

## In scope

- `hollow test` for the complete application.
- Targeted endpoint or component test selection.
- Isolated test-mode application and Deno KV execution.
- Human and JSON results with criterion mapping.

## Requirements

The command shall invoke the canonical test utilities and Deno test runner in
test mode. It shall support a full run and documented targeted selection without
changing the meaning of a test. Test results shall distinguish passing, failing,
skipped, and unmapped behavior and shall retain stable acceptance-criterion IDs.

`hollow test` provides test evidence; it does not independently grant `verified`
status. That decision remains the responsibility of `hollow check` after all
other required evidence is evaluated.

## Acceptance criteria

- AC-F016-001: `hollow test` runs the complete project test suite in test mode
  with isolated Deno KV state and returns zero only when all required tests pass.
- AC-F016-002: A documented target selects one endpoint or component and its
  required shared test dependencies without running unrelated independent tests.
- AC-F016-003: A failing test returns nonzero and reports its file, test name,
  mapped criterion IDs, and failure evidence.
- AC-F016-004: Human output distinguishes passing, failing, skipped, and unmapped
  tests and summarizes criterion coverage.
- AC-F016-005: `hollow test --json` emits a versioned result containing test
  status, duration, criterion mappings, and diagnostics.
- AC-F016-006: Repeated tests do not share application or Deno KV state unless a
  test explicitly declares a shared fixture.
- AC-F016-007: A passing test run alone does not change a requirement from
  `approved` to `verified`.

## Out of scope

- Replacing Deno's test runner with a proprietary runner.
- Silently generating or editing acceptance tests.
- Performing contract, security, or deployment verification owned by
  `hollow check`.

## Dependencies and assumptions

OPEN-006 determines safe targeted-check impact analysis. When safe selection is
not possible, the command shall escalate to the broader relevant test set.

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
