---
schema: sgad-component/v0.2
id: SH-F017
title: Standalone SGAD workflow skill
status: verified
risk: standard
source_sections:
  - "4.6"
  - "15.1"
  - "16"
  - "17"
depends_on: []
open_decisions: []
owners:
  - Sleepy Hollow maintainers
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

The SGAD workflow skill shall be independently usable without the Sleepy Hollow
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
progressively. The skill shall include portable application- and
component-requirement templates with complete embedded governance records.
It shall place application, component, and repository-wide requirements
according to the behavior they own.

The complete package shall live at `skills/sgad-workflow` and retain the skill
name `sgad-workflow`. The repository shall support the unambiguous installation
command `npx skills add coryfail/SleepyHollow --skill sgad-workflow` without a
branch name or nested GitHub URL in the public instruction.

## Acceptance criteria

- AC-F017-001: The skill metadata triggers for requests to adopt, operate,
  assess, or explain an SGAD development workflow without requiring
  Sleepy Hollow.
- AC-F017-002: In an arbitrary repository, the skill discovers applicable
  governance, risk, authority, canonical requirement locations, embedded
  governance records, verification, and delivery controls before governed
  implementation, then places requirements according to application,
  component, or repository-wide ownership.
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
- Requiring Sleepy Hollow or any particular agent, model, language, framework,
  repository host, test runner, or deployment target.

## Dependencies and assumptions

The canonical methodology lives in `docs/sgad/`. The skill packages a concise,
portable operating workflow and templates derived from those documents. Adopting
repositories remain responsible for defining authorized approvers and a verifier
appropriate to their stack and risk.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T20:21:37Z.
- Approved criteria: the criteria recorded in this requirement.
- Governed-content digest:
  `sha256:6fe479cf0963f8068dbe05e476150794cccf0e9960b8730da50d73f77eef1374`.
- Decision source: Claude conversation; direct response `Approve` after review
  of the current content after the unbound-approval correction and the exact governed-content digest.

### Approval, unbound

- Status: no recorded approval binds the current content.
- Observed at: 2026-08-08T20:20:04Z.
- Current governed-content digest:
  `sha256:6fe479cf0963f8068dbe05e476150794cccf0e9960b8730da50d73f77eef1374`.
- Finding: recomputing the canonical governed-content digest for this file
  matches none of the digests recorded below. The content has changed since
  every recorded approval, so the `approved` projection asserted authority the
  digest disproves. The status is corrected to `draft` pending re-approval of
  the current content.
- No downstream evidence is invalidated by this correction, because the
  correction records a drift that already existed rather than introducing one.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-06T19:19:08Z.
- Approved criteria: AC-F017-001 through AC-F017-013.
- Historical requirement digest:
  `sha256:f080aba49ed769339a504cd21be0bfed710b77f2a44071caae910dfb994ce64c`.
- Decision source: Codex conversation; publish the standalone SGAD workflow
  skill for framework-independent use.

### Verification, current content

- Status: passed for the re-approved content.
- Verified at: 2026-08-08T20:24:58Z.
- Commands: `npm run test:links`, `npm run test:repository`, and
  `npm run test:structure` in `website`.
- Result: all three suites pass, covering the repository-consistency suite covering the packaged skill and its references.
- Scope of this entry: it establishes that the current content is consistent and
  that its mapped repository checks pass. It supersedes the historical entries
  below, which were bound to digests that no longer match this file.
- Residual risk: browser-level acceptance through Playwright was not executed in
  this environment, so rendered-page behavior rests on the structural suites
  rather than a live browser run.

### Criterion mapping

- AC-F017-001 through AC-F017-012 -> standalone skill source review,
  canonical/package template comparison, and skill-creator validation.
- AC-F017-013 -> website structural, React, link-target, browser, and local
  agent-skills package-discovery checks.

### Red-state evidence

- Status: failed-as-expected for the short-install correction.
- Base revision: `05e2aab`.
- The focused structural and rendered checks failed before the short
  `npx skills add coryfail/SleepyHollow --skill sgad-workflow` command and local
  package target existed; the runner and unrelated website checks were healthy.

### Verification

- Status: passed at 2026-08-06T19:22:50Z for the historical approved revision.
- Verifier: structural source checks, React tests, local skill-target validation,
  and Chromium desktop/mobile behavior.
- Result: the short install command, package discovery, page presentation, and
  approved AC-WEB-SGAD-012 integration all passed.
- Current repository-wide verification is recorded in root `requirements.md`.

### Delivery

- Status: no independent delivery record was retained for SH-F017.
