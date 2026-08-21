---
schema: sgad-component/v0.2
id: SH-F019
title: Runtime evidence capture
status: verified
risk: standard
source_sections:
  - "8"
  - "10"
  - "11.2"
depends_on:
  - SH-F002
  - SH-F003
  - SH-F004
  - SH-F005
  - SH-F007
owners:
  - Sleepy Hollow maintainers
---

# Runtime evidence capture

## Purpose

Record what a handler actually does while its mapped tests run, so independent
verification checks observed behavior instead of author claims.

`hollow check` requires evidence that no static artifact carries: which request
locations a handler reads, which response statuses it returns, and which data
operations it performs with what index and bound. Nothing in the framework
produces that evidence today, which is why the verification inventory has had no
implementable source.

## In scope

- A capture session that collects behavioral records during a test run.
- A repository wrapper that records data operations performed through SH-F004.
- A route wrapper that records request locations read and response statuses
  returned through SH-F002 and SH-F003.
- Association of every record with the requirement and criterion under test.
- A deterministic capture artifact the SH-F018 loader reads.
- Persistence of that artifact to the project's declared generated location.
- Binding record attribution to the executing SH-F007 criterion test.

## Requirements

### Additive wrapping

Capture shall wrap the existing public boundaries of SH-F002, SH-F003, SH-F004,
and SH-F005 from outside. It shall not modify routing, dispatch, validation,
index definition, authorization enforcement, or the test application, and it
shall not change the governed content or behavior of any of those components.

A wrapped repository shall behave identically to the repository it wraps,
including returned values, thrown errors, and versionstamp semantics. A wrapped
route shall return the handler's response unchanged. Capture that alters
behavior is a defect, not a trade-off.

### Observed data operations

A wrapped repository shall record each operation it performs with the resource
name, a kind of `get`, `query`, `read-modify-write`, or `raw`, the index used
when the operation is indexed, the effective limit when the operation is
bounded, whether a versionstamp check was applied, and whether the operation was
atomic. Raw access shall record the justification the caller supplied.

Records shall describe operations that actually executed. Capture shall not
predict, infer, or synthesize an operation that did not run.

### Observed coverage

A wrapped route shall record which of `params`, `query`, `headers`, and `body`
the handler read during the request, and the status of the response it returned.
Reading a location means the handler accessed it, not that a schema declared it.

### Attribution

Every record shall carry the requirement identifier and criterion identifier of
the test that produced it, taken from the SH-F007 criterion test currently
executing. A record produced outside a criterion test shall be retained and
marked unattributed rather than discarded or assigned to an unrelated
requirement.

### Coverage honesty

The capture artifact shall distinguish a route observed during testing from a
route never exercised. An unexercised route, method, or data path shall be
reported as uncaptured. Capture shall never present absence of observation as
evidence of correct behavior, and shall never emit an empty record set that
would let a verification phase pass on no evidence.

### Artifact

Capture shall expose a persistence operation that writes one deterministic
artifact to a caller-supplied location, which a Sleepy Hollow project resolves
to its declared generated location. Two runs over identical code exercising
identical tests shall produce byte-identical artifacts, including record
ordering. The artifact shall record the runner and revision that produced it so
stale evidence is detectable.

Persistence shall write the complete artifact or fail. It shall not leave a
partial artifact that a later verification could read as complete evidence.

### Criterion binding

Capture shall bind attribution to the executing SH-F007 criterion test without
requiring a caller to open and close a scope by hand, so a record cannot be
attributed to the wrong criterion because a caller forgot to close one. A
caller may still scope attribution explicitly for records produced outside a
criterion test.

## Acceptance criteria

- AC-F019-001: A wrapped repository returns the same values, errors, and
  versionstamps as the repository it wraps.
- AC-F019-002: A wrapped route returns the handler's response unchanged.
- AC-F019-003: A bounded indexed query records its resource, index, and
  effective limit as executed.
- AC-F019-004: A read-modify-write records whether a versionstamp check was
  applied and whether it was atomic.
- AC-F019-005: A raw operation records the justification supplied by its caller.
- AC-F019-006: A handler that reads only `body` records `body` alone, regardless
  of which locations declared a schema.
- AC-F019-007: A response status returned by the handler is recorded as
  observed.
- AC-F019-008: Every record produced inside a criterion test carries that test's
  requirement and criterion identifiers.
- AC-F019-009: A record produced outside a criterion test is retained and marked
  unattributed rather than assigned to a requirement.
- AC-F019-010: A route that no test exercises is reported as uncaptured rather
  than as observed with no operations.
- AC-F019-011: Two runs over identical code and tests produce byte-identical
  capture artifacts, including record ordering.
- AC-F019-012: The artifact records the runner and revision that produced it.
- AC-F019-013: Persisting a session writes the complete artifact to the supplied
  location, and the written bytes equal the artifact the session reports.
- AC-F019-014: A persistence failure leaves no partial artifact at the target
  location.
- AC-F019-015: Records produced inside an SH-F007 criterion test are attributed
  to that criterion without an explicit caller-managed scope.

## Out of scope

- Static analysis of handler source.
- Changing SH-F002 routing, SH-F003 validation, SH-F004 index definitions,
  SH-F005 enforcement, or the SH-F007 test application.
- Changing the verification phases or diagnostics owned by SH-F008.
- Capturing production traffic, or any capture outside a test run.
- Deciding whether uncaptured behavior fails verification, which SH-F008 owns.

## Dependencies and assumptions

SH-F002 exposes route operations whose handlers can be wrapped and whose context
is an ordinary object. SH-F004 exposes repositories as ordinary objects whose
methods can be delegated. SH-F007 exposes the executing criterion identity that
records are attributed to.

Capture observes only what tests exercise. That bound is intentional: behavior
no test exercises has no verification evidence and must not be certified. It
follows that verification confidence is a function of test coverage, and the
capture artifact makes the untested remainder explicit rather than silent.

A project enables capture in its test setup by using the wrapped repository and
route helpers. Enabling capture from the `hollow test` command is not part of
this component.

## Governance record

> Historical verification note: Deno commands, runtime names, and platform
> artifacts appearing below this boundary belong to the pre-Node/Bun
> implementation or migration record. They are retained for audit history only;
> current behavior and verification use the Node.js/Bun package workflow.

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T17:34:18Z.
- Approved criteria: AC-F019-001 through AC-F019-015.
- Governed-content digest:
  `sha256:9280cab006e7a6faad24a9dedc79a294785387688c2114199f331bd167670dc2`.
- Decision source: owner review; direct response `Approve` after review
  of artifact persistence, the no-partial-write rule, and automatic criterion binding, and the exact governed-content digest.

### Superseded approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T14:44:18Z.
- Approved criteria: AC-F019-001 through AC-F019-012.
- Governed-content digest:
  `sha256:49cf816dda800703b8f884bdbfd9eeeee7b4be1564ca6d6b50c3dad4754dc014`.
- Decision source: owner review; direct response `Approve both` after
  review of the additive wrapping boundary, the observed-evidence model, the
  coverage-honesty rule, the bounded criteria, and the exact governed-content
  digest.

### Criterion mapping

- AC-F019-001 -> `capture_test.ts` repository transparency test covering values,
  versionstamps, metadata, and rethrown errors.
- AC-F019-002 -> `capture_test.ts` route response-identity test.
- AC-F019-003 -> `capture_test.ts` bounded indexed query record test.
- AC-F019-004 -> `capture_test.ts` read-modify-write versionstamp and atomicity
  test.
- AC-F019-005 -> `capture_test.ts` raw justification record test.
- AC-F019-006 -> `capture_test.ts` read-location observation test.
- AC-F019-007 -> `capture_test.ts` observed response-status test.
- AC-F019-008 -> `capture_test.ts` criterion attribution test.
- AC-F019-009 -> `capture_test.ts` unattributed retention test.
- AC-F019-010 -> `capture_test.ts` uncaptured-route reporting test.
- AC-F019-011 -> `capture_test.ts` byte-identical artifact test.
- AC-F019-012 -> `capture_test.ts` runner and revision provenance test.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-08T14:46:00Z.
- Base revision: `916d706` plus the approved SH-F019 requirement, the twelve
  mapped tests, and typed nonfunctional seams.
- Commands: `deno task check:capture` and `deno task test:capture` using Deno
  `2.9.5` on macOS arm64.
- Result: `deno task check:capture` passed, establishing a healthy typed
  baseline. `deno task test:capture` reported `0 passed | 12 failed`, every
  failure an assertion or a seam that threw for unimplemented behavior.
- Baseline correction: the first attempt failed type checking because two test
  fixture casts converted between the handler context and a record type without
  an intermediate `unknown`. That is a broken baseline, not red-state evidence.
  The casts were corrected and the run repeated before red state was recorded.

### Verification

- Status: passed.
- Verified at: 2026-08-08T14:47:11Z.
- Command: `deno task verify:capture`, comprising `deno fmt --check`,
  `deno lint`, `deno task check:capture`, and `deno task test:capture`.
- Result: `12 passed | 0 failed`.
- Regression scope: `verify:framework`, `verify:create`, `verify:planning`,
  `verify:check`, `verify:cli`, `verify:test-command`, `verify:dev`,
  `verify:skill`, `verify:deploy`, and `verify:evidence` all passed at the same
  revision, confirming that wrapping introduced no change to the components it
  wraps.
- Additive boundary confirmed: no file under `core/routing`, `core/validation`,
  `core/kv`, `core/security`, or `core/testing` was modified. Capture wraps
  their public surfaces through a delegating proxy, so their governed content
  and verified status are untouched.
### Verification, complete

- Status: passed for all fifteen approved criteria.
- Verified at: 2026-08-08T17:38:51Z.
- Command: `deno task verify:capture`.
- Result: `15 passed | 0 failed`.
- Closure: the withdrawn claim recorded below is resolved. AC-F019-013 now
  covers persistence, and the implementation writes through a staging file and
  renames, so a failed write cannot leave a partial artifact at the target.
  AC-F019-015 covers automatic attribution through a wrapped criterion test, so
  a record cannot reach the wrong criterion because a caller forgot to close a
  scope.
- Residual risk: capture observes only what tests exercise, and behavior no test
  reaches carries no evidence.

### Verification, withdrawn

- Status: the verified claim above is withdrawn. SH-F019 returns to `approved`.
- Withdrawn at: 2026-08-08T14:58:00Z.
- Reason: the approved Artifact requirement states that capture shall write one
  deterministic artifact to the project's declared generated location. No
  approved criterion covers persistence, and the implementation has no write
  path. The twelve mapped criteria therefore passed while the component did not
  satisfy its own approved requirements text.
- Assessment: this is a criterion-coverage defect, not an implementation defect.
  The mapped criteria under-covered an approved requirement sentence, so the
  component gate could not detect the omission. Closing it requires a new
  criterion, which is a governed change and invalidates the current approval.
- Downstream impact: SH-F018 consumes the artifact from the generated location
  and its twelve passing criteria are unaffected, because they read a fixture
  artifact rather than one capture wrote.

- Residual risk: capture observes only what tests exercise. Behavior no test
  reaches is reported as uncaptured and carries no evidence. Whether uncaptured
  behavior fails verification is an SH-F008 decision that remains open.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
