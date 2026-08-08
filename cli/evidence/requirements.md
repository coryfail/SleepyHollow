---
schema: sgad-component/v0.2
id: SH-F018
title: Repository evidence loader
status: approved
risk: standard
source_sections:
  - "3.6"
  - "8"
  - "11"
  - "12"
depends_on:
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

OPEN-012 is resolved with declared configuration as the sole source of
discoverable locations. The loader shall derive the API directory, requirements
locations, and generated-output location from the SH-F012 typed configuration.
When a project declares multiple services under SH-F014, the loader shall derive
each service's roots from that service declaration and shall scope discovery per
service so that one service's evidence is never attributed to another. No
separate discovery manifest is introduced, and undeclared locations are not
discovered.

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

The loader shall discover routes through the SH-F002 route discovery,
request and response schema coverage through the SH-F003 definitions, declared
authentication and authorization through the SH-F005 declarations, data
operations and declared indexes through the SH-F004 definitions, and
configuration diagnostics through SH-F012. Generated-artifact state and contract
changes come from SH-F010.

The loader shall not infer behavior that a project does not declare. A location
a handler reads without a declared schema is reported as missing coverage rather
than inferred.

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
- AC-F018-013: An invalid or unreadable project configuration fails closed with
  a diagnostic and produces no partial inventory.
- AC-F018-007: A malformed requirement, unreadable declared location, or
  duplicate requirement identity fails closed with a diagnostic identifying the
  file, the line when known, and the correction.
- AC-F018-008: A handler-read request location with no declared schema is
  reported as missing coverage rather than inferred from the handler.
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

The loader consumes the public module boundaries of SH-F002 through SH-F007,
SH-F010, SH-F012, and SH-F014, and produces the inventory shapes owned by
SH-F008, SH-F013, and SH-F016. It adds no new verification authority.

OPEN-012 is resolved in the discovery requirements above: declared configuration
is the sole source of discoverable locations, and SH-F014 service declarations
scope discovery for a multi-service project. The loader therefore depends on a
project's configuration being valid before evidence can be assembled, and an
invalid configuration is reported as a failure rather than a partial inventory.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
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

- Status: pending approval and governed tests.

### Red-state evidence

- Status: pending approved test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
