---
id: SH-F012
title: Configuration and observability
status: draft
source_sections:
  - "8"
  - "13"
depends_on:
  - SH-F002
  - SH-F005
open_decisions: []
---

# Configuration and observability

## Purpose

Make application configuration explicit at startup and produce safe operational
signals that work locally, in tests, and in hosted environments.

## In scope

- Typed environment configuration and startup validation.
- Development, test, preview, and production modes.
- Local environment-file support.
- Structured JSON logs and request IDs.
- Health and conditional readiness endpoints.
- Secret and sensitive-data redaction.

## Requirements

Configuration shall be typed and validated before the application begins serving
requests. Local environment files may be loaded in documented non-production
modes. Production shall not rely on an implicit local environment file.

Runtime logs shall be structured JSON and carry a request ID through request
handling. A health endpoint shall report process health. A readiness endpoint
shall be available when serving depends on external resources and shall reflect
whether those dependencies are ready. Logs shall omit secrets, authorization
headers, sessions, raw credentials, and sensitive request bodies by default.

## Acceptance criteria

- AC-F012-001: A valid typed configuration starts in each documented runtime mode
  and exposes the resolved non-secret mode metadata.
- AC-F012-002: Missing, malformed, or mode-incompatible required configuration
  stops startup with a diagnostic naming the configuration key and expected form.
- AC-F012-003: A documented local environment file is loaded in allowed local
  modes and is not implicitly loaded in production.
- AC-F012-004: Each handled request has a request ID; a valid incoming ID is
  preserved when safe, otherwise a new ID is generated.
- AC-F012-005: Runtime log records are valid structured JSON and include level,
  timestamp, event, mode, and request ID when request-scoped.
- AC-F012-006: Logs redact secrets, authorization headers, session material, raw
  credentials, and configured sensitive fields by default.
- AC-F012-007: The health endpoint distinguishes a running process from an
  unavailable process without exposing sensitive configuration.
- AC-F012-008: When external readiness dependencies are declared, the readiness
  endpoint reports not-ready until each required dependency is available.
- AC-F012-009: Security and verification diagnostics can consume normalized
  configuration metadata without reading secret values.

## Out of scope

- A hosted log aggregation product.
- Distributed tracing infrastructure.
- Returning secrets through diagnostics or health endpoints.

## Dependencies and assumptions

Service-to-service request-ID propagation is refined by SH-F014. Hosted
environment configuration is refined by SH-F013.
