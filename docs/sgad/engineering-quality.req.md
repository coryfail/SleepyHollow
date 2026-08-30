---
schema: sgad-component/v0.2
id: sgad-engineering-quality
title: Framework-independent engineering quality baseline
status: verified
risk: standard
depends_on:
  - sgad-methodology
open_decisions: []
owners:
  - SGAD methodology maintainers
---

# Framework-independent engineering quality baseline

## Purpose

Define the minimum engineering-quality obligations for software governed by
Specification-Governed Agentic Development, regardless of whether humans,
agents, or both produce the implementation. Preserve each adopting project's
authority to choose standards appropriate to its language, framework, risk, and
toolchain.

## Authorized scope

- Add a small, technology-neutral engineering-quality baseline to SGAD.
- Require adopting projects to publish deterministic, repository-visible coding
  standards that extend the SGAD baseline.
- Apply the same declared standards to human-authored and agent-authored changes.
- Require independent verification of applicable declared quality checks.
- Define bounded, auditable exceptions when a standard cannot be satisfied.
- Introduce the new normative obligations only through a new SGAD methodology
  version rather than retroactively changing an existing conformance claim.

## Requirements

SGAD shall require each adopting project to identify a repository-visible
engineering standard, its governed scope, and the deterministic commands or
controls that enforce it. Project policy may define multiple standards for
different components when their ownership and applicability are unambiguous.
The selected standard shall apply equally to implementation produced by humans,
agents, or mixed teams.

The SGAD baseline shall require authored source to be readable and maintainable.
Authored source shall use ordinary source layout instead of compressed or
minified presentation; names shall communicate intent; modules and functions
shall have cohesive responsibilities; duplicated or excessive complexity shall
be reduced or governed by explicit project thresholds; public contracts and
non-obvious decisions, invariants, and tradeoffs shall be documented; errors
shall be handled explicitly; and inputs shall be validated at applicable trust
boundaries.

Delivery-ready authored source shall not contain exposed secrets, accidental
debugging residue, dead code, or unresolved implementation placeholders.
Generated and vendored source shall be distinguishable from authored source,
shall identify its canonical origin or regeneration path when applicable, and
shall not be edited as though it were the canonical implementation.

SGAD Core shall not mandate a programming language, framework, persistence
technology, formatter, linter, naming scheme, file layout, line length, comment
quota, code-coverage percentage, complexity threshold, or dependency catalog.
The adopting project shall own those decisions, including whether its policy
requires documentation for every function. SGAD's documentation baseline shall
favor useful explanations of contracts and reasoning over comments that merely
repeat syntax.

The project's independent verifier shall run or validate every quality control
declared applicable by policy. Depending on the project and change, these may
include formatting, linting, type analysis, compilation, tests, security checks,
dependency checks, documentation checks, generated-artifact checks, or other
deterministic controls. A missing, stale, bypassed, malformed, or failing
required control shall prevent verification. The verification record shall
identify the policy revision, commands or controls, applicability decisions,
results, and residual exceptions.

An exception shall identify the unmet rule, bounded scope, approving authority,
rationale, duration or review condition, residual risk, compensating controls,
and removal condition. An exception shall not silently redefine the standard or
allow a project to claim unqualified conformance.

## Acceptance criteria

- AC-SGAD-EQ-001: SGAD defines a technology-neutral engineering-quality baseline
  that applies equally to human-authored, agent-authored, and mixed-author
  implementation.
- AC-SGAD-EQ-002: An adopting project declares a repository-visible engineering
  standard, its applicability, and deterministic enforcement controls without
  SGAD prescribing a particular language, framework, persistence technology, or
  toolchain.
- AC-SGAD-EQ-003: The baseline requires readable, maintainable authored source
  with intentional naming and structure, cohesive responsibilities, governed
  complexity and duplication, meaningful documentation, explicit error
  handling, and trust-boundary validation.
- AC-SGAD-EQ-004: The baseline prohibits exposed secrets, accidental debugging
  residue, dead code, and unresolved implementation placeholders in
  delivery-ready authored source.
- AC-SGAD-EQ-005: Generated and vendored source is distinguishable from authored
  source and retains a canonical origin or regeneration path when applicable.
- AC-SGAD-EQ-006: Project policy owns technology-specific formatting, naming,
  organization, documentation, coverage, complexity, architecture, and
  dependency rules; SGAD Core does not impose a comment-on-every-function rule.
- AC-SGAD-EQ-007: Independent verification records the exact engineering policy,
  applicability decisions, required controls, results, and residual exceptions,
  and fails closed when a required quality control is missing, stale, bypassed,
  malformed, or failing.
- AC-SGAD-EQ-008: Quality exceptions are explicit, bounded, authorized,
  risk-assessed, time- or condition-limited, compensated where necessary, and
  incompatible with an unqualified conformance claim.
- AC-SGAD-EQ-009: The new normative baseline is versioned as a methodology
  evolution and does not retroactively alter the meaning of SGAD Core 0.2.0.

## Out of scope

- Defining standards for a particular framework, ORM, database, language, or
  repository.
- Replacing project-specific security, accessibility, performance, reliability,
  privacy, compliance, or operational requirements.
- Requiring projects to replace working quality tools with SGAD-specific tools.
- Treating style conformance as proof that behavioral intent is complete or
  correct.
- Implementing a universal formatter, linter, compiler, or quality verifier.

## Dependencies and assumptions

- `sgad-methodology` continues to own SGAD's authority, evidence, lifecycle, and
  conformance model.
- Adopting projects can identify deterministic controls appropriate to their
  technology and risk.
- Project policy can distinguish authored, generated, and vendored source when
  different rules apply.

## Change impact

Implementation affects SGAD principles, conformance rules, adoption guidance,
verification guidance, the portable SGAD workflow skill, and repository checks.
Because the proposal adds normative conformance obligations, it requires a new
SGAD methodology version and compatibility notes; existing SGAD Core 0.2.0
claims retain their original meaning.

## Approval scope

Approval covers AC-SGAD-EQ-001 through AC-SGAD-EQ-009 and authorizes only the
framework-independent methodology, skill, templates or guidance, and
verification changes required to satisfy them. It does not authorize standards
for any particular application framework or project.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted. Append history; do not rewrite old
entries to make stale evidence appear current.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-30T01:18:48Z.
- Approved criteria: AC-SGAD-EQ-001 through AC-SGAD-EQ-009.
- Governed-content digest:
  `sha256:eb7a2fbae692e48787b0e779ab042c30f2f8a3c4597ac056ae47e44cfc7661c4`.
- Decision source: direct owner response `Approved` after review of the exact
  governed content and digest.

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-SGAD-EQ-001 through AC-SGAD-EQ-006 | `website/tests/repository-consistency.test.mjs` — `SGAD defines a portable engineering-quality baseline` |
| AC-SGAD-EQ-007 through AC-SGAD-EQ-008 | `website/tests/repository-consistency.test.mjs` — `SGAD verifies declared controls and bounded exceptions` |
| AC-SGAD-EQ-009 | `website/tests/repository-consistency.test.mjs` — `engineering quality evolves SGAD without redefining Core 0.2.0`; existing `AC-NRF-012` version-alignment check |

### Red-state evidence

- Status: failed as expected for all newly mapped behavior.
- Observed at: 2026-08-30T01:20:53Z.
- Baseline revision: `b2bd7c7632b0a3864016b57e86127eec41c038d5`.
- Runner: Node.js test runner through `npm run test:repository` in `website`;
  focused confirmation used
  `node --test --test-name-pattern='AC-SGAD-EQ|AC-NRF-012' tests/repository-consistency.test.mjs`.
- Test file digest:
  `sha256:8208887c737000d45cb27950d47c0ae766b8ff48c4359828c66fcec3879f8191`.
- Observed result: the full repository suite retained 11 passing preexisting
  checks and failed only the four checks mapped above. The focused run reported
  four tests, zero passed, and four failed.
- Expected reason: SGAD still declared version 0.2.0 and neither the canonical
  nor packaged engineering-quality guidance existed. The failures demonstrate
  absence of the approved behavior; the runner, repository parsing, existing
  governance checks, and unrelated assertions remained healthy.

### Red-state evidence, refreshed after test correction

- Status: failed as expected for all newly mapped behavior.
- Refreshed at: 2026-08-30T01:25:08Z.
- Baseline revision:
  `b2bd7c7632b0a3864016b57e86127eec41c038d5` in an isolated local clone.
- Current test file digest:
  `sha256:4367c9d44b7e573d9b81a3424c9ac100110f559a406fd1b5715cf5f6c6766844`.
- Command:
  `node --test --test-name-pattern='AC-SGAD-EQ|AC-NRF-012' tests/repository-consistency.test.mjs`.
- Observed result: four tests, zero passed, and four failed because the baseline
  reported SGAD 0.2.0 and lacked both engineering-quality artifacts.
- Refresh reason: the technology-independence assertion originally matched
  `ORM` inside the unrelated word `formatting`. It now matches `ORM` only as a
  whole word. The corrected test was copied onto the isolated baseline with this
  approved requirement, reproducing the intended missing-behavior failures
  without using the implementation under test.

### Verification

- Status: passed.
- Verified at: 2026-08-30T01:28:22Z.
- Approved requirement digest:
  `sha256:eb7a2fbae692e48787b0e779ab042c30f2f8a3c4597ac056ae47e44cfc7661c4`.
- Skill-package control: the skill-creator `quick_validate.py` command reported
  `Skill is valid!`; its missing host dependency was supplied only through an
  isolated temporary directory and did not change the project or system Python.
- Framework control: root `npm run verify` passed type analysis, Node and Bun
  builds, 27 test files with 240 passed and 6 skipped in each runtime, and all 5
  platform-baseline checks.
- Methodology and website controls: the website verifier passed 34 structural
  checks, 1 link check, 15 repository checks, 8 framework-documentation checks,
  15 component tests, type analysis, and 186 Playwright checks across Chromium,
  Firefox, and WebKit. The browser command was rerun outside the filesystem
  sandbox because the preview server could not bind to its loopback port inside
  the sandbox.
- Content-binding control: `scripts/check-governed-digests.ts` confirmed this
  verified projection retains the exact approved digest, and `git diff --check`
  passed.
- Residual risks: the documentation build reports four existing TypeDoc link
  warnings unrelated to this change. The overall SGAD methodology remains a
  public draft, and no commit, publication, or external delivery was performed.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
- Verified source, target, result, and time: pending when applicable.
