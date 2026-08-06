---
schema: sgad-component/v0.2
id: SH-F010
title: API contracts and typed clients
status: draft
risk: standard
source_sections:
  - "3.7"
  - "10"
depends_on:
  - SH-F002
  - SH-F003
open_decisions:
  - OPEN-009
owners:
  - Sleepy Hollow maintainers
---

# API contracts and typed clients

## Purpose

Generate trustworthy, consumable API outputs from the same normalized route and
schema definitions used by the runtime.

## In scope

- OpenAPI specification and local API documentation.
- Framework-neutral typed TypeScript client.
- Typed requests, responses, and RFC 9457 errors.
- Configurable base URL, fetch implementation, and authentication injection.
- Staleness and supported breaking-change analysis.

## Requirements

Contract generation shall derive from normalized runtime route, schema, security,
and error definitions. It shall not require duplicating application contracts in
a separate generator-only format. The generated client shall have minimal
dependencies and work for frontends and service-to-service calls without assuming
one authentication mechanism.

Breaking-change analysis shall detect removed routes or methods, newly required
input, removed response properties, narrowed types, changed errors, changed
authentication requirements, and changed pagination behavior.

## Acceptance criteria

- AC-F010-001: `hollow generate` produces a valid OpenAPI document containing
  every implemented route and method from the normalized route inventory.
- AC-F010-002: OpenAPI request, response, error, and security schemas match the
  runtime definitions in consistency tests.
- AC-F010-003: Local API documentation renders the generated contract without
  requiring a production deployment.
- AC-F010-004: The generated TypeScript client exposes typed inputs, success
  responses, and RFC 9457 errors for every implemented operation.
- AC-F010-005: A consumer can configure the client's base URL and fetch
  implementation.
- AC-F010-006: A consumer can inject authentication without the client requiring
  a specific identity or token model.
- AC-F010-007: Configured runtime response validation detects a server response
  that violates the generated client contract.
- AC-F010-008: Generation is deterministic for unchanged inputs and verification
  detects edited or stale generated artifacts.
- AC-F010-009: Each supported breaking-change category produces an actionable
  report naming the affected operation and contract element.
- AC-F010-010: Generated clients can represent separate service contracts without
  permitting direct access to another service's persistence.

## Out of scope

- Clients for languages other than TypeScript in the first release.
- An authentication SDK or prescribed token storage.

## Dependencies and assumptions

OPEN-009 selects a minimal client shape suitable for browsers, servers, and
generated service consumers.

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
