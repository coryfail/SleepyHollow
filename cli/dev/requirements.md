---
id: SH-F015
title: Local development command
status: draft
source_sections:
  - "12"
  - "14"
depends_on:
  - SH-F001
  - SH-F002
  - SH-F012
open_decisions: []
---

# Local development command

## Purpose

Run a SleepyHollow application locally with fast, deterministic feedback while
routes, schemas, and configuration change.

## In scope

- `hollow dev` startup and shutdown.
- Development-mode configuration.
- Route and configuration change handling.
- Human and structured lifecycle diagnostics.

## Requirements

`hollow dev` shall start the canonical runtime in development mode and shall work
for a newly created application before custom endpoints exist. It shall validate
configuration and route discovery before accepting traffic. Valid source changes
shall become active through a documented reload or restart behavior. Invalid
changes shall produce diagnostics without silently serving code as though the
change succeeded.

## Acceptance criteria

- AC-F015-001: Running `hollow dev` in a valid newly created project starts the
  local application and reports its listening URL.
- AC-F015-002: The command uses development-mode configuration and does not load
  production-only credentials implicitly.
- AC-F015-003: A valid route change becomes active through the documented reload
  or restart behavior without requiring an undocumented manual cleanup step.
- AC-F015-004: An invalid route or configuration change produces an actionable
  diagnostic and is never reported as successfully active.
- AC-F015-005: Startup failure returns nonzero and identifies the affected route,
  file, or configuration key.
- AC-F015-006: An interrupt stops the server cleanly and releases its listening
  resources.
- AC-F015-007: Structured mode emits versioned startup, reload, diagnostic, and
  shutdown events without requiring automation to parse human prose.

## Out of scope

- Production process supervision.
- A browser-based development dashboard.
- Model invocation or skill orchestration.

## Dependencies and assumptions

The reload implementation may be selected during development, but its observable
behavior must satisfy the same route inventory and startup validation as a fresh
process.
