---
id: SH-F014
title: Optional multi-service projects
status: draft
source_sections:
  - "9"
  - "15.1"
depends_on:
  - SH-F001
  - SH-F005
  - SH-F010
  - SH-F012
open_decisions: []
---

# Optional multi-service projects

## Purpose

Allow justified applications to use independently deployable services without
making microservices the default or turning SleepyHollow into an orchestration
platform.

## In scope

- Planning one API, multiple services, or extraction-ready boundaries.
- Separate requirements, runtime configuration, API, tests, contract,
  deployment, and Deno KV ownership per service.
- Cross-service access through generated clients and approved authentication.
- Request deadlines, cancellation, request-ID propagation, and documented
  partial failures.

## Requirements

Planning shall recommend one API unless independent ownership, scaling,
deployment, isolation, or lifecycle needs justify multiple services. When
multiple services are approved, every service shall be independently describable,
testable, deployable, and responsible for its own data.

A service shall never read another service's Deno KV database. Cross-service
access shall use the owning service's API contract and generated client with the
project-approved service-authentication approach. Cross-service behavior shall
not imply atomic transactions, and partial failure shall be documented in the
calling feature's requirements.

## Acceptance criteria

- AC-F014-001: Planning records one of the three supported architecture choices
  and the evidence justifying any multi-service choice.
- AC-F014-002: Scaffolding two approved services gives each separate application
  requirements, configuration, API structure, tests, contract output, deployment
  configuration, and Deno KV database.
- AC-F014-003: Static and runtime verification prevent or flag one service's
  direct access to another service's Deno KV database.
- AC-F014-004: A service calls another through its generated typed client using
  the authentication mechanism approved in project requirements.
- AC-F014-005: An outbound service request propagates the request ID and applies
  an explicit deadline and cancellation signal.
- AC-F014-006: Timeout, unavailable dependency, and non-success response behavior
  are documented in requirements and covered by acceptance tests for the caller.
- AC-F014-007: Cross-service operations do not claim atomic commit, and tests
  demonstrate the approved partial-failure behavior.
- AC-F014-008: Each service can run its tests and generate its contract without
  starting unrelated services unless an approved integration test requires them.
- AC-F014-009: A single-service project incurs no required discovery, token
  exchange, orchestration, or distributed infrastructure.

## Out of scope

- Service discovery and coordinated deployment.
- Token exchange or a central identity service.
- Circuit breakers, sagas, event infrastructure, distributed transactions, and
  distributed tracing infrastructure.

## Dependencies and assumptions

The initial release supports service-shaped projects and generated clients. It
does not promise a complete microservice platform.
