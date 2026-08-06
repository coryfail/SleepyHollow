---
id: SH-F017
title: Standalone SGAD workflow skill
status: approved
source_sections:
  - "4.6"
  - "15.1"
  - "16"
  - "17"
depends_on: []
open_decisions: []
---

# Standalone SGAD workflow skill

## Purpose

Help developers apply Specification-Governed Agentic Development in any software
repository while preserving human authority, bounded agent autonomy, stable
traceability, and independently checkable evidence.

## In scope

- Greenfield and honest brownfield SGAD adoption.
- Repository governance and risk-boundary discovery.
- Application and component specification workflows.
- Exact-content approval, stable criteria, and bidirectional test traceability.
- Credible red-state evidence and approval-bounded implementation.
- Independent verification, delivery evidence, and change invalidation.
- Progressive methodology references and portable artifact templates.
- Standard repository discovery and installation through the open agent-skills
  CLI.

## Requirements

The SGAD workflow skill shall be independently usable without the SleepyHollow
runtime, CLI, or application skill. It shall adapt to the repository's language,
framework, agent host, source-control platform, test runner, verifier, and
deployment target while preserving SGAD Core gates.

Before governed implementation, the skill shall inspect repository policy and
existing artifacts, identify the governed boundary and risk, record material
unknowns, and determine the approving authority and independent verification
control. It shall create or revise written system and component intent before
tests or implementation. It shall not interpret a mutable `status` value or its
own prose as approval.

For approved behavior, the skill shall map stable acceptance criteria to tests,
observe and classify the pre-implementation result, stop on unrelated baseline
failure, implement only authorized scope, and refuse to weaken intent or tests to
obtain success. It shall route behavioral discoveries back to draft review and
invalidate dependent evidence when governed inputs change.

The skill shall distinguish producer activity from verification. Completion
shall identify exact requirement and implementation revisions, approval,
criterion mappings, red-state evidence, verifier-controlled checks, delivery
evidence when applicable, exceptions, and residual risk. It shall not claim SGAD
conformance when required evidence is missing.

`SKILL.md` shall keep the non-negotiable gates concise and load detailed
workflow, artifact, verification, adoption, and conformance guidance
progressively. The skill shall include portable application-requirement,
component-requirement, and verification-report templates.

The complete package shall live at `skills/sgad-workflow` and retain the skill
name `sgad-workflow`. The repository shall support the unambiguous installation
command `npx skills add coryfail/SleepyHollow --skill sgad-workflow` without a
branch name or nested GitHub URL in the public instruction.

## Acceptance criteria

- AC-F017-001: The skill metadata triggers for requests to adopt, operate,
  assess, or explain an SGAD development workflow without requiring
  SleepyHollow.
- AC-F017-002: In an arbitrary repository, the skill discovers applicable
  governance, risk, authority, canonical artifact locations, verification, and
  delivery controls before governed implementation.
- AC-F017-003: The skill records material unresolved decisions and does not
  silently convert assumptions into authorized behavior.
- AC-F017-004: New governed behavior receives written system or component intent
  with stable acceptance criteria before material implementation begins.
- AC-F017-005: The skill requires independently checkable approval bound to the
  exact requirement revision and never treats an editable status field or agent
  assertion as approval.
- AC-F017-006: Every approved criterion maps to a test or evaluation and every
  governed acceptance test maps back to approved intent or a documented policy
  invariant.
- AC-F017-007: The skill runs mapped tests against the pre-implementation
  baseline, distinguishes credible missing-behavior failure from an unrelated
  broken baseline, and stops on the latter.
- AC-F017-008: Implementation remains within approved scope; a necessary
  behavioral revision returns the requirement to draft and invalidates affected
  approval and evidence.
- AC-F017-009: Verification relies on the repository's independent control and
  reports exact inputs, checks, results, exceptions, and residual risks rather
  than trusting the producing agent's completion statement.
- AC-F017-010: Brownfield adoption uses characterization evidence and states
  missing historical evidence honestly instead of fabricating approval or a red
  phase.
- AC-F017-011: The skill can guide evidence-bound delivery and subsequent impact
  invalidation without performing an unauthorized external mutation.
- AC-F017-012: The primary instructions route progressively to framework-neutral
  workflow, artifact, verification, adoption, and conformance references and
  provide parseable portable templates.
- AC-F017-013: The `skills/sgad-workflow` package is discovered as
  `sgad-workflow` by the open agent-skills CLI when addressed through
  `coryfail/SleepyHollow`, and the public install command selects only that
  skill.

## Out of scope

- Implementing a universal SGAD verifier, approval service, CI platform, or
  deployment system.
- Replacing project-specific security, quality, compliance, or operational
  policy.
- Granting approval, certifying the producer's own work, or claiming that passing
  evidence proves an incomplete specification is correct.
- Requiring SleepyHollow or any particular agent, model, language, framework,
  repository host, test runner, or deployment target.

## Dependencies and assumptions

The canonical methodology lives in `docs/sgad/`. The skill packages a concise,
portable operating workflow and templates derived from those documents. Adopting
repositories remain responsible for defining authorized approvers and a verifier
appropriate to their stack and risk.
