---
schema: sgad-component/v0.1
id: component-stable-id
title: Component title
status: draft
risk: standard
depends_on:
  - dependency-id
owners:
  - owner-or-team
---

# Component requirements

## Purpose

Describe the independently valuable behavior and the actor or consumer that needs
it.

## Authorized scope

- List behavior this component is permitted to implement.

## Out of scope

- List adjacent behavior that is not authorized by this requirement.

## Inputs

Define input sources, schemas, validation, limits, defaults, and trust level.

## Success outcomes

Define observable successful behavior, outputs, state changes, and contracts.

## Error outcomes

Define observable failures, error contracts, retry or idempotency behavior, and
information that must not be exposed.

## State and data access

Define owned state, reads, writes, indexes, transactions, concurrency behavior,
retention, and boundedness.

## Authentication and authorization

Record the explicit authentication decision, required principal, guard or policy,
and unauthorized and forbidden behavior.

## Side effects

Define messages, external calls, generated artifacts, notifications, or other
effects and their failure behavior.

## Non-functional requirements

Define measurable performance, reliability, accessibility, security, privacy,
resource, and observability expectations applicable to this component.

## Acceptance criteria

- AC-COMPONENT-001: Given a relevant condition, state the observable result.
- AC-COMPONENT-002: Given an invalid or boundary condition, state the observable
  failure and prohibited side effects.

## Dependencies and assumptions

- Identify every specification, model, policy, service, or external dependency.
- Record unresolved assumptions explicitly.

## Change impact

Identify consumers, contracts, data, tests, generated artifacts, and deployments
that must be reevaluated if this requirement changes.

## Approval scope

State the criteria being submitted for approval and any criteria explicitly
deferred or rejected.
