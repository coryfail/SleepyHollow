---
schema: sgad-component/v0.2
id: SH-F019
title: Runtime evidence capture
status: approved
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

Capture shall write one deterministic artifact to the project's declared
generated location. Two runs over identical code exercising identical tests
shall produce byte-identical artifacts, including record ordering. The artifact
shall record the runner and revision that produced it so stale evidence is
detectable.

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

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T14:44:18Z.
- Approved criteria: AC-F019-001 through AC-F019-012.
- Governed-content digest:
  `sha256:49cf816dda800703b8f884bdbfd9eeeee7b4be1564ca6d6b50c3dad4754dc014`.
- Decision source: Claude conversation; direct response `Approve both` after
  review of the additive wrapping boundary, the observed-evidence model, the
  coverage-honesty rule, the bounded criteria, and the exact governed-content
  digest.

### Criterion mapping

- Status: pending approval and governed tests.

### Red-state evidence

- Status: pending approved test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
