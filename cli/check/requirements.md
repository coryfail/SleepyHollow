---
id: SH-F008
title: Independent verification
status: draft
source_sections:
  - "3.6"
  - "8"
  - "10"
  - "11.2"
  - "11.3"
depends_on:
  - SH-F002
  - SH-F003
  - SH-F004
  - SH-F005
  - SH-F006
  - SH-F007
open_decisions:
  - OPEN-006
---

# Independent verification

## Purpose

Make `hollow check` an independent trust boundary that verifies agent and human
work from repository evidence rather than accepting an implementation process's
claim of completion.

## In scope

- Type checking and test execution.
- Requirements-to-test traceability.
- Route, method, schema, security, index, and bounded-query checks.
- OpenAPI and generated-client consistency.
- Data and breaking-contract change checks.
- Human-readable and structured JSON diagnostics.
- Endpoint-local and whole-application verification modes.

## Requirements

`hollow check` shall derive its result from requirements, source, tests,
configuration, and generated artifacts. It shall report violations with stable
codes and enough context for a human or agent to locate the route, requirement,
criterion, field, index, or configuration key and choose a safe correction.

Verification shall fail for missing criterion coverage, route or method drift,
schema gaps, stale generated artifacts, index-incompatible or unbounded access,
missing required authorization guards, unsafe security configuration, pending
data decisions, and unreviewed breaking contract changes. An endpoint may become
`verified` only after all applicable checks pass.

## Acceptance criteria

- AC-F008-001: `hollow check` returns success for a conforming project and a
  nonzero status when any required check fails.
- AC-F008-002: Human output summarizes failures and names their affected files,
  routes, requirements, criteria, or configuration keys.
- AC-F008-003: `hollow check --json` emits a versioned structure with stable
  diagnostic codes, severity, location, evidence, and safe correction guidance.
- AC-F008-004: A route or method that differs from its approved requirement
  causes verification to fail.
- AC-F008-005: Missing request or response schema coverage causes verification to
  fail and identifies the uncovered boundary.
- AC-F008-006: Missing criterion mapping or a failing mapped test prevents
  `verified` status.
- AC-F008-007: An unbounded query, incompatible index, or unsafe read-modify-write
  pattern is detected with the affected data operation.
- AC-F008-008: A protected requirement without its declared authorization guard
  causes verification to fail.
- AC-F008-009: Stale OpenAPI or client output and supported breaking contract
  changes are detected before release.
- AC-F008-010: Endpoint-local verification includes affected shared dependencies
  or clearly escalates to the full check when safe impact analysis is impossible.
- AC-F008-011: The verifier cannot mark its own failing checks successful through
  endpoint source metadata or an agent-authored completion message.

## Out of scope

- Proving unspecified product behavior.
- Silently applying destructive data or contract changes.

## Dependencies and assumptions

Each underlying feature must expose normalized metadata rather than requiring the
verifier to guess behavior from arbitrary implementation code.
