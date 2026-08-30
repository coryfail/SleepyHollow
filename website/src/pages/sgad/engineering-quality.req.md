---
schema: sgad-component/v0.2
id: website-sgad-engineering-quality
title: SGAD engineering quality frontend section
status: verified
risk: standard
depends_on:
  - website-sgad-page
  - sgad-engineering-quality
  - website-docs-section
open_decisions: []
owners:
  - SGAD methodology maintainers
---

# SGAD engineering quality frontend section requirements

## Purpose

Make SGAD Core 0.3.0's engineering-quality boundary understandable on the public
methodology page without turning SGAD into a framework-specific style guide.

## Authorized scope

- Identify the public draft as SGAD Core 0.3.0.
- Add one concise engineering-quality section to the existing SGAD page.
- Explain the shared human-and-agent baseline, project-owned extensions,
  independent controls, and bounded exceptions.
- Link to the complete canonical SGAD engineering-quality guide.
- Extend the existing nocturnal editorial system without redesigning the page.

## Requirements

The section shall state that human-authored, agent-authored, and mixed-author
implementation follow the same declared engineering standard. It shall explain
that SGAD supplies a technology-neutral baseline while each adopting project
owns concrete formatting, naming, organization, documentation, coverage,
complexity, architecture, dependency, and tool decisions.

The section shall summarize the baseline in reader-facing terms: readable
authored source, cohesive responsibilities, meaningful contract and decision
documentation, explicit error handling, trust-boundary validation, clean
delivery-ready source, and distinguishable generated or vendored artifacts.

The section shall explain that independent verification records the applicable
policy revision and required controls, fails closed when required checks are
missing or failing, and qualifies conformance while an applicable exception is
active. It shall not imply that style or tool success proves behavioral
correctness.

The section shall not name or prescribe a particular application framework,
language, database, persistence tool, formatter, linter, coverage target,
complexity threshold, or comment-on-every-function rule. It shall link to
`/docs/sgad/engineering-quality/` for the complete canonical guidance.

## Acceptance criteria

- AC-WEB-SGAD-EQ-001: The SGAD hero identifies the methodology as a public draft
  of Core 0.3.0 without implying standards-body adoption or final status.
- AC-WEB-SGAD-EQ-002: A visitor sees that human-authored, agent-authored, and
  mixed-author implementation follow the same declared engineering standard.
- AC-WEB-SGAD-EQ-003: The page distinguishes SGAD's technology-neutral baseline
  from the formatting, naming, organization, documentation, coverage,
  complexity, architecture, dependency, and tooling decisions owned by each
  project.
- AC-WEB-SGAD-EQ-004: The section summarizes readable source, cohesive
  responsibilities, meaningful documentation, explicit errors, trust-boundary
  validation, clean delivery-ready source, and generated or vendored source
  handling.
- AC-WEB-SGAD-EQ-005: The section explains policy-bound independent controls and
  bounded exceptions without claiming that a passing quality gate proves
  behavioral correctness.
- AC-WEB-SGAD-EQ-006: A descriptive internal action opens
  `/docs/sgad/engineering-quality/`, and the section remains accessible,
  responsive, and visually consistent with the existing methodology page.

## Out of scope

- Adding framework-specific coding rules to SGAD.
- Changing the approved SGAD lifecycle, adoption file map, install command, or
  method positioning.
- Redesigning the page, changing site navigation, or introducing new imagery.
- Claiming SGAD Core conformance for the repository or methodology as a whole.

## Dependencies and assumptions

- `sgad-engineering-quality` remains the canonical normative source.
- The existing methodology page's typography, ledger, spacing, and responsive
  behavior remain the visual foundation.

## Change impact

Implementation affects the SGAD React page, page structure and component tests,
browser accessibility and responsive checks, and its link to generated docs.

## Approval scope

Approval covers AC-WEB-SGAD-EQ-001 through AC-WEB-SGAD-EQ-006 and authorizes
only the SGAD page copy, link, minimal styling, and mapped tests needed to
satisfy them.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted. Append history; do not rewrite old
entries to make stale evidence appear current.

### Approval

- Status: approved.
- Approver: human project owner.
- Approved at: 2026-08-30T02:02:37Z.
- Approved criteria: AC-WEB-SGAD-EQ-001 through AC-WEB-SGAD-EQ-006.
- Governed-content digest:
  `sha256:6c9cc8d6393568c06f90d665c95c355dcf7e60f3c9fe0aa34e8aeb7eafe615c6`.
- Decision source: direct project-owner response, “Approve all,” after review of
  the exact governed scope and digest.

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-WEB-SGAD-EQ-001 through AC-WEB-SGAD-EQ-006 | `website/tests/site-acceptance.test.mjs` — source scope, portable content, link, and exclusions |
| AC-WEB-SGAD-EQ-001 through AC-WEB-SGAD-EQ-006 | `website/src/App.test.tsx` — rendered status, section, parity statement, and action |
| AC-WEB-SGAD-EQ-001 through AC-WEB-SGAD-EQ-006 | `website/tests/landing-page.spec.ts` — browser visibility and canonical navigation; shared accessibility and responsive route checks also apply |

### Red-state evidence

- Status: observed expected red against a healthy pre-implementation baseline.
- Baseline revision: `b2bd7c7632b0a3864016b57e86127eec41c038d5` plus the approved
  requirement and mapped tests.
- Commands and runners: `node --test website/tests/framework-docs.test.mjs
  website/tests/site-acceptance.test.mjs` with Node.js 26.0.0; and
  `./node_modules/.bin/vitest run src/App.test.tsx` with Vitest 4.1.10.
- Test digests: `site-acceptance.test.mjs`
  `sha256:41e006d5dc0c4ee5947d85ca41a72dfb74fec196c8b4ab88725690e06e3edd85`;
  `App.test.tsx`
  `sha256:dbd2de97df02462e85ca42e27903cc0a10810ecd0e70f66a0cf931c622bad48f`;
  `landing-page.spec.ts`
  `sha256:83c34ba60e2a077b1be70c48c1eedae86b60b262613855d13499ffdb1af8f2e6`.
- Observed result: the structural run kept 40 checks green and failed the SGAD
  quality check on the absent Core 0.3.0 section; the component run kept 15
  checks green and failed the one governed SGAD rendering check for the same
  missing behavior. The runner was healthy and the failures were expected.

### Verification

- Status: verified.
- Verifier and commands: website structural, link, repository, framework-
  documentation, component, and type runners plus `npm run test:browser` across
  Chromium, Firefox, and WebKit.
- Governed revision or manifest: base
  `b2bd7c7632b0a3864016b57e86127eec41c038d5`; SGAD page
  `sha256:f60d7076f6293158c724ef7bc4d14a2078107eec84fd6f0226939b9a1259589c`;
  shared styles
  `sha256:7b0ab0b4e5546f90e8256f688460af20956540554383f2fadae951cc6442600b`;
  structural test
  `sha256:41e006d5dc0c4ee5947d85ca41a72dfb74fec196c8b4ab88725690e06e3edd85`;
  component test
  `sha256:96ee09a81b61ec6042fafa9e6c4a793af4f7be7f9388d0238199cb21ab6bdde3`;
  browser test
  `sha256:37c070465c29c879fcca822dbbf64576ae426e14991816d3afddc056ef60d969`.
- Result, time, and residual risks: passed at 2026-08-30T02:10:01Z. The website
  passed 36 structural, 1 link, 15 repository-consistency, 10 framework-
  documentation, 17 component, and all type checks; all 192 browser checks
  passed, including automated WCAG 2.2 AA and responsive overflow coverage.
  SGAD remains a public draft, and the section does not claim repository-wide
  SGAD Core conformance or behavioral correctness.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
- Verified source, target, result, and time: pending when applicable.
