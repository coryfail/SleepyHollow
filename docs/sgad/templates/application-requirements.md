---
schema: sgad-application/v0.1
id: application-id
title: Application name
status: draft
risk: standard
owners:
  - owner-or-team
depends_on: []
---

# Application requirements

## Purpose

Describe the problem, intended outcome, and why the application should exist.

## Actors and consumers

- Identify each human, system, service, administrator, or other consumer.
- Describe what each actor is trusted and authorized to do.

## Goals

- List measurable product or operational outcomes.

## Non-goals

- State adjacent behavior that is deliberately excluded.

## System boundary

Describe what the application owns, what remains external, and the trust
boundaries between them.

## Component and interface inventory

| ID | Component or interface | Purpose | Dependencies | Status |
|---|---|---|---|---|
| component-id | Name | Responsibility | None | draft |

## Data and shared models

Define owned resources, identifiers, relationships, retention, indexes,
classification, and lifecycle constraints.

## Behavioral conventions

Define shared request, response, error, pagination, compatibility, idempotency,
and side-effect conventions.

## Authentication and authorization

Record the explicit authentication decision, actors, credentials or sessions,
trust boundaries, authorization policies, and failure behavior. Record `none`
when no authentication is required.

## Security and privacy

Define validation, abuse controls, sensitive data, secret handling, audit needs,
threats, privacy constraints, and required security evidence.

## Operational requirements

Define environments, configuration, observability, reliability, performance,
health, readiness, backup, recovery, and support expectations.

## Delivery model

Define deployment targets, approval boundaries, compatibility and data-change
policy, smoke tests, rollback expectations, and required delivery evidence.

## Cross-cutting acceptance criteria

- AC-APP-001: Replace with a measurable system-level outcome.
- AC-APP-002: Replace with another measurable outcome.

## Dependencies and assumptions

- Identify internal and external dependencies.
- Mark assumptions that remain unverified.

## Open decisions

| ID | Decision | Why it matters | Owner | Blocks approval? |
|---|---|---|---|---|
| OPEN-001 | Decision needed | Behavioral impact | Owner | Yes |

## Risks and mitigations

| Risk | Impact | Mitigation | Required evidence |
|---|---|---|---|
| Describe risk | Describe consequence | Describe control | Describe verification |

## Approval scope

State which sections and criteria require approval, who may approve them, and
which unresolved decisions prevent approval.
