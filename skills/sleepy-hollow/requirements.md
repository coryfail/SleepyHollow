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
planning, requirement formats, TDD, security, Deno KV, service design, and
deployment. Portable `AGENTS.md`, `CLAUDE.md`, or Copilot guidance may summarize
conventions but shall not replace the official workflow.

## Acceptance criteria

- AC-F009-001: Given a plain-language idea, the skill gathers only unresolved
  information that materially changes behavior or architecture.
- AC-F009-002: The skill produces a complete application requirement and requests
  design review before creating endpoint tests or source files.
- AC-F009-003: After application approval, the skill decomposes every proposed
  endpoint into `requirements.md` files and presents the inventory without
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

## Out of scope

- A managed model runtime inside the framework.
- Model routing, token accounting, or autonomous agent hosting.
- Allowing portable instruction files to bypass approval or verification.

## Dependencies and assumptions

Codex, Claude, or another compatible host owns conversation, model selection, and
file editing. OPEN-010 evaluates which portable guidance remains reliable across
hosts.

## Governance record

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
- Decision source: Claude conversation; direct response `Approve` after review
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
  shipped `SKILL.md` and seven references.

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

### Delivery

- Status: not applicable until delivery is authorized and attempted.
