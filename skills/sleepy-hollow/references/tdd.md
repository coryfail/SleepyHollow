# Test-driven implementation

Approved acceptance criteria become failing tests before implementation begins.

## Mapping

Every approved criterion maps to at least one test, and every governed
acceptance test maps back to an approved criterion. In a consuming application,
import the public testing entry point and use the framework 0.3.3
`CriterionTestSpec` shape. `criteria` is an array and `sourcePath` is the
project-relative path of the test file:

```ts
import { criterionTest } from "@sleepy-hollow/framework/testing";

criterionTest({
  id: "T-BOOKMARKS-CREATE-001",
  requirementId: "EP-BOOKMARKS-CREATE",
  criteria: ["AC-EP-001"],
  name: "rejects a bookmark with no URL",
  sourcePath: "api/bookmarks/bookmarks_test.ts",
  fn: async () => {/* ... */},
}, { requirements });
```

`criterionId` is not a registration field in this API. A singular
`criterionId` appears in some captured-operation attribution records, which is a
different data structure. Do not import from `core/testing` in an application;
that is the framework repository's source-tree path, not the published package
contract. The `requirements` value must contain the current parsed requirement
evidence with valid exact-content approval.

Cover the happy path, each declared failure, boundaries, security behavior, and
side effects. An unmapped criterion blocks implementation.

## Vitest and the hollow CLI in framework 0.3.3

`criterionTest` registers a named test with Vitest and returns traceability
metadata in the current process. It does not, by itself, write a
`sleepy-hollow-test-manifest/v1` file for the CLI to discover.

The public 0.3.3 project adapter has a known gap: `hollow test` and `hollow
check` do not execute the test modules to discover their `criterionTest`
registries, and their default evidence loaders currently expose an empty test
manifest and no test results. The native runner and verifier can consume a
manifest when a host supplies one, but the generated project scaffold does not
yet provide that bridge. Consequently, a direct Vitest pass is useful behavior
evidence but cannot close criterion traceability by itself; `hollow check` may
report `SH_CHECK_CRITERION_UNMAPPED` even when the Vitest test passed.

The reliable workflow against 0.3.3 is:

1. Keep every criterion test mapped with the public `criterionTest` API above.
2. Run `npm run check` and `npm run test` (or the equivalent Bun commands) so
   TypeScript and Vitest exercise the actual application behavior.
3. Use capture-aware tests that exercise discovered routes and persist a current
   `generated/capture.json`. The generated scaffold's capture helper only writes
   an empty artifact; it is a placeholder and does not observe routes or data
   operations until the project wires those hooks in.
4. Run `hollow check --json` and treat its diagnostics as authoritative. Do not
   report `verified` while the manifest/runner bridge or required capture
   evidence is missing; record the limitation and the exact diagnostic instead.

This limitation also means `hollow test` is not currently a substitute for
Vitest in a newly scaffolded project: without a supplied manifest it has no
governed tests to select. It is a framework integration gap, not a reason to
weaken criterion mappings or claim that a passing direct test closed independent
verification.

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
