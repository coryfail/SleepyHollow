---
id: SH-F016
title: Test command
status: draft
source_sections:
  - "11"
  - "12"
depends_on:
  - SH-F006
  - SH-F007
open_decisions:
  - OPEN-006
---

# Test command

## Purpose

Give humans and agents one deterministic command for running SleepyHollow tests
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
