---
schema: sgad-component/v0.2
id: SH-F007
title: Testing and acceptance-criterion traceability
status: verified
risk: standard
source_sections:
  - "3.6"
  - "5.3"
  - "11.1"
  - "11.3"
  - "20"
depends_on:
  - SH-F002
  - SH-F003
  - SH-F004
  - SH-F005
  - SH-F006
open_decisions:
  - OPEN-005
  - OPEN-006
owners:
  - Sleepy Hollow maintainers
---

# Testing and acceptance-criterion traceability

## Purpose

Turn approved behavior into deterministic test evidence through an observable
red-green TDD loop and explicit criterion mapping.

## In scope

- Endpoint acceptance-test generation from approved criteria.
- Stable criterion metadata in tests.
- Expected pre-implementation failure capture.
- Isolated application and Deno KV test utilities.
- Typed requests, data seeding, principals, Problem Details assertions, and
  generated-client testing.
- Traceability reports for criteria and tests.

## Requirements

### Criterion tests and traceability

Tests shall be generated only for requirements with a valid approval record
bound to the current governed-content digest and bounded criteria. A `draft`
requirement, an approval for stale content, or an approval that omits a
requested criterion shall fail before a test file is proposed.

OPEN-005 is resolved by a transparent `criterionTest` wrapper over `Deno.test`.
Each generated acceptance test shall declare a globally stable test ID, one
requirement ID, a non-empty unique list of approved criterion IDs, a human name,
and the native Deno test function and options. The wrapper shall register the
native test with a readable name containing its criterion IDs and expose a
frozen descriptor containing the same metadata. It shall reject duplicate test
IDs, malformed or duplicate criterion IDs, empty names, and metadata that does
not resolve to the approved requirement. It shall not replace Deno's runner,
hide mappings in comments, or require a proprietary test file format.

Every approved criterion shall map to at least one test, and every governed
acceptance test shall map to approved behavior. One test may cover multiple
criteria when the mapping remains explicit in both directions. A deterministic
traceability report shall sort by requirement, criterion, and test ID and report
criteria with passing tests, failing tests, skipped tests, or no mapped tests;
tests with no approved criterion; duplicate identities; and mappings invalidated
by requirement or test change. Human-readable and JSON consumers shall receive
the same normalized report model.

A current test manifest shall contain stable test identity, requirement and
criterion mappings, source path, and a SHA-256 digest of each governed test's
exact UTF-8 bytes. Comparing it with the manifest embedded in the requirement's
governance history shall surface removed tests, removed mappings, and changed
test content. A changed digest is not automatically a failure when behavior is
preserved, but it requires new traceability review; removal or weakening cannot
silently retain `verified` status.

### Red-state classification

The implementation loop shall run an explicit baseline gate before the new
acceptance tests. Type checking, application startup, required dependencies, and
previously passing unaffected tests shall be healthy. Any failure in that gate
shall stop the loop with a `broken-baseline` result and shall not be recorded as
expected red-state evidence.

The pre-implementation acceptance run shall record requirement and criterion
IDs, requirement digest, test ID and digest, baseline revision, runner and
environment, failure output, and a bounded explanation of why the failure
demonstrates missing approved behavior. A valid `expected-red` result requires
every new criterion to reach at least one mapped failing test for the expected
reason and no mapped test to fail from compilation, malformed assertions,
permissions, startup, unavailable dependencies, or unrelated behavior. A test
that passes before implementation is reported honestly and does not fabricate
red evidence.

The skill or implementation process shall not silently weaken or remove tests
derived from approved criteria. Behavioral test changes require user visibility
and renewed requirement approval when intended behavior changes. After
implementation, any failing or skipped required mapping, missing red evidence,
or stale manifest prevents the traceability result from supporting `verified`.

### Isolated test application

`createTestApplication(options)` shall create one isolated test-mode application
around an injected application factory. It shall open a fresh in-memory Deno KV
context, pass that KV together with optional project-defined principal or
credential fixtures to the factory, run an optional async seed function, and
return an idempotently disposable context. Setup failure shall close every
resource already opened; disposal shall close KV and run registered cleanup even
after a test assertion fails. Contexts shall not share KV state, principal
state, credentials, or mutable request defaults unless the test explicitly
supplies a shared fixture.

The context shall expose its isolated KV handle, the application `fetch`
function, and a typed JSON request helper that accepts method, path, headers,
and typed body without opening a listening socket. It shall support
project-defined principal or credential injection without assuming an identity
model. An RFC 9457 assertion helper shall verify the problem content type, HTTP
status, required `type`, `title`, and `status` members, optional expected
extensions, and the absence of a successful response shape.

The same in-process fetch function shall be usable as an injected transport for
a generated client. Client tests shall therefore exercise the real test
application, validation, security, and storage behavior without DNS, a bound
port, or a separately deployed environment.

### Safe test selection

OPEN-006 is resolved by deterministic, fail-closed impact analysis over parsed
requirement dependencies and registered test metadata. A targeted request shall
include the named requirements, their transitive dependencies, their transitive
dependents, and every test mapped to that closure. Results shall list the exact
selected requirement and test IDs and the dependency edge that selected each
indirect item.

Selection shall escalate to the full relevant suite rather than guess when the
target is unknown, a dependency is missing or cyclic, identities are duplicated,
a changed shared artifact has no complete ownership mapping, a governed test is
unmapped, or cross-cutting configuration cannot be bounded safely. Targeting
changes only which already-defined tests run; it shall never change test
metadata, assertions, isolation, or pass criteria.

### Security composition in the test application

The test application shall compose the SH-F005 security router using the
project's declared `securityModule`, so a request in a test traverses the same
authentication and authorization path it traverses when served.

A test application that bypasses security lets a mapped criterion test pass
against a route that would reject the identical request when served. That is a
false pass, and criterion tests are the evidence `hollow check` relies on, so
the falsehood propagates into verification.

## Acceptance criteria

- AC-F007-001: Test generation refuses a `draft` requirement and names the
  approval state preventing generation.
- AC-F007-002: Every approved acceptance criterion appears in at least one
  test's name or machine-readable metadata.
- AC-F007-003: Traceability reports criteria with passing tests, failing tests,
  no mapped tests, and tests with no approved criterion.
- AC-F007-004: The pre-implementation run records failure caused by missing
  approved behavior before implementation begins.
- AC-F007-005: An unrelated type, startup, dependency, or baseline failure stops
  the TDD loop and is reported separately from expected red-state evidence.
- AC-F007-006: Test utilities start an application with isolated Deno KV state
  and deterministic cleanup.
- AC-F007-007: Tests can issue typed requests, seed data, supply project-defined
  principals or credentials, and assert RFC 9457 responses.
- AC-F007-008: Generated clients can be exercised against the test application
  without a separately deployed environment.
- AC-F007-009: Removing or weakening a mapped test is surfaced in the
  traceability report and cannot preserve `verified` status silently.
- AC-F007-010: A feature cannot become `verified` while any approved criterion
  lacks a passing mapped test.
- AC-F007-011: A request through the test application to a route declaring a
  required authentication mode is rejected without invoking the handler when no
  credential is supplied.
- AC-F007-012: A test application composed for a project declaring no
  `securityModule` serves routes declaring `authentication: "none"` unchanged.

## Out of scope

- Cryptographically locked tests.
- Claiming that generated tests prove unspecified behavior.

## Dependencies and assumptions

OPEN-005 is resolved by the native `criterionTest` registration and manifest
contract above. OPEN-006 is resolved by bidirectional dependency closure with
explicit full-suite escalation. SH-F002 supplies the normalized route inventory
the test application composes, SH-F003 supplies typed validation and Problem
Details behavior, SH-F004 supplies isolated Deno KV contexts, SH-F005 supplies
the security router and project security declaration, and SH-F006 supplies
approved parsed requirements and dependency metadata.

The SH-F002 and SH-F005 edges are load-bearing rather than descriptive. This
component's own impact analysis closes over declared dependencies, so a security
or routing change that does not select these tests would leave the composition
this component depends on unverified.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T02:14:08Z.
- Approved criteria: AC-F007-001 through AC-F007-012.
- Governed-content digest:
  `sha256:e92261b2d031890efbdf45c5c71f870cc3cf8dbc413ad3028a1c523aaa09a0b9`.
- Decision source: Claude conversation; direct response `Approved` after review
  of security composition in the test application, the reasoning that a
  security-bypassing test application produces false passes in the evidence
  `hollow check` relies on, the two amended criteria, and the exact
  governed-content digest.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T16:03:49Z.
- Approved criteria: AC-F007-001 through AC-F007-010.
- Governed-content digest:
  `sha256:bc2e3f6706875c1cc97a22ef6569e60ee92d4a96da1330521d3ea8a11e0ab327`.
- Decision source: Codex conversation; direct response `Approved` after review
  of the requirement path, bounded criteria, standard-risk classification,
  satisfied SH-F003, SH-F004, and SH-F006 dependencies, native Deno criterion
  metadata, fail-closed impact analysis, and exact governed-content digest.

### Approval, corrected dependencies

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T11:27:24Z.
- Approved criteria: AC-F007-001 through AC-F007-012.
- Governed-content digest:
  `sha256:ff84946573d0e59f7dce24063ccd447015fdbebe81b5aafa25036a493115a458`.
- Decision source: Claude conversation; direct response `Approve` after review
  of the dependency correction recorded below, the added SH-F002 and SH-F005
  edges and why they are load-bearing for this component's own impact analysis,
  the unchanged criterion text, and the exact governed-content digest.

### Dependency correction

- Status: corrected and re-approved above. The 2026-08-09T02:14:08Z approval
  does not bind this content and asserts no authority over it.
- Cause: the approved amendment composes the SH-F005 security router over an
  SH-F002 route inventory, but the frontmatter declared neither dependency. The
  omission was in the content approved at 2026-08-09T02:14:08Z.
- Effect: this component's own dependency-closure selection would not have
  selected these tests when SH-F002 or SH-F005 changed, leaving the composition
  it depends on unverified. `depends_on` is governed content, so correcting it
  changes the digest and requires a new approval.
- Corrected governed-content digest:
  `sha256:ff84946573d0e59f7dce24063ccd447015fdbebe81b5aafa25036a493115a458`.
- No criterion text changed. AC-F007-011 and AC-F007-012 are unchanged from the
  approved amendment.

### Criterion mapping

- AC-F007-001 -> `testing_test.ts` draft and stale approval refusal test.
- AC-F007-002 -> `testing_test.ts` native-name, descriptor, and manifest test.
- AC-F007-003 -> `testing_test.ts` trace-state report and targeted-selection
  nested tests.
- AC-F007-004 -> `testing_test.ts` expected missing-behavior red evidence test.
- AC-F007-005 -> `testing_test.ts` broken-baseline classification test.
- AC-F007-006 -> `testing_test.ts` isolated KV and idempotent cleanup test.
- AC-F007-007 -> `testing_test.ts` typed request, fixture, seed, and RFC 9457
  assertion test.
- AC-F007-008 -> `testing_test.ts` in-process generated-client transport test.
- AC-F007-009 -> `testing_test.ts` removed, changed, and weakened manifest test.
- AC-F007-010 -> `testing_test.ts` complete passing-coverage eligibility test.
- AC-F007-011 -> `testing_test.ts` uncredentialed protected-route rejection
  test.
- AC-F007-012 -> `testing_test.ts` undeclared security module open-route test.

### Verification, security composition amendment

- Status: passed.
- Verified at: 2026-08-09T11:27:24Z.
- Approved requirement digest:
  `sha256:ff84946573d0e59f7dce24063ccd447015fdbebe81b5aafa25036a493115a458`.
- Current runtime-test digest:
  `sha256:c1fea7154ea8d125cfa64ba590194e0131985c58aea86e0f146a116ee3c8a032`.
- Command: `deno task verify:testing` using Deno `2.9.5` with in-memory Deno KV
  on macOS arm64.
- Result: formatting, linting, and type checking passed; testing passed 12/12
  with two nested steps. No prior criterion regressed.
- Verified behavior: `createTestApplication` accepts a route inventory and
  composes `composeProjectSecurity` in `test` mode with the project's declared
  `securityModule`, so a request in a test traverses the same authentication
  path it traverses when served. A protected route rejects an uncredentialed
  request without entering its handler, and a project declaring no
  `securityModule` serves `authentication: { mode: "none" }` routes unchanged.
  The existing factory form is unchanged; supplying neither a factory nor routes
  fails with `SH_TEST_APPLICATION_SOURCE_REQUIRED`.
- Independent verifier state: the canonical `npm run verify` from `website/`
  passed in full at 2026-08-09T11:36:00Z on top of commit `8a12f01`: structural
  16/16, links 1/1, repository consistency 9/9, React 8/8, TypeScript and
  production build, and Playwright/Axe 66/66 across Chromium, Firefox, and
  WebKit. The AC-REPO-001 endpoint-kind defect that previously withheld this
  projection is repaired, so the status is now `verified`.

### Red-state evidence, security composition amendment

- Status: failed as expected. This evidence is bound to the corrected digest
  recorded above and must be reconfirmed if that content changes before
  re-approval.
- Observed at: 2026-08-09T02:21:20Z.
- Base revision: `acf8dce4f89517ac22fecbda637199899ff5cbad` plus the SH-F007
  amendment, its two mapped tests, and the explicit test-application seam in
  `core/testing/application.ts`.
- Commands: `deno task check:testing` and `deno task test:testing` using Deno
  `2.9.5` with in-memory Deno KV on macOS arm64.
- Runtime-test digest:
  `sha256:c1fea7154ea8d125cfa64ba590194e0131985c58aea86e0f146a116ee3c8a032`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Result: type checking passed; testing passed 10/12 with two nested steps.
  AC-F007-011 and AC-F007-012 failed and the ten previously verified criteria
  continued to pass.
- Expected failure: both criteria reached the healthy Deno runner and failed
  only through the explicit `SH_TESTING_NOT_IMPLEMENTED` seam reached when a
  route inventory is supplied. No KV, permission, dependency, or unrelated
  regression failure obscured the missing approved behavior.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T16:06:27Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F007 requirement, mapped testing-kernel tests, Deno task configuration, and
  the previously verified working tree.
- Commands: `deno task check:testing` and `deno task test:testing` using Deno
  `2.9.5` with in-memory Deno KV on macOS arm64.
- Test digest:
  `sha256:2fe1a7d52cd564fd7fd6997bc489db5bb26ed652af5be7fbfa13dba416001998`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Result: testing-kernel type checking passed and runtime tests passed 0/10 with
  two targeted traceability and selection steps.
- Expected failure: every testing criterion reached the healthy Deno runner and
  failed only through the explicit `SH_TESTING_NOT_IMPLEMENTED` seams; no KV,
  permission, dependency, assertion-runner, or unrelated regression failure
  obscured the missing approved behavior.

### Verification

- Status: passed.
- Verified at: 2026-08-07T16:14:42Z.
- Requirement digest:
  `sha256:bc2e3f6706875c1cc97a22ef6569e60ee92d4a96da1330521d3ea8a11e0ab327`.
- Implementation manifest digest:
  `sha256:4f298fd7ebccb55ea3574546a831ed685fd31f0e0fccf5390b6b7d1fa1fcbdab`.
- Test digest:
  `sha256:2fe1a7d52cd564fd7fd6997bc489db5bb26ed652af5be7fbfa13dba416001998`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Verifier: Deno `2.9.5` format, lint, type, test, and in-memory KV tasks plus
  the canonical repository and cross-browser website verifier on macOS arm64.
- Results: testing passed 10/10 with two nested traceability and selection
  checks; the complete framework passed 58/58 with fifteen nested steps;
  planning passed 10/10; project creation passed 9/9; repository governance
  passed 9/9; website structure passed 16/16; links passed 1/1; React passed
  8/8; TypeScript and production build passed; Playwright and Axe passed 66/66
  across Chromium, Firefox, and WebKit; `git diff --check` passed.
- Residual risks: a source digest intentionally covers the complete test file,
  so one edit may conservatively require review of multiple colocated test IDs;
  SH-F010 must expose the generated client's injectable fetch transport before
  its concrete client output can consume the verified in-process seam.

### Delivery

- Status: not applicable; no commit, push, publication, or deployment was
  authorized or attempted.
