# Governance and artifacts

Use stable identifiers, immutable revisions or content digests, and deterministic
references to connect the artifact graph:

```text
Application specification -> Component specification -> Approval record
  -> Test mapping -> Red evidence -> Implementation revision
  -> Embedded verification entry -> Delivery entry
```

## Embedded governance record

The component's `requirements.md` is the single home for its complete governance
history. Append approval, criterion mapping, red-state evidence, verification,
and applicable delivery entries beneath `## Governance record`.

Calculate the governed-content digest over the exact UTF-8 bytes before the
`## Governance record` heading after omitting the single top-level frontmatter
`status:` line and its line ending. Apply no other normalization. Git, review,
CI, or attestation references may support embedded entries but never replace
them. An editable status is not sole proof of a transition, and producer-authored
prose is not independent evidence.

## Specifications

Define system purpose, actors, scope, boundaries, shared contracts, security,
operations, delivery, dependencies, risks, open decisions, and cross-cutting
criteria in `requirements/application.md`. Keep it as the sole item inside the
top-level `requirements/` directory.

Define the smallest independently approvable behavior in each component
specification and colocate its `requirements.md` with the component. Include
scope, non-scope, inputs, outputs, errors, state, side effects, security,
non-functional constraints, dependencies, assumptions, change impact, and stable
acceptance criteria.

Use root `requirements.md` only for durable repository-wide behavior that cannot
be owned honestly by the application or one component.

## Approval

Bind approval to:

- Requirement ID and exact digest or immutable revision.
- Explicit criteria or bounded scope.
- Authorized identity or policy source.
- Approval time, risk, and decision source.

Use an editable lifecycle status only for routing and human readability. Verify
authority from the embedded approval entry and current governed content.

## Test and red evidence

Make criterion mapping bidirectional and many-to-many when needed. Report passing,
failing, and unmapped criteria plus tests without approved intent.

Bind red evidence to requirement and criterion IDs, requirement content, test
identity, baseline revision, runner environment, actual failure, and expected
reason. Invalidate it after a material test change.

## Verification and delivery

Bind the embedded verification entry to requirements, approval, tests, red evidence,
implementation, dependencies, policy, generated artifacts, environment, verifier
version, results, and residual risks.

Bind delivery evidence to the verified revision, target, authorization,
environment changes without secrets, post-delivery checks, and outcome.

## Invalidation minimums

| Material change | Minimum consequence |
|---|---|
| Requirement behavior or criterion | Return to draft; invalidate approval and downstream evidence. |
| Test semantics | Invalidate affected red and passing evidence; review intent mapping. |
| Governed implementation | Invalidate affected verification. |
| Shared dependency, contract, model, or policy | Impact-analyze and invalidate affected dependents. |
| Generated artifact edited directly | Fail until canonical regeneration or approved exception. |
| Verifier or governing policy | Reevaluate evidence under declared compatibility rules. |
| Delivery environment | Invalidate operational evidence as required by policy. |

Preserve invalidated historical records for audit; never rewrite history to make
old evidence appear current.
