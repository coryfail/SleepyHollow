---
schema: sgad-component/v0.2
id: SH-F009
title: Official Sleepy Hollow agent skill
status: approved
risk: standard
source_sections:
  - "3"
  - "4"
  - "7.3"
depends_on:
  - SH-F006
  - SH-F007
  - SH-F008
open_decisions:
  - OPEN-010
owners:
  - Sleepy Hollow maintainers
---

# Official Sleepy Hollow agent skill

## Purpose

Provide the primary product experience that guides a compatible coding agent
from a plain-language idea through reviewed design, TDD implementation,
independent verification, and deployment.

## In scope

- Focused application discovery and architecture planning.
- Master and endpoint requirement generation.
- Human approval checkpoints.
- Acceptance-test generation and red-green-refactor implementation.
- Bounded repair based on framework diagnostics.
- Contract, client, and deployment orchestration.
- Progressive-disclosure references and portable agent guidance.
- Governed model decomposition, Drizzle repository ownership, and readable
  source standards.

## Requirements

The skill shall inspect existing context, ask only materially consequential
questions, record unresolved decisions, and plan the entire application before
endpoint code. It shall determine resources, data ownership, endpoints,
relationships, indexes, consumers, security, operations, deployment, and whether
one or multiple services are justified.

The skill shall not implement an endpoint before its requirement is approved.
For approved work it shall generate mapped tests, observe the expected failure,
implement the smallest conforming behavior, run relevant checks, repair bounded
implementation failures without changing approved behavior, and rely on
`hollow check` before declaring verification.

`SKILL.md` shall remain concise and route to directly relevant references for
planning, requirement formats, TDD, security, relational databases, service design, and
deployment. Portable `AGENTS.md`, `CLAUDE.md`, or Copilot guidance may summarize
conventions but shall not replace the official workflow.

For durable relational data, the skill shall plan and implement Drizzle by
default with a supported SQLite or PostgreSQL profile. It shall permit another
persistence approach only after a human explicitly names and confirms the
exception, with its technical reason and decision source recorded in the
application requirement. An application with no durable data shall record that
decision explicitly.

The skill shall require readable, normally maintained source: a useful TSDoc
comment for every application-owned function; readable multi-line implementation
blocks rather than compressed one-line code; and the project's formatter and
linter before independent verification. The formatter or linter cannot be
skipped or reported as advisory when declaring a change verified.

## Acceptance criteria

- AC-F009-001: Given a plain-language idea, the skill gathers only unresolved
  information that materially changes behavior or architecture.
- AC-F009-002: The skill produces a complete application requirement and requests
  design review before creating endpoint tests or source files.
- AC-F009-003: After application approval, the skill decomposes every proposed
  endpoint into named `<requirement-id>.req.md` files and presents the inventory without
  generating endpoint code.
- AC-F009-004: The skill accepts approval, revision, deferral, or rejection at the
  individual endpoint level.
- AC-F009-005: For one approved endpoint, the skill demonstrates mapped failing
  tests before implementation and passing tests afterward.
- AC-F009-006: Unexpected baseline failure stops implementation and is reported
  without being mislabeled as the expected red state.
- AC-F009-007: Bounded repair changes implementation only; a required behavioral
  change returns to requirement review.
- AC-F009-008: The skill declares an endpoint verified only after independent
  `hollow check` evidence passes.
- AC-F009-009: Authentication planning records actors, trust boundaries, tokens
  or sessions, expiration, revocation, transport, CSRF implications, and `401`
  and `403` behavior when applicable.
- AC-F009-010: Deployment asks for confirmation before the first external deploy
  or a materially risky production change.
- AC-F009-011: Completion reporting lists changed files, criterion coverage,
  verification results, contract outputs, deployment results, and remaining
  risks relevant to the selected work.
- AC-F009-012: Detailed guidance is loaded progressively from referenced files
  while mandatory workflow constraints remain in the primary skill instructions.
- AC-F009-013: For durable relational data, the skill selects Drizzle and a
  supported database profile by default; a different persistence approach is
  rejected unless a human's explicit confirmation and decision source are
  recorded.
- AC-F009-014: The skill requires TSDoc for every application-owned function,
  readable multi-line implementation blocks, and passing formatter and linter
  checks before declaring independent verification.
- AC-F009-015: Every proposed model is decomposed into
  `models/<model>/<model>.req.md`, `schema.ts`, `repository.ts`, and `types.ts`,
  with the requirement approved before its source is implemented.
- AC-F009-016: The skill keeps Drizzle and database-driver access inside model
  repositories and prohibits direct database access from route handlers.
- AC-F009-017: Model requirements govern fields, relationships, constraints,
  indexes, bounded access, retention, security, migrations, and repository tests;
  dependent endpoints cite the model requirement IDs they use.
- AC-F009-018: The skill applies one canonical application engineering standard
  to AI-generated and human-authored code, keeps human contributor guidance
  aligned with it, and covers formatting, documentation, naming, function
  limits, type safety, validation, errors, async work, architecture, persistence,
  security, structured logging, dependencies, tests, and governed exceptions.

## Out of scope

- A managed model runtime inside the framework.
- Model routing, token accounting, or autonomous agent hosting.
- Allowing portable instruction files to bypass approval or verification.

## Dependencies and assumptions

Codex, Claude, or another compatible host owns conversation, model selection, and
file editing. OPEN-010 evaluates which portable guidance remains reliable across
hosts.

## Governance record

> Historical verification note: Deno commands in the archived entries below
> describe the pre-Node/Bun implementation. They are retained as audit history
> only and are not the current framework or skill verification workflow.

### Invalidation, 0.2.0 named requirement files

- Status: prior approval and verification are stale for current content.
- Invalidated at: 2026-08-18T13:18:57Z.
- Reason: governed prose changed to adopt the approved named `*.req.md`
  convention and current artifact paths.
- Superseding authority: `named-requirement-files`, approved for AC-NRF-001
  through AC-NRF-014 at
  `sha256:e75c7a3c82796f8833779e32e3a740e02011cd35754082b7bc233b6f0baeb0eb`.
- Historical entries below remain intact and apply only to their recorded
  content digests and revisions.

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T22:36:53Z.
- Approved criteria: AC-F009-001 through AC-F009-012.
- Governed-content digest:
  `sha256:b0da46ef216f78fd63026af4930064b13a5bdcde5e6374398e20c8359b11ca57`.
- Decision source: owner review; direct response `Approve` after review
  of the requirement scope, bounded criteria, dependencies, open decisions, and
  exact governed-content digest.

### Criterion mapping

- AC-F009-001 -> `skill_test.ts` unresolved material discovery question test.
- AC-F009-002 -> `skill_test.ts` application-review artifact gate test.
- AC-F009-003 -> `skill_test.ts` decomposition premature-code test.
- AC-F009-004 -> `skill_test.ts` per-endpoint approval isolation test.
- AC-F009-005 -> `skill_test.ts` approval and expected-red implementation test.
- AC-F009-006 -> `skill_test.ts` broken-baseline discrimination test.
- AC-F009-007 -> `skill_test.ts` bounded-repair behavior and test-weakening
  test.
- AC-F009-008 -> `skill_test.ts` independent check-evidence verification test.
- AC-F009-009 -> `skill_test.ts` mandatory authentication-element test.
- AC-F009-010 -> `skill_test.ts` first and risky deployment confirmation test.
- AC-F009-011 -> `skill_test.ts` completion-report coverage and evidence test.
- AC-F009-012 -> `skill_test.ts` mandatory-constraint placement test against the
  shipped `SKILL.md` and eight references.
- AC-F009-013 -> `skill_test.ts` default-Drizzle and human-approved-exception
  test.
- AC-F009-014 -> `skill_test.ts` formatter and linter verification-gate test.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T22:46:04Z.
- Base revision: `96670b3e056838fd1a57db7bdbf133860a007534` plus the approved
  SH-F009 requirement, mapped skill tests, and typed nonfunctional seams.
- Commands: `deno task check:skill` and `deno task test:skill` using Deno
  `2.9.5` on macOS arm64.
- Result: `deno task check:skill` passed, establishing a healthy typed baseline.
  `deno task test:skill` reported `0 passed | 12 failed`. Every failure was an
  assertion failure identifying approved behavior absent from the seams, not a
  compilation error, unresolved import, or unavailable dependency.
- Baseline health: `deno task verify:planning` and `deno task verify:check`
  passed at the same revision, so no unrelated regression contaminated the run.

### Verification

- Status: passed for the governed orchestration boundary.
- Verified at: 2026-08-07T22:50:14Z.
- Command: `deno task verify:skill`, comprising `deno fmt --check`, `deno lint`,
  `deno task check:skill`, and `deno task test:skill`.
- Result: `12 passed | 0 failed`.
- Regression scope: `verify:framework`, `verify:create`, `verify:planning`,
  `verify:check`, `verify:cli`, `verify:test-command`, and `verify:dev` all
  passed at the same revision.
- Repair record: two mapped tests captured a thrown error through
  `assert.throws`, which returns `undefined` under `node:assert/strict`. The
  capture mechanism was corrected to a `caught` helper that returns the thrown
  error. No assertion was relaxed, no criterion narrowed, and no approved
  behavior changed.
- Residual risk: AC-F009-005 and AC-F009-008 are verified at the orchestration
  boundary using injected red-state and `CheckResult` evidence. End-to-end
  evidence against a real project additionally requires the SH-F008 repository
  evidence loader, which remains an unimplemented host boundary. Those two
  criteria are not yet closed by a live `hollow check` run.
- Residual risk: the mapped tests govern the documented workflow and the
  constraints carried in `SKILL.md`. They do not establish that a live agent
  host follows those constraints during a conversation. No automated control in
  this repository closes that gap.

### Verification, residual closure

- Status: passed. The blocking residual recorded above is resolved.
- Verified at: 2026-08-08T20:15:08Z.
- Command: `deno task verify:skill`, with `deno task verify:evidence` supplying
  the dependency evidence.
- Result: `12 passed | 0 failed` for SH-F009 and `15 passed | 0 failed` for
  SH-F018.
- Closure of AC-F009-005 and AC-F009-008: both were previously closed only at
  the orchestration boundary because no evidence loader existed. SH-F018 is now
  verified and AC-F018-009 demonstrates `hollow check` executing against a
  generated project through the assembled loader, so the independent
  verification the skill depends on runs against real projects rather than
  injected fixtures.
- Residual risk retained: the mapped tests govern the documented workflow and
  the constraints carried in `SKILL.md`. They do not establish that a live agent
  host follows those constraints during a conversation. No automated control in
  this repository closes that gap.

### Delivery

- Status: not applicable until delivery is authorized and attempted.

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: all acceptance criteria currently owned by SH-F009.
- Governed-content digest:
  `sha256:066e40e039176f056367fe5be646b4c28424143d0e09c522b36eff8b6c70b707`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.

### Approval, persistence and code-quality amendment

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-27T14:04:40Z.
- Approved criteria: AC-F009-001, AC-F009-002, AC-F009-003, AC-F009-004,
  AC-F009-005, AC-F009-006, AC-F009-007, AC-F009-008, AC-F009-009,
  AC-F009-010, AC-F009-011, AC-F009-012, AC-F009-013, AC-F009-014.
- Governed-content digest:
  `sha256:67183fb12a6da6f3f1a0052e5b70c4257d2ebe96069c5b962f9dbc2641a99d07`.
- Decision source: owner request in the current workspace conversation to make
  Drizzle the default unless a human confirms an exception and to enforce
  documented, readable code through verification.

### Approval, governed model architecture

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-27T17:49:55Z.
- Approved criteria: AC-F009-001, AC-F009-002, AC-F009-003, AC-F009-004,
  AC-F009-005, AC-F009-006, AC-F009-007, AC-F009-008, AC-F009-009,
  AC-F009-010, AC-F009-011, AC-F009-012, AC-F009-013, AC-F009-014,
  AC-F009-015, AC-F009-016, AC-F009-017.
- Governed-content digest:
  `sha256:b94938a613593495cb9111534e82e45dc60d72c2ee9f05d94098024011fd1ee6`.
- Decision source: owner direct response `Do it` after approving the proposed
  Drizzle, model ownership, repository boundary, and code-quality standards.

### Criterion mapping, governed model architecture

- AC-F009-015 -> `skills/sleepy-hollow/skill_test.ts` model-layout mandatory
  constraint test and `cli/evidence/standards_test.ts` layout checks.
- AC-F009-016 -> `skills/sleepy-hollow/skill_test.ts` repository-boundary
  mandatory constraint test and `cli/evidence/standards_test.ts` route check.
- AC-F009-017 -> `skills/sleepy-hollow/references/models.md` source review plus
  the model and check suites mapped by AC-F006-011, AC-F008-016, and AC-F018-016.

### Approval, shared application engineering standard

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-27T18:23:59Z.
- Approved criteria: AC-F009-001, AC-F009-002, AC-F009-003, AC-F009-004,
  AC-F009-005, AC-F009-006, AC-F009-007, AC-F009-008, AC-F009-009,
  AC-F009-010, AC-F009-011, AC-F009-012, AC-F009-013, AC-F009-014,
  AC-F009-015, AC-F009-016, AC-F009-017, AC-F009-018.
- Governed-content digest:
  `sha256:046c4edbaa174f705f9864d1d24a802158fad51108638816f7c62a4ee888967a`.
- Decision source: owner direct response `Let's do it` after specifying that the
  proposed code standards are the baseline for AI-generated and human-authored
  applications built with the framework and skill.

### Criterion mapping, shared application engineering standard

- AC-F009-018 -> `skills/sleepy-hollow/skill_test.ts` shared-standard invariant
  and canonical `references/code-quality.md` baseline assertions.
