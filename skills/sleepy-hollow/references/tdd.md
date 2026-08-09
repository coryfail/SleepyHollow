# Test-driven implementation

Approved acceptance criteria become failing tests before implementation begins.

## Mapping

Every approved criterion maps to at least one test, and every governed
acceptance test maps back to an approved criterion. Use `criterionTest` from
`core/testing` so each test carries stable test, requirement, and criterion
identifiers:

```ts
criterionTest({
  id: "T-BOOKMARKS-CREATE-001",
  requirementId: "EP-BOOKMARKS-CREATE",
  criterionId: "AC-EP-001",
  name: "rejects a bookmark with no URL",
  fn: async () => {/* ... */},
}, { requirements });
```

Cover the happy path, each declared failure, boundaries, security behavior, and
side effects. An unmapped criterion blocks implementation.

## Red state

Run the mapped tests against the current baseline before writing implementation.
Each failure must identify approved behavior that does not yet exist.

A run is credible red state only when the baseline is otherwise healthy. These
are **not** red state:

- Compilation or type errors
- Malformed assertions or unresolved imports
- Unavailable dependencies or fixtures
- Failures in unrelated, previously passing tests

Any of those is a broken baseline. Stop, report it, and repair the baseline
before continuing. Reporting a broken baseline as expected red state fabricates
evidence.

When behavior predates the requirement, record characterization evidence and
state honestly that no historical red state exists.

## Green

Implement the smallest change that satisfies the approved contract, then rerun
the mapped tests. Do not expand scope beyond approved criteria while
implementing.

## Bounded repair

When a test fails after implementation, repair the implementation. Do not edit
the test to match the code, relax an assertion, or narrow a criterion.

If satisfying the failure would change approved behavior, stop and return the
requirement to review. That is a specification problem, not an implementation
defect.
