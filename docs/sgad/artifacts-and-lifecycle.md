# SGAD artifacts and lifecycle

SGAD uses an embedded governance record in each governed `*.req.md` file to
connect intent, authority, execution, and evidence. This document defines the
record's responsibilities without requiring a particular repository or CI tool.

## Artifact graph

```text
Application specification
  -> Component specification
      -> Approval record
          -> Acceptance-test mapping
              -> Red-state evidence
                  -> Implementation revision
                      -> Embedded verification entry
                          -> Delivery record
```

Every edge must be recoverable through stable identifiers, content digests,
repository revisions, or deterministic references.

## Embedded record

Approval and evidence are required functions, and their canonical record lives
inside the governed `*.req.md` file. Append a `Governance record` after the
behavioral specification with approval, criterion mapping, red-state evidence,
verification, and applicable delivery subsections.

Calculate the governed-content digest over the exact UTF-8 bytes before the
`## Governance record` heading after omitting the single top-level frontmatter
`status:` line and its line ending. Apply no other normalization. This prevents a
circular self-hash, keeps the derived lifecycle projection from invalidating its
own authority, and binds approval to every behavioral byte. Append later evidence
beneath that heading. Git history, protected reviews, CI runs, and attestations
may be linked as supporting provenance, but the embedded record remains the
canonical governance history.

Colocation does not collapse trust boundaries. An editable status is not sole
proof of approval or verification, and producer-authored prose is not independent
evidence. The verifier checks embedded authority, exact content binding, scope,
results, and linked provenance.

## Application specification

The application specification lives at `requirements/application.req.md` and is the
authoritative system-level intent. It
defines:

- Purpose, actors, consumers, goals, and non-goals.
- System boundaries and component inventory.
- Shared data, contracts, policies, and conventions.
- Security, privacy, operational, and delivery constraints.
- Cross-cutting acceptance criteria.
- Dependencies, risks, assumptions, and open decisions.

Component specifications refine it and may not silently contradict it.

The top-level `requirements/` directory contains `application.req.md`.
Repository-wide behavior that cannot be owned by the application or one
component may use a meaningful root-level `*.req.md` file.

## Component specification

A component specification is the smallest independently approvable unit of
behavior. Its named `*.req.md` file is colocated with the component it owns and
contains machine-readable metadata and human-readable intent.

Recommended metadata:

```yaml
---
schema: sgad-component/v0.2
id: component-stable-id
title: Human-readable title
status: draft
risk: standard
depends_on:
  - shared-contract-id
owners:
  - product-area
---
```

The body defines purpose, scope, non-scope, inputs, outputs, errors, state,
security, side effects, non-functional expectations, assumptions, dependencies,
risks, and stable acceptance criteria.

The `status` value is convenient for humans and workflow routing. It is omitted
from the governed-content digest and is not proof of authority or verification
by itself.

## Acceptance criteria

An acceptance criterion:

- Has a stable identifier.
- Describes observable or measurable behavior.
- Avoids accidental implementation detail unless the detail is itself required.
- States enough conditions and outcomes to form a test or evaluation.
- Traces to at least one verification activity.

Example:

```text
AC-BOOKMARKS-003: Given a valid unknown bookmark ID, the endpoint returns an
RFC 9457 response with status 404 and does not expose internal storage keys.
```

Changing the meaning of a criterion requires a new revision and invalidates its
approval. Reusing the same ID for unrelated behavior is prohibited.

## Approval record

Approval is a record bound to exact content, not a mutable word inside the
specification.

Recommended embedded approval fields:

```yaml
- Status: approved.
- Approver: authorized-identity.
- Approved at: 2026-08-06T14:00:00Z.
- Approved criteria: AC-COMPONENT-001 and AC-COMPONENT-002.
- Governed-content digest: sha256:...
- Decision source: protected review reference.
```

An approval decision may come from a protected pull-request review, signed
decision, ticket, repository policy, or another auditable authority. Record that
source in the named requirement file; the verifier must determine that the approver was
authorized and the digest matches current governed content.

## Acceptance-test mapping

The embedded mapping connects criteria to tests and tests back to criteria. Test
names, test metadata, or generated analysis may supply deterministic inputs, but
the resolved mapping remains in the governed `*.req.md` file.

The mapping reports:

- Criteria with passing tests.
- Criteria with failing tests.
- Criteria with no test.
- Tests with no approved criterion.
- Criteria or tests invalidated by change.

A many-to-many mapping is valid when explicit.

## Red-state evidence

Red-state evidence records that a mapped test failed before implementation for
the expected missing behavior.

It binds at minimum:

- Requirement and criterion IDs.
- Requirement digest.
- Test identity and digest or repository revision.
- Baseline implementation revision.
- Failure result and expected reason.
- Runner and environment identity relevant to reproduction.

Red evidence is invalid if the test later changes materially unless the test is
reapproved and the red phase is repeated.

## Implementation revision

The implementation revision identifies all governed source, tests,
configuration, dependencies, and generated inputs evaluated by verification. A
commit digest is the usual boundary, but another immutable content reference is
acceptable.

Uncommitted or external state must be captured explicitly if it affects results.

## Verification entry

The verification entry in the named `*.req.md` file binds current execution evidence to
approved intent. It includes:

- Requirement and approval digests.
- Implementation revision.
- Criterion mapping and results.
- Red-state evidence.
- Required check results.
- Verifier name, version, policy, and execution environment.
- Generated artifact identities.
- Residual warnings and risks.
- Final result and time.

The report is evidence, not an eternal guarantee. It remains valid only while its
inputs and policy remain valid.

## Delivery record

A delivery record connects a verified revision to an external target. It
identifies the target, authorization, deployed revision, environment changes
without secret values, contract or data impact, smoke-test evidence, time, and
outcome.

## Lifecycle states

| State | Meaning | Required evidence |
|---|---|---|
| `draft` | Intent is not authorized for implementation. | A specification exists; unresolved decisions remain visible. |
| `approved` | Exact bounded intent is authorized. | Valid approval record matching the current requirement digest. |
| `verified` | Current implementation satisfies required checks for approved intent. | Valid approval, criterion mapping, red evidence, passing checks, and an embedded verification entry bound to the implementation revision. |

The lifecycle intentionally omits `implementing` and `completed`. Those may be
useful task states, but they do not describe the authority or evidence state of a
requirement.

## Invalidation

The verifier calculates invalidation from changed content and dependencies.

| Change | Minimum consequence |
|---|---|
| Requirement behavior or acceptance criterion | Approval and downstream evidence invalidated; requirement returns to `draft`. |
| Acceptance test semantics | Red and passing evidence for affected criteria invalidated; review may be required. |
| Governed implementation | Verification invalidated for affected components. |
| Shared model, contract, policy, or dependency | Impact analysis invalidates every affected dependent component. |
| Generated artifact edited directly | Verification fails until canonical regeneration or approved exception. |
| Verifier or governing policy | Evidence is reevaluated according to declared compatibility policy. |
| Deployment environment | Delivery evidence is invalidated to the extent required by operational policy. |

Historical approval and reports are retained for audit. Invalidation prevents
reuse; it does not erase what occurred.

## Colocation and references

The recommended layout keeps a component requirement beside its tests and
implementation:

```text
component/
├── feature.req.md
├── component.test.ts
└── component.ts
```

The requirement contains the canonical approval and evidence record and may link
supporting review and CI provenance. The verifier must resolve every relationship
deterministically from this one local governance history.
