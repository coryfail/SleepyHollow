---
schema: sgad-application/v0.2
id: application-id
title: Application name
status: draft
risk: standard
owners:
  - owner-or-team
depends_on: []
---

# Application requirements

Place this file at `requirements/application.md` as the sole item inside the
top-level `requirements/` directory.

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

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted. Append history; do not rewrite old
entries to make stale evidence appear current.

### Approval

- Status: pending.
- Approver: pending.
- Approved at: pending.
- Approved criteria: pending.
- Governed-content digest: pending.
- Decision source: pending.

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-APP-001 | pending |
| AC-APP-002 | pending |

### Red-state evidence

- Status: pending.
- Baseline revision: pending.
- Command, runner, and test digest: pending.
- Observed result and expected reason: pending.

### Verification

- Status: pending.
- Verifier and command: pending.
- Governed revision or manifest: pending.
- Result, time, and residual risks: pending.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
- Verified source, target, result, and time: pending when applicable.
