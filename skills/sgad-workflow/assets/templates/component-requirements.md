---
schema: sgad-component/v0.2
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

Colocate this `requirements.md` with the component it governs. Use this template
at repository root only when the governed behavior spans the repository and has
no honest application or component owner.

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
| AC-COMPONENT-001 | pending |
| AC-COMPONENT-002 | pending |

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
