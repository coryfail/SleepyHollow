# SGAD phase guide

Use this guide when executing a concrete governed change.

## Phase sequence

| Phase | Entry focus | Required exit evidence |
|---|---|---|
| Establish governance | Policy, risk, authority, artifact locations, verifier, delivery gate | The repository can classify and govern the proposed change. |
| Discover | Existing behavior, actors, boundaries, dependencies, constraints, unknowns | Material uncertainty is resolved or recorded with approval impact. |
| Specify the system | System boundary and cross-cutting intent | System intent is coherent enough to decompose. |
| Decompose behavior | Small, independently reviewable components | Every proposed behavior and dependency is identifiable. |
| Approve | Exact intent, criteria, risk, assumptions | Authorized approval is bound to exact content and bounded scope. |
| Formulate tests | Bidirectional criterion mapping | No approved criterion or governed test is unmapped. |
| Prove red | Tests run against the baseline | Failures credibly demonstrate missing approved behavior; baseline is otherwise valid. |
| Implement | Smallest approved change | Mapped and integration tests pass with no unexplained scope. |
| Verify | Independent current-state checks | A reproducible report binds approved intent to current implementation. |
| Deliver | Verified revision, target, authorization, operational checks | Delivered revision and post-delivery evidence are identifiable. |
| Revalidate | Material changes and dependency impact | Affected evidence is invalidated and the smallest safe loop repeats. |

## Iteration rules

- Iterate backward whenever discovery changes intent.
- Return behavioral changes to draft; do not patch around the approval gate.
- Execute independent approved components concurrently only when dependencies are
  stable, governed artifacts do not overlap, and integration evidence exists.
- Isolate exploratory prototypes and label them non-governed. Move discoveries
  into a draft specification and produce fresh evidence before delivery.

## Stop conditions

Stop and report the blocker when:

- Material intent remains unresolved.
- Required approving authority is undefined or approval does not match content.
- The baseline fails for reasons unrelated to new approved behavior.
- Implementation requires behavior outside approved scope.
- The verifier is absent, stale, ambiguous, or failing.
- Delivery authorization or required operational evidence is missing.
