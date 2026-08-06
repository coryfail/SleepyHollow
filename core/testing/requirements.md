---
schema: sgad-component/v0.2
id: SH-F007
title: Testing and acceptance-criterion traceability
status: draft
risk: standard
source_sections:
  - "3.6"
  - "5.3"
  - "11.1"
  - "11.3"
  - "20"
depends_on:
  - SH-F003
  - SH-F004
  - SH-F006
open_decisions:
  - OPEN-005
  - OPEN-006
owners:
  - Sleepy Hollow maintainers
---

# Testing and acceptance-criterion traceability

## Purpose

Turn approved behavior into deterministic test evidence through an observable
red-green TDD loop and explicit criterion mapping.

## In scope

- Endpoint acceptance-test generation from approved criteria.
- Stable criterion metadata in tests.
- Expected pre-implementation failure capture.
- Isolated application and Deno KV test utilities.
- Typed requests, data seeding, principals, Problem Details assertions, and
  generated-client testing.
- Traceability reports for criteria and tests.

## Requirements

Tests shall be generated only for approved endpoint requirements. Every approved
criterion shall map to at least one test, and every generated acceptance test
shall identify the approved behavior it covers. One test may cover multiple
criteria when the mapping remains explicit.

The implementation loop shall run tests before code, distinguish expected
missing-behavior failures from a broken baseline, and stop on unexpected baseline
failures. The skill or implementation process shall not silently weaken or remove
tests derived from approved criteria. Behavioral test changes require user
visibility and renewed approval when intended behavior changes.

## Acceptance criteria

- AC-F007-001: Test generation refuses a `draft` requirement and names the
  approval state preventing generation.
- AC-F007-002: Every approved acceptance criterion appears in at least one test's
  name or machine-readable metadata.
- AC-F007-003: Traceability reports criteria with passing tests, failing tests,
  no mapped tests, and tests with no approved criterion.
- AC-F007-004: The pre-implementation run records failure caused by missing
  approved behavior before implementation begins.
- AC-F007-005: An unrelated type, startup, dependency, or baseline failure stops
  the TDD loop and is reported separately from expected red-state evidence.
- AC-F007-006: Test utilities start an application with isolated Deno KV state
  and deterministic cleanup.
- AC-F007-007: Tests can issue typed requests, seed data, supply project-defined
  principals or credentials, and assert RFC 9457 responses.
- AC-F007-008: Generated clients can be exercised against the test application
  without a separately deployed environment.
- AC-F007-009: Removing or weakening a mapped test is surfaced in the
  traceability report and cannot preserve `verified` status silently.
- AC-F007-010: A feature cannot become `verified` while any approved criterion
  lacks a passing mapped test.

## Out of scope

- Cryptographically locked tests.
- Claiming that generated tests prove unspecified behavior.

## Dependencies and assumptions

OPEN-005 selects transparent criterion metadata compatible with Deno's test
runner. OPEN-006 must balance fast endpoint checks with shared regression safety.

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
