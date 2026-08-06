---
schema: sgad-component/v0.2
id: SH-F005
title: Security and authorization boundaries
status: draft
risk: standard
source_sections:
  - "7"
  - "8"
depends_on:
  - SH-F002
  - SH-F003
open_decisions:
  - OPEN-007
  - OPEN-008
owners:
  - Sleepy Hollow maintainers
---

# Security and authorization boundaries

## Purpose

Provide broadly safe HTTP defaults and neutral integration points without
turning Sleepy Hollow into an identity product or imposing authentication on
public applications.

## In scope

- Neutral `AuthProvider` and `Principal` compatibility boundaries.
- Explicit per-route authentication and authorization declarations.
- Secure headers, production CORS, request limits, and configurable rate limits.
- Secret and credential redaction.
- Verification metadata for required guards and protections.

## Requirements

Applications may explicitly choose no authentication, project-defined user
authentication, an external identity provider, API keys, signed bearer tokens,
service credentials, or another reviewed mechanism. The framework shall not
ship a mandatory built-in identity model in the first release.

Authentication shall produce a neutral principal or no principal. Authorization
shall remain explicit endpoint behavior through a declared guard or policy.
Protected endpoints shall define `401` and `403` behavior. Framework defaults
shall include safe headers, explicit production CORS, body limits, bounded
pagination, configurable rate limiting, request IDs, and redaction of secrets and
authorization material.

## Acceptance criteria

- AC-F005-001: An application with an explicit `none` authentication decision
  runs without an authentication provider or fabricated principal.
- AC-F005-002: A project-defined provider can authenticate a request into the
  neutral principal shape without changing route business logic.
- AC-F005-003: A protected route rejects a missing or invalid identity with its
  declared RFC 9457 `401` behavior.
- AC-F005-004: An authenticated principal lacking permission receives the
  route's declared RFC 9457 `403` behavior.
- AC-F005-005: A declared authorization guard runs before protected handler side
  effects.
- AC-F005-006: Production startup fails with an actionable diagnostic when CORS
  or another required production security setting is unresolved.
- AC-F005-007: Default logs and diagnostics redact secrets, authorization
  headers, session material, and raw credentials.
- AC-F005-008: Configured rate limiting produces deterministic allow and reject
  behavior and a standards-compatible client response.
- AC-F005-009: Route metadata lets independent verification detect when approved
  requirements demand protection but no corresponding guard is configured.
- AC-F005-010: No framework API requires email/password, sessions, JWTs, OIDC,
  API keys, or another single authentication model for every project.

## Out of scope

- Built-in email/password, passwordless, social-login, or OIDC products.
- Custom cryptographic protocols or credential stores.
- Centralized identity and token exchange for services.

## Dependencies and assumptions

Authentication designs remain application requirements. OPEN-007 and OPEN-008
must validate the principal boundary and credible rate limiting on Deno Deploy.

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
