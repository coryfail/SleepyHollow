---
schema: sgad-component/v0.2
id: sgad-methodology
title: Specification-Governed Agentic Development methodology
status: verified
risk: standard
depends_on: []
owners:
  - Sleepy Hollow maintainers
---

# SGAD methodology requirements

## Purpose

Define a framework-independent methodology that preserves human authority over
intent, bounds agent autonomy, and requires independently checkable evidence for
governed software lifecycle transitions.

## Authorized scope

- Define the SGAD purpose, terminology, principles, workflow, artifacts,
  lifecycle, verification model, adoption path, and conformance rules.
- Provide portable templates for application and component requirements with
  embedded approval, mapping, red-state, verification, and delivery records.
- Place application, component, and repository-wide requirements according to
  the behavior they own.
- Define how SGAD extends to nondeterministic AI systems.
- Describe Sleepy Hollow as a reference implementation without making it a
  dependency of SGAD.

## Out of scope

- Implementing an SGAD verifier or managed approval service.
- Mandating a programming language, framework, coding agent, model provider,
  repository host, test runner, or deployment target.
- Claiming that verification proves an incomplete or incorrect specification.
- Claiming SGAD Core conformance before the methodology requirement is approved
  and its criteria have valid evidence.
- Trademark or standards-body registration.

## Acceptance criteria

- AC-SGAD-001: The methodology distinguishes intent validation, implementation
  authority, agent execution, and independent verification as separate concerns.
- AC-SGAD-002: The methodology states that humans or another explicitly
  authorized source own behavioral intent and that agents may not invent missing
  authority.
- AC-SGAD-003: The methodology defines `draft`, `approved`, and `verified` and
  does not treat an editable status field alone as evidence of a transition.
- AC-SGAD-004: Approval is bound to the exact specification content and bounded
  criteria it authorizes.
- AC-SGAD-005: Every approved acceptance criterion must have stable identity and
  bidirectional traceability to tests or evaluations.
- AC-SGAD-006: New governed behavior requires credible expected red-state
  evidence before implementation satisfies it.
- AC-SGAD-007: Verification must not rely solely on the producing agent's status
  change, prose report, or interpretation of its own output.
- AC-SGAD-008: Material changes to requirements, tests, implementation,
  dependencies, policy, configuration, artifacts, or environment invalidate the
  affected authority or evidence.
- AC-SGAD-009: Required approval, autonomy, tests, verification, and delivery
  controls scale with declared risk while preserving all SGAD Core invariants.
- AC-SGAD-010: The verification model addresses fabricated success, weakened
  tests, incomplete traceability, stale artifacts, dependency impact, and
  production revision drift.
- AC-SGAD-011: The methodology defines a portable SGAD Core conformance claim and
  stronger optional capability profiles without requiring Sleepy Hollow.
- AC-SGAD-012: The adoption guide provides a staged path usable in greenfield and
  brownfield repositories with existing tools.
- AC-SGAD-013: The AI-system extension represents nondeterministic results with
  versioned evaluations, distributions, uncertainty, safety evidence, and
  monitoring rather than absolute claims.
- AC-SGAD-014: The templates are parseable Markdown with YAML frontmatter and
  preserve stable identifiers, explicit scope, acceptance criteria, approval
  references, and verification evidence.
- AC-SGAD-015: All internal Markdown links resolve and the methodology documents
  pass the repository's whitespace validation.
- AC-SGAD-016: The methodology identifies its influences without claiming that
  specification-driven development, TDD, BDD, traceability, or policy as code are
  newly invented by SGAD.
- AC-SGAD-017: SGAD applies its own rules to methodology changes and identifies
  the current documentation as a draft until approval and verification evidence
  exist.
- AC-SGAD-018: Requirement placement follows behavioral ownership:
  `requirements/application.md` owns application-wide intent, component
  requirements are colocated, and optional root `requirements.md` is reserved
  for irreducible repository-wide behavior.

## Dependencies and assumptions

- Source control can identify immutable revisions or content digests.
- Projects can define an authority for approving behavior.
- Each adopting stack can provide a verifier appropriate to its behavior and
  risk.
- Normative conformance language will receive compatibility review before SGAD
  advances beyond version 0.1 draft.

## Change impact

Changes may affect every SGAD document, template, reference implementation,
conformance claim, and adopter. Normative changes require a version and
compatibility assessment.

## Approval scope

Approval should cover the methodology purpose, all AC-SGAD criteria, SGAD Core
normative requirements, optional capability profiles, and the version 0.1
templates. Partial approval must list excluded criteria explicitly.

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
  `sha256:57783395c036abbf2377fb811e4c7956ce72aa87bba928d2685ed10be568ea03`.
- Decision source: owner review; direct response `Approve` after review
  of the canonical SGAD methodology documentation and the exact governed-content digest.

### Approval

- Status: pending exact-content approval.
- Approver, time, criteria, digest, and decision source: pending.

### Verification, current content

- Status: passed for the re-approved content.
- Verified at: 2026-08-08T20:24:58Z.
- Commands: `npm run test:links`, `npm run test:repository`, and
  `npm run test:structure` in `website`.
- Result: all three suites pass, covering the repository-consistency suite covering the canonical methodology documents.
- Scope of this entry: it establishes that the current content is consistent and
  that its mapped repository checks pass. It supersedes the historical entries
  below, which were bound to digests that no longer match this file.
- Residual risk: browser-level acceptance through Playwright was not executed in
  this environment, so rendered-page behavior rests on the structural suites
  rather than a live browser run.

### Criterion mapping

- Status: pending approval and governed checks.

### Red-state evidence

- Status: pending approved test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable while the methodology remains a public draft.
