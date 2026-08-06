---
schema: sgad-component/v0.2
id: SH-F003
title: Schemas, validation, and errors
status: draft
risk: standard
source_sections:
  - "6.2"
  - "6.5"
  - "8"
depends_on:
  - SH-F002
open_decisions:
  - OPEN-002
owners:
  - Sleepy Hollow maintainers
---

# Schemas, validation, and errors

## Purpose

Make route boundaries explicit and safe by using the same schema definitions for
runtime validation, verification, and generated contracts.

## In scope

- Path, query, header, and body input validation.
- Declared response-body validation.
- Unknown-field rejection and request-body limits.
- RFC 9457 Problem Details errors.
- Actionable, machine-readable validation diagnostics.

## Requirements

Every declared request location shall be validated before handler behavior uses
it. Unknown input fields shall be rejected by default. Routes accepting a body
shall use an explicit size limit. Declared successful and error responses shall
be validated at the framework boundary where configured.

Errors exposed to clients shall use RFC 9457 and shall not disclose stack traces,
secrets, internal KV keys, or implementation details in production. Schema
definitions shall normalize into one representation consumed by runtime and
contract tooling rather than being reauthored separately.

## Acceptance criteria

- AC-F003-001: Valid path, query, header, and body values reach the handler in
  their schema-defined typed representation.
- AC-F003-002: Invalid input is rejected before handler side effects and returns
  an RFC 9457 response identifying the invalid location and field.
- AC-F003-003: An undeclared input field is rejected by default with an
  actionable client error.
- AC-F003-004: A body exceeding the route's configured limit is rejected before
  full application processing.
- AC-F003-005: A handler response that violates its declared schema is detected
  and is not returned as a successful production response.
- AC-F003-006: Production Problem Details responses omit stack traces, secrets,
  authorization values, internal KV keys, and implementation-only messages.
- AC-F003-007: Human and JSON diagnostics identify the route, schema location,
  violated rule, and safe correction path.
- AC-F003-008: Runtime validation and contract generation consume the same
  normalized schema definition in a consistency test.

## Out of scope

- Business-rule validation that belongs in an application handler.
- A proprietary schema language without TypeScript inference.

## Dependencies and assumptions

OPEN-002 will select a schema approach based on TypeScript inference, runtime
correctness, error quality, and OpenAPI compatibility.

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
