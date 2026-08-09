---
schema: sgad-component/v0.2
id: SH-F006
title: Requirements planning and approval workflow
status: verified
risk: standard
source_sections:
  - "3.2"
  - "3.3"
  - "3.4"
  - "3.5"
  - "5"
depends_on:
  - SH-F001
open_decisions:
  - OPEN-004
owners:
  - Sleepy Hollow maintainers
---

# Requirements planning and approval workflow

## Purpose

Define the reviewable, machine-readable requirements artifacts that must exist
before Sleepy Hollow generates tests or application behavior.

## In scope

- Comprehensive application requirements.
- Endpoint-level decomposition and shared model or policy requirements.
- Structure-first API scaffolding.
- Stable frontmatter, acceptance identifiers, dependencies, and lifecycle state.
- Storage-neutral governance references and lifecycle-status projections.
- Endpoint-by-endpoint approval, revision, deferral, and rejection.

## Requirements

### Planning sequence

Planning shall inspect the current project before proposing changes and ask only
questions whose answers materially affect behavior or architecture. It shall
record unresolved material decisions as explicit open questions, assumptions, or
risks and shall not replace them with invented behavior.

Planning shall produce `requirements/application.md` before endpoint tests or
implementation. The application requirement shall cover purpose, actors and
consumers, scope and non-scope, data ownership and models, endpoints,
relationships, indexes, request and response conventions, errors,
authentication and authorization including an explicit `none` decision,
security, operations, deployment, service architecture, cross-cutting criteria,
dependencies, assumptions, risks, and open questions. The skill shall present
the exact application requirement for review and shall not decompose it until a
valid approval record binds its current governed-content digest.

After application approval, decomposition shall create the complete proposed API
directory structure and a `requirements.md` in every endpoint directory without
creating tests, route implementations, or generated contracts. Shared contracts
shall live in colocated shared model or policy requirements. The skill shall
present the endpoint inventory and dependency order before requesting endpoint
decisions.

Endpoint requirements shall include purpose, supported methods, inputs, success
and error responses, authentication, authorization, data access and indexes,
side effects, abuse considerations, dependencies, assumptions, and acceptance
criteria. A derived endpoint requirement shall cite the applicable application
sections and shall not contradict approved application behavior. A conflict
shall stop decomposition for that endpoint and report the endpoint requirement
location together with the conflicting application text.

### Portable requirement format

OPEN-004 is resolved with UTF-8 Markdown and one leading YAML 1.2 frontmatter
document. Frontmatter is delimited by lines containing exactly `---`; only the
YAML core scalar, sequence, and mapping types are accepted. Duplicate mapping
keys, aliases, merge keys, custom tags, multiple YAML documents, malformed YAML,
or text before the opening delimiter are invalid. The body remains ordinary
Markdown: authors do not need proprietary directives, hidden metadata, or a
Sleepy Hollow-specific markup language.

An application requirement shall use the `sgad-application/v0.2` schema and
contain a stable `id`, non-empty `title`, lifecycle `status`, `risk`,
`depends_on`, and `owners`. An endpoint requirement shall contain a stable `id`,
route `path`, lifecycle `status`, non-empty unique uppercase `methods`,
`depends_on`, and owning `service`. Lifecycle status is one of `draft`,
`approved`, or `verified`; dependency lists contain stable requirement IDs and
no duplicates.

The parser shall recognize acceptance criteria only as Markdown list items under
an `Acceptance criteria` section whose first text is a stable identifier followed
by a colon. It shall preserve identifier spelling, criterion order, and the
human-authored Markdown body without rewriting it. Empty, malformed, or duplicate
criterion identifiers are invalid. Requirement and criterion references shall
be validated against the complete proposed inventory so missing dependencies and
globally duplicate identifiers fail before approval.

Every parse or validation failure shall be deterministic and identify a stable
diagnostic code, file path, one-based line and column when available, and a safe
correction message. Validation shall collect independent errors in source order
instead of silently accepting a partial requirement.

### Approval and revision

Every generated application and endpoint `requirements.md` shall contain its
complete governance history: approval bound to exact content and bounded
criteria, bidirectional criterion-to-test mappings, credible red-state evidence,
independent verification, and applicable delivery results. Supporting Git,
review, CI, or attestation provenance may be linked, but no separate SGAD
governance artifact tree is created.

Approval shall name the requirement IDs and bounded criteria being approved,
record the approver, time, governed-content digest, and decision source, and
advance the readable status projection only when that record validates. An
explicit group decision applies only to the named requirements. Revision,
deferral, and rejection do not imply approval; their disposition and rationale
shall be recorded without changing unrelated requirements.

The initial lifecycle is `draft -> approved -> verified`. A behavioral revision
invalidates the affected approval and downstream evidence, returns the affected
requirement to `draft`, and reports transitively dependent requirements for
review. Frontmatter `status` remains workflow-routing metadata and a readable
lifecycle projection; it is not sole approval authority or verification evidence.

## Acceptance criteria

- AC-F006-001: Planning creates `requirements/application.md` containing every
  mandatory application-level topic before any endpoint test or implementation.
- AC-F006-002: Unresolved material decisions are recorded explicitly rather than
  replaced with invented behavior.
- AC-F006-003: Decomposition creates a complete proposed API directory tree with
  one `requirements.md` per endpoint and no endpoint tests or route files.
- AC-F006-004: Every endpoint requirement has parseable frontmatter containing a
  stable ID, path, status, methods, dependencies, and service.
- AC-F006-005: Every endpoint requirement contains the mandatory behavioral,
  security, data-access, dependency, and acceptance-criteria sections.
- AC-F006-006: A user can approve, revise, defer, or reject one endpoint without
  approving unrelated endpoints.
- AC-F006-007: Approving an explicit group changes only the named endpoint
  requirements.
- AC-F006-008: A change to approved behavior returns the affected requirement to
  `draft` and identifies dependent requirements needing review.
- AC-F006-009: Decomposition rejects behavior that contradicts the approved
  application requirement and identifies the conflicting source text.
- AC-F006-010: The requirement parser preserves stable criterion identifiers and
  reports malformed or duplicate identifiers with file locations.

## Out of scope

- A full enterprise requirements-management system.
- Complex approval state machines.
- Cryptographic locking of requirements or tests.

## Dependencies and assumptions

OPEN-004 is resolved by the portable Markdown and YAML frontmatter contract
above. SH-F001 supplies the valid generated project in which planning operates.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T15:48:26Z.
- Approved criteria: AC-F006-001 through AC-F006-010.
- Governed-content digest:
  `sha256:bb3f0852be6e4b17b67fd74a44657c56b49d8d6d807ccb3b733140d4f65a14ba`.
- Decision source: Codex conversation; direct response `Approved` after review
  of the requirement path, bounded criteria, standard-risk classification,
  SH-F001 dependency, portable Markdown and YAML parser decision, approval
  boundary, exact governed-content digest, and repository-consistency result.

### Criterion mapping

- AC-F006-001 -> `planning_test.ts` mandatory application-topic validation.
- AC-F006-002 -> `planning_test.ts` explicit unresolved-decision preservation.
- AC-F006-003 -> `planning_test.ts` structure-only endpoint decomposition.
- AC-F006-004 -> `planning_test.ts` strict endpoint-frontmatter parsing.
- AC-F006-005 -> `planning_test.ts` mandatory endpoint-section validation.
- AC-F006-006 -> `planning_test.ts` isolated single-endpoint decision.
- AC-F006-007 -> `planning_test.ts` explicitly bounded group approval.
- AC-F006-008 -> `planning_test.ts` revision invalidation and dependent review.
- AC-F006-009 -> `planning_test.ts` approved-application conflict rejection.
- AC-F006-010 -> `planning_test.ts` duplicate criterion source diagnostic.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T15:50:51Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F006 requirement, mapped planning tests, Deno task configuration, and the
  previously verified framework working tree.
- Commands: `deno task check:planning` and `deno task test:planning` using Deno
  `2.9.5` on macOS arm64.
- Test digest:
  `sha256:b96756483f22c25635b6c4aeb35b369678829c23172374f71cce2f8c4c5e57d1`.
- Result: planning type checking passed and planning tests passed 0/10.
- Expected failure: every planning criterion reached the healthy Deno runner
  and failed only through the explicit `SH_PLANNING_NOT_IMPLEMENTED` seam; no
  dependency, permission, assertion-runner, or unrelated regression failure
  obscured the missing approved behavior.

### Verification

- Status: passed.
- Verified at: 2026-08-07T15:59:47Z.
- Requirement digest:
  `sha256:bb3f0852be6e4b17b67fd74a44657c56b49d8d6d807ccb3b733140d4f65a14ba`.
- Implementation manifest digest:
  `sha256:3f0b136b3cd84ced60c85db761f3d62302aa4210a30b4f95c54f3e2c5abc9921`.
- Test digest:
  `sha256:b96756483f22c25635b6c4aeb35b369678829c23172374f71cce2f8c4c5e57d1`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Verifier: Deno `2.9.5` format, lint, type, and test tasks plus the canonical
  repository and cross-browser website verifier on macOS arm64.
- Results: planning passed 10/10; the previously verified framework passed
  48/48 with thirteen nested steps; project creation passed 9/9; repository
  governance passed 9/9; website structure passed 16/16; links passed 1/1;
  React passed 8/8; TypeScript and production build passed; Playwright and Axe
  passed 66/66 across Chromium, Firefox, and WebKit; `git diff --check` passed.
- Residual risk: natural-language contradiction discovery remains an agent
  judgment; deterministic planning validates exact application citations and
  rejects every conflict supplied by that semantic planning step with both
  source texts and a safe correction path.

### Delivery

- Status: not applicable; no commit, push, publication, or deployment was
  authorized or attempted.
