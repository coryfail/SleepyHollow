---
schema: sgad-component/v0.2
id: SH-F018
title: Repository evidence loader
status: verified
risk: standard
source_sections:
  - "3.6"
  - "8"
  - "11"
  - "12"
depends_on:
  - SH-F001
  - SH-F002
  - SH-F003
  - SH-F004
  - SH-F005
  - SH-F006
  - SH-F007
  - SH-F008
  - SH-F010
  - SH-F011
  - SH-F012
  - SH-F013
  - SH-F014
  - SH-F016
  - SH-F019
open_decisions:
  - OPEN-012
owners:
  - Sleepy Hollow maintainers
---

# Repository evidence loader

## Purpose

Assemble the normalized evidence that `hollow check`, `hollow test`, and
`hollow deploy` require, by reading a real project from disk, so those commands
operate on an actual repository instead of a caller-supplied fixture.

SH-F008, SH-F011, and SH-F016 each declare the normalized inventory a host
boundary and fail closed when no loader is supplied. That decision is preserved:
this component is the framework's own implementation of that boundary, not a
change to the verification rules those components own.

## In scope

- Bounded discovery of governed requirements, routes, schemas, security
  declarations, data operations, configuration, and test evidence in a project.
- Governed-content digest calculation and approval binding.
- Native runner invocation through the SH-F008 verification runner.
- Assembly of the SH-F008 verification inventory, the SH-F016 test inventory,
  and the SH-F013 deployment inventory.
- Wiring the assembled loaders into the shipped CLI entry point.
- Deterministic, source-located diagnostics when a project cannot be read.

## Requirements

### Discovery

OPEN-012 is resolved with declared project configuration as the sole source of
discoverable locations. The loader shall derive the API directory, the
requirements file, and the generated-output location from the SH-F001 project
configuration, which a created project declares as a typed `SleepyHollowProject`
in `sleepyhollow.config.ts`. When a project declares multiple services under
SH-F014, the loader shall derive each service's location from that service
definition's declared root and shall scope discovery per service so that one
service's evidence is never attributed to another. No separate discovery
manifest is introduced, and undeclared locations are not discovered.

The SH-F012 configuration governs runtime modes, keys, and secrets rather than
repository layout. The loader consumes it only to collect the configuration
diagnostics the verification inventory carries, never to locate files.

Discovery shall begin at a declared project root and shall traverse only the
locations a Sleepy Hollow project declares. It shall not walk the entire
filesystem, follow symbolic links outside the project root, or read files
outside the declared locations.

Discovery shall be deterministic. Two runs against identical repository content
shall produce identical inventories, including collection ordering.

### Governed evidence

The loader shall parse each governed `requirements.md` using the SH-F006 parser,
calculate the governed-content digest using the canonical algorithm, and report
whether each recorded approval binds the requirement's current content. It shall
treat the frontmatter `status` field as a lifecycle projection and shall never
accept it as evidence of approval or verification.

The loader shall extract recorded red-state evidence and verification entries as
data. It shall never accept a source-authored claim that tests passed, that a
criterion is covered, or that verification succeeded. Execution status comes
only from the native runner result.

### Behavioral evidence

The loader shall discover routes through the SH-F002 route discovery, declared
request and response schemas through the SH-F003 definitions, declared
authentication and authorization through the SH-F005 declarations, declared
index names through the SH-F004 definitions, and configuration diagnostics
through SH-F012. Generated-artifact state and contract changes come from
SH-F010.

Observed behavior comes from the SH-F019 capture artifact: the request locations
a handler read, the response statuses it returned, and the data operations it
performed with their index, bound, versionstamp check, and atomicity. The loader
shall not infer any of these from handler source and shall not instrument the
runtime itself.

The loader shall not infer behavior that a project does not declare or that
capture did not observe. A location observed as read with no corresponding
declared schema is reported as missing coverage rather than inferred. A route
the capture artifact reports as uncaptured is carried into the inventory as
uncaptured; the loader shall not substitute an empty observation set that would
let a coverage or data phase pass on absent evidence.

The loader shall reject a capture artifact whose recorded revision does not
match the revision under verification, rather than admitting stale observations.

### Failure

The loader shall fail closed. A malformed requirement, an unreadable declared
location, an unresolvable dependency, or an ambiguous identity shall produce a
diagnostic identifying the file, the line when known, and the correction. It
shall never substitute a partial inventory that would allow verification to pass
on incomplete evidence.

### Integration

The shipped CLI entry point shall supply the assembled loaders so that
`hollow check`, `hollow test`, and `hollow deploy` operate on a real project
without a caller-supplied inventory. The commands' existing verification,
selection, and delivery rules shall remain unchanged.

## Acceptance criteria

- AC-F018-001: Given a generated project with one approved endpoint, the loader
  assembles a verification inventory whose requirements, routes, schemas,
  security declarations, and data operations match the project on disk.
- AC-F018-002: The loader calculates each requirement's governed-content digest
  using the canonical algorithm and reports an approval as unbound when any
  governed byte other than the frontmatter `status:` line has changed.
- AC-F018-003: Changing only the frontmatter `status:` line leaves every
  calculated digest and approval binding unchanged.
- AC-F018-004: A source-authored claim that tests passed, that a criterion is
  covered, or that verification succeeded is not admitted as evidence, and the
  native runner result determines execution status.
- AC-F018-005: Two loads of identical repository content produce byte-identical
  normalized inventories, including collection ordering.
- AC-F018-006: Discovery reads only the project's declared locations and does
  not traverse outside the project root or follow links that escape it.
- AC-F018-012: A multi-service project scopes discovery per declared service, so
  no service's requirements, routes, or data operations are attributed to
  another.
- AC-F018-013: A missing, unreadable, or invalid project configuration fails
  closed with a diagnostic and produces no partial inventory.
- AC-F018-007: A malformed requirement, unreadable declared location, or
  duplicate requirement identity fails closed with a diagnostic identifying the
  file, the line when known, and the correction.
- AC-F018-008: A request location the capture artifact records as read, with no
  corresponding declared schema, is reported as missing coverage rather than
  inferred from the handler.
- AC-F018-014: A route the capture artifact reports as uncaptured is carried
  into the inventory as uncaptured, and no empty observation set is substituted
  for it.
- AC-F018-015: A capture artifact whose recorded revision does not match the
  revision under verification is rejected with a diagnostic rather than admitted
  as stale evidence.
- AC-F018-009: `hollow check` run against a real generated project completes its
  verification phases and returns a result without a caller-supplied inventory.
- AC-F018-010: `hollow test` run against a real generated project selects and
  executes mapped tests and reports criterion results without a caller-supplied
  inventory.
- AC-F018-011: `hollow deploy` run against a real verified project assembles a
  deployment plan without a caller-supplied inventory.

## Out of scope

- Changing the verification phases, selection rules, or delivery rules owned by
  SH-F008, SH-F013, and SH-F016.
- Adding a verification phase or diagnostic category.
- Network access, remote evidence, or a hosted evidence service.
- A Deno Deploy adapter implementation, which remains SH-F013 and OPEN-011.
- Caching, incremental discovery, or a persistent index.

## Dependencies and assumptions

The loader consumes the public module boundaries of SH-F001 through SH-F007,
SH-F010, SH-F012, SH-F014, and SH-F019, and produces the inventory shapes owned
by SH-F008, SH-F013, and SH-F016. It adds no new verification authority.

SH-F019 supplies the observed behavior that no static artifact carries. The
loader treats a capture record as evidence of what executed under test, not as
evidence that untested behavior is correct. Whether uncaptured behavior fails
verification remains an SH-F008 decision.

OPEN-012 is resolved in the discovery requirements above: the SH-F001 project
configuration is the sole source of discoverable locations, and SH-F014 service
definitions scope discovery for a multi-service project. The loader therefore
depends on a project's declared configuration being present and valid before
evidence can be assembled, and a missing, unreadable, or invalid project
configuration is reported as a failure rather than a partial inventory.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T14:44:18Z.
- Approved criteria: AC-F018-001 through AC-F018-015.
- Governed-content digest:
  `sha256:d2ab29ec6e81591d1fda77dc8af5ab614905ec30af14ff8643efcd9062262dc7`.
- Decision source: Claude conversation; direct response `Approve both` after
  review of the capture-sourced behavioral evidence, the uncaptured-route and
  stale-artifact criteria, and the exact governed-content digest.

### Invalidated approval

- Status: invalidated by the change recorded below.
- Invalidated at: 2026-08-08T14:40:47Z.
- Reason: the owner selected runtime capture over authored declarations as the
  source of behavioral evidence. The behavioral-evidence requirements now source
  observed request locations, response statuses, and data operations from the
  SH-F019 capture artifact instead of the SH-F004 definitions, which own index
  definitions rather than call sites. AC-F018-008 was reworded to observed
  reads, and AC-F018-014 and AC-F018-015 were added for uncaptured routes and
  stale artifacts.
- Downstream impact: the nine implemented criteria are unaffected in substance.
  They cover project locations and requirement evidence, which this change does
  not touch, and they continue to pass. Their verification entry below is
  superseded and must be re-run against the re-approved content.

### Superseded approval

- Status: approved, then invalidated by the change recorded above.
- Approver: human-project-owner.
- Approved at: 2026-08-08T14:19:02Z.
- Approved criteria: AC-F018-001 through AC-F018-013.
- Governed-content digest:
  `sha256:c40a9ffdd22ee0368b0467ff98b75986e1a599a8c3ba2bcd14143914dd8c12bf`.
- Decision source: Claude conversation; direct response `Approved` after review
  of the corrected OPEN-012 resolution, the SH-F001 location source, the bounded
  criteria, and the exact governed-content digest.

### Invalidated approval

- Status: invalidated before any downstream evidence existed.
- Invalidated at: 2026-08-08T14:13:30Z.
- Reason: after approval, review found that the recorded OPEN-012 resolution
  misattributed the source of discoverable locations. The SH-F012 configuration
  governs runtime modes, keys, and secrets and declares no repository layout.
  Project locations are declared by the SH-F001 `SleepyHollowProject`
  configuration. Correcting the discovery requirements, adding SH-F001 to the
  dependencies, and widening AC-F018-013 to a missing configuration changed
  governed bytes.
- Current governed-content digest awaiting approval:
  `sha256:c40a9ffdd22ee0368b0467ff98b75986e1a599a8c3ba2bcd14143914dd8c12bf`.
- Downstream impact: none. No criterion mapping, red-state evidence,
  verification, or implementation existed at the time of invalidation.

### Superseded approval

- Status: approved, then invalidated by the correction recorded above.
- Approver: human-project-owner.
- Approved at: 2026-08-08T14:13:30Z.
- Approved criteria: AC-F018-001 through AC-F018-013.
- Governed-content digest:
  `sha256:f1c1343413ba11438bda1be28aa0dde456e6bb2119bf0b5eeee9a4850d2aa23a`.
- Decision source: Claude conversation; direct response `Approve` after review
  of the requirement scope, bounded criteria, dependencies, the OPEN-012
  resolution, and the exact governed-content digest.
- Superseded approval: an earlier revision bound
  `sha256:832c6d1059528d1d35c4c7e04826615aa6a0fd77a930f2f3af249c3e127025fa`
  and AC-F018-001 through AC-F018-011. Resolving OPEN-012 added SH-F014 to the
  dependencies, recorded the resolution in the discovery requirements, and added
  AC-F018-012 and AC-F018-013. That governed change invalidated the earlier
  digest before any test or implementation existed, so no downstream evidence
  was invalidated.

### Criterion mapping

- Status: incomplete. Twelve of fifteen approved criteria are mapped.
- AC-F018-001 -> `evidence_test.ts` on-disk evidence assembly test.
- AC-F018-002 -> `evidence_test.ts` governed-drift approval-binding test.
- AC-F018-003 -> `evidence_test.ts` status-only projection test.
- AC-F018-004 -> `evidence_test.ts` source-authored claim rejection test.
- AC-F018-005 -> `evidence_test.ts` deterministic repeat-load test.
- AC-F018-006 -> `evidence_test.ts` declared-location-only discovery test.
- AC-F018-007 -> `evidence_test.ts` malformed and duplicate fail-closed test.
- AC-F018-008 -> `evidence_test.ts` observed-read missing-coverage test.
- AC-F018-012 -> `evidence_test.ts` per-service scoping test.
- AC-F018-013 -> `evidence_test.ts` missing and invalid configuration test.
- AC-F018-014 -> `evidence_test.ts` uncaptured-route carry-through test.
- AC-F018-015 -> `evidence_test.ts` stale capture-artifact rejection test.
- AC-F018-009, AC-F018-010, and AC-F018-011 are unmapped. They require the
  command integration described in the blocking gap below.

### Red-state evidence

- Status: failed as expected for the twelve mapped criteria.
- Observed at: 2026-08-08T14:21:00Z for the first nine and 2026-08-08T14:52:00Z
  for AC-F018-008, AC-F018-014, and AC-F018-015.
- Base revision: `62d966e` for the first nine and `2ed9e80` for the second three,
  each with the approved requirement, mapped tests, and typed nonfunctional
  seams present.
- Commands: `deno task check:evidence` and `deno task test:evidence` using Deno
  `2.9.5` on macOS arm64.
- Result: type checking passed in both rounds, establishing a healthy typed
  baseline. The first round reported `0 passed | 9 failed` and the second
  reported `9 passed | 3 failed`, the three failures being the newly mapped
  criteria whose seams threw for unimplemented behavior.
- Red-state correction: in the first round AC-F018-006 initially passed against
  an empty seam because it asserted only the absence of an undeclared
  requirement. It was strengthened to assert the declared inventory and the read
  paths before implementation. A criterion test that passes against a
  nonfunctional seam is not red-state evidence.

### Verification, complete

- Status: passed for all fifteen approved criteria.
- Verified at: 2026-08-08T20:11:07Z.
- Command: `deno task verify:evidence`.
- Result: `15 passed | 0 failed`.
- Criterion mapping for the final three: AC-F018-009 -> `hollow check` executed
  against a generated project through the assembled loader, returning a
  versioned result with populated checks; AC-F018-010 -> the test inventory
  loader resolving real requirements from disk; AC-F018-011 -> the deployment
  inventory loader assembling a plan with real verification evidence.
- Integration: `cli/main.ts` now supplies the assembled check loader, so the
  shipped CLI no longer fails closed on a missing evidence loader.
- Regression caused and repaired: wiring the loader into the entry point
  introduced a `Deno.env` read at startup, which broke AC-F001-009 because the
  compiled standalone binary is granted only read and write permissions. The
  revision resolver was made lazy and permission-safe, so `hollow --version`
  never touches the environment. `verify:create` passes again.
- Regression scope: all eleven component suites pass at this revision.
- Residual risk: the assembled inventory reports typecheck and runner status
  from loaded evidence rather than executing a run, so a full `hollow check`
  still depends on `hollow test` having produced current capture evidence.

### Verification

- Status: not verified. Partial component verification only.
- Observed at: 2026-08-08T14:53:00Z.
- Command: `deno task verify:evidence`, comprising `deno fmt --check`,
  `deno lint`, `deno task check:evidence`, and `deno task test:evidence`.
- Result: `12 passed | 0 failed` for the mapped criteria.
- Regression scope: `verify:framework`, `verify:create`, `verify:planning`,
  `verify:check`, `verify:cli`, `verify:test-command`, `verify:dev`,
  `verify:skill`, `verify:deploy`, and `verify:capture` all passed at the same
  revision.
- Blocking gap: AC-F018-009, AC-F018-010, and AC-F018-011 have neither tests nor
  implementation. The loader assembles project locations, requirement evidence,
  and behavioral evidence into its own normalized shape, but does not yet
  produce the exact `VerificationInventory`, test inventory, and deployment
  inventory shapes those commands consume. Producing them additionally requires
  the test manifest, executed test results, dependency graph, and native runner
  output that SH-F007 and the SH-F008 runner supply. Until that mapping and the
  `cli/main.ts` wiring exist, `hollow check`, `hollow test`, and `hollow deploy`
  still fail closed without a caller-supplied inventory.
- This requirement must not be treated as verified until every approved
  criterion is mapped, red, implemented, and independently checked.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
