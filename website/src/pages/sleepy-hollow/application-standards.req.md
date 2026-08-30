---
schema: sgad-component/v0.2
id: website-sleepy-hollow-standards
title: Sleepy Hollow application standards frontend section
status: verified
risk: standard
depends_on:
  - website-sleepy-hollow-page
  - framework-application-standards-guide
  - SH-F009
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Sleepy Hollow application standards frontend section requirements

## Purpose

Show public visitors that Sleepy Hollow turns its general senior-engineering
positioning into concrete, verifiable application rules for persistence, model
ownership, readable code, and shared human-and-agent contribution standards.

## Authorized scope

- Add one concise application-standards section to the existing product page.
- Make Drizzle-first persistence, governed model layout, repository ownership,
  readable source, and equal human-and-agent standards visible.
- Update the existing data capability description to name Drizzle accurately.
- Link to the canonical application-standards guide.
- Reuse the established landing-page visual language without a redesign.

## Requirements

The section shall explain that durable relational data uses Drizzle with SQLite
or PostgreSQL by default and that only an explicit, recorded, human-approved
decision permits an alternative. It shall show the governed model shape in
plain language: one model directory containing its requirement, Drizzle schema,
repository, and public types, with database access kept out of routes.

The section shall explain that AI-generated and human-authored application code
follow the same standard. It shall name the framework's readable multi-line
source rule and every-application-function documentation rule without claiming
those choices belong to SGAD Core or every software project.

The section shall state that formatter, linter, type, test, evidence, and
`hollow check` controls enforce complementary parts of the application standard.
It shall not claim that these controls guarantee correct, secure, defect-free,
or senior-quality output or replace human review.

The section shall link to `/docs/application-standards/`. It shall fit the page's
current product narrative between the ordinary backend capabilities and the
independent review step, use semantic headings and lists, remain keyboard and
screen-reader accessible, and avoid horizontal overflow at supported widths.

## Acceptance criteria

- AC-HOME-STDS-001: The data capability and application-standards section state
  that Drizzle is the default for durable relational data with SQLite and
  PostgreSQL profiles and that an alternative requires recorded human approval.
- AC-HOME-STDS-002: The section presents one governed model directory with its
  requirement, schema, repository, and public types, and states that routes do
  not own database access.
- AC-HOME-STDS-003: The section states that AI-generated and human-authored code
  follow the same Sleepy Hollow application standard.
- AC-HOME-STDS-004: The section names readable multi-line application code and
  documentation for every application-owned function as Sleepy Hollow rules,
  without attributing them to SGAD Core or every project.
- AC-HOME-STDS-005: The section states that formatter, linter, type, test,
  evidence, and `hollow check` controls enforce complementary quality rules.
- AC-HOME-STDS-006: The page does not claim that these standards or checks
  guarantee correct, secure, defect-free, or senior-quality output or replace
  human review.
- AC-HOME-STDS-007: A descriptive internal action opens
  `/docs/application-standards/`.
- AC-HOME-STDS-008: The section sits between backend capabilities and the review
  step and remains accessible, responsive, and visually consistent with the
  established landing page.

## Out of scope

- Changing the runtime, CLI, scaffold, verifier, persistence, or model behavior.
- Changing SGAD Core or presenting Sleepy Hollow's stricter choices as universal.
- Changing the five-step method, route example, install commands, or deployment
  claims.
- Redesigning the landing page or adding new imagery, metrics, testimonials, or
  maturity claims.

## Dependencies and assumptions

- `SH-F009` remains the canonical source for the Sleepy Hollow application
  standard.
- `framework-application-standards-guide` owns the detailed public explanation.
- The existing landing-page ledger and section system can present the new
  content without introducing a second visual language.

## Change impact

Implementation affects the Sleepy Hollow React page, framework guide navigation,
page structure and component tests, and browser accessibility and responsive
checks. It does not change framework package behavior.

## Approval scope

Approval covers AC-HOME-STDS-001 through AC-HOME-STDS-008 and authorizes only
the product-page copy, link, minimal styling, and mapped tests required to
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
- Approved criteria: AC-HOME-STDS-001 through AC-HOME-STDS-008.
- Governed-content digest:
  `sha256:f259a2877ead238e03e8aa5e52a4c22626a79256d5e199fc38eec5a46c474354`.
- Decision source: direct project-owner response, “Approve all,” after review of
  the exact governed scope and digest.

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-HOME-STDS-001 through AC-HOME-STDS-008 | `website/tests/site-acceptance.test.mjs` — source content, claim boundaries, link, and section order |
| AC-HOME-STDS-001 through AC-HOME-STDS-008 | `website/src/App.test.tsx` — rendered standard, model shape, action, and adjacent sections |
| AC-HOME-STDS-001 through AC-HOME-STDS-008 | `website/tests/landing-page.spec.ts` — browser visibility and canonical navigation; shared accessibility and responsive route checks also apply |

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
- Observed result: the structural run kept 40 checks green and failed the home
  standards check on the absent Drizzle, model, code-quality, and section-order
  behavior; the component run kept 15 checks green and failed the one governed
  home rendering check for the missing section. The runner was healthy and the
  failures were expected.

### Verification

- Status: verified.
- Verifier and commands: website structural, link, repository, framework-
  documentation, component, and type runners plus `npm run test:browser` across
  Chromium, Firefox, and WebKit.
- Governed revision or manifest: base
  `b2bd7c7632b0a3864016b57e86127eec41c038d5`; Sleepy Hollow page
  `sha256:b0fac71510cfd3fa15fdbc3e6d1207586838c8bdafed2326e77225d6cb5464c6`;
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
  The public section states the declared controls and their limits; it does not
  prove application correctness or replace project-specific review.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
- Verified source, target, result, and time: pending when applicable.
