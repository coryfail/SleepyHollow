---
id: SH-F009
title: Official SleepyHollow agent skill
status: draft
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
---

# Official SleepyHollow agent skill

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
