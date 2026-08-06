---
id: SH-F002
title: File-based routing runtime
status: draft
source_sections:
  - "6.1"
  - "6.6"
  - "12"
depends_on:
  - SH-F001
open_decisions:
  - OPEN-001
---

# File-based routing runtime

## Purpose

Provide a small, explicit HTTP runtime whose file layout and route behavior are
predictable to humans, agents, and contract tooling.

## In scope

- Static and dynamic file-based routes.
- HTTP method dispatch.
- Explicit route modules and custom handlers.
- Normalized route metadata for downstream tooling.
- Local development execution through `hollow dev`.

## Requirements

Directory segments shall map to URL segments, and dynamic directories such as
`[id]` shall map to named path parameters. A route module shall explicitly
declare its supported methods, schemas, handlers, security expectations, and
contract metadata. Unsupported methods and route collisions shall be detected
deterministically.

The canonical module API shall remain narrow and shall allow purpose-specific
handlers without forcing generated CRUD. Route discovery and dispatch shall not
depend on implicit package scanning or hidden activation.

## Acceptance criteria

- AC-F002-001: A static route module is discovered and invoked for its matching
  path and declared HTTP method.
- AC-F002-002: A dynamic directory segment supplies the decoded path value under
  the declared parameter name.
- AC-F002-003: A request for an unknown route returns the framework's normalized
  not-found response.
- AC-F002-004: A known path with an unsupported method returns the normalized
  method-not-allowed response and advertises allowed methods.
- AC-F002-005: Conflicting route definitions fail startup or validation with a
  diagnostic naming every conflicting file and route.
- AC-F002-006: A custom handler can return behavior not expressible as CRUD while
  retaining schema, security, and contract metadata.
- AC-F002-007: Route discovery produces one deterministic normalized route
  inventory for runtime, verification, and contract generation.
- AC-F002-008: `hollow dev` starts a generated empty application and reloads or
  restarts predictably after a valid route change.

## Out of scope

- A general-purpose middleware ecosystem.
- Automatic CRUD generation.
- Service discovery or distributed routing.

## Dependencies and assumptions

The exact route-module API remains OPEN-001. Its prototype must optimize for
explicitness, TypeScript inference, and reliable agent use.
