# Test-driven implementation

Approved acceptance criteria become failing tests before implementation begins.

## Mapping

Every approved criterion maps to at least one test, and every governed
acceptance test maps back to an approved criterion. In a consuming application,
import the public testing entry point and use the framework 0.3.5
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

## Vitest and the hollow CLI in framework 0.3.5

`criterionTest` registers a named test with Vitest and carries the same
traceability metadata into the CLI's discovery manifest. `hollow test` imports
test modules containing a direct `criterionTest(...)` registration, without
executing their test bodies, then runs the selected source files through
Vitest. It persists `generated/test-manifest.json` and
`generated/test-results.json`; `hollow check` loads those artifacts.

Discovery scans the project `tests/` and API roots (and the corresponding roots
for declared services). Ordinary Vitest-only files such as scaffold smoke tests
are ignored during discovery, so they remain safe to import only under Vitest.
Use a direct `criterionTest(...)` call in every governed source file. Indirect
wrappers that hide the call from source discovery are not part of the current
adapter contract.

The reliable Node/Bun workflow is:

1. Keep every criterion test mapped with the public `criterionTest` API above.
2. Run `hollow test --json`. It discovers the governed registrations, executes
   them with Vitest's TAP-flat reporter, and persists the two test evidence
   artifacts. A missing `generated/capture.json` is still reported separately;
   route and data verification requires capture-aware tests to write it.
3. Run `hollow check --json`. It loads the persisted manifest/results, the
   configured application requirement, endpoint requirements, and route
   ownership before evaluating approval, dependency, traceability, schema,
   security, and capture evidence.
4. Also run `npm run check` and the project's direct Vitest suite (or the Bun
   equivalents) when handing off the change. A passing direct Vitest run does
   not replace `hollow check`'s independent evidence gate.

Known limitations: discovery does not execute test bodies, does not infer
criterion mappings from ordinary Vitest names, and does not synthesize route or
data capture. The project test must still persist a current
`generated/capture.json` for observed behavior checks to pass.

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
