---
schema: sgad-component/v0.2
id: framework-application-standards-guide
title: Sleepy Hollow application standards guide
status: verified
risk: standard
depends_on:
  - framework-documentation
  - SH-F009
  - sgad-engineering-quality
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Sleepy Hollow application standards guide requirements

## Purpose

Publish the concrete engineering standard Sleepy Hollow applies when humans and
agents build applications with the framework. Help readers understand the
framework-specific rules that extend SGAD's technology-neutral baseline before
they scaffold models, persistence, routes, tests, or delivery controls.

## Authorized scope

- Add one canonical `docs/framework/application-standards.md` guide.
- Explain that the standard applies equally to AI-generated and human-authored
  application code.
- Document Sleepy Hollow's Drizzle-first persistence decision and its explicit
  human-approved exception path.
- Document governed model layout, repository ownership, source readability,
  function documentation, type safety, security, tests, and quality gates.
- Link readers to the framework's deeper requirement, data, verification, and
  SGAD engineering-quality guidance without duplicating those guides in full.

## Requirements

The guide shall distinguish SGAD Core from the framework's application standard.
SGAD defines a technology-neutral minimum and requires each project to own its
concrete policy. Sleepy Hollow supplies one such concrete policy for applications
built with the framework; it does not redefine SGAD for other projects.

The guide shall state that durable relational persistence uses Drizzle with the
supported SQLite or PostgreSQL profile by default. An alternative requires an
explicit human decision recorded and approved in the governing application or
model requirement. A generated preference, an existing package, or an inferred
architecture shall not count as confirmation.

Every durable model shall use `models/<model>/` with a governed
`<model>.req.md`, `schema.ts`, `repository.ts`, and `types.ts`. The model owns its
domain contract and persistence behavior. Routes may validate transport input,
authorize, call repositories, and form responses; they shall not import Drizzle,
database drivers, raw clients, or framework database capabilities.

The guide shall summarize the application code standard accurately: readable
multi-line source, intentional names, no delivered placeholders or dead code,
TSDoc for every application-owned function, bounded function size and
complexity, strict TypeScript without unsafe escapes, validated trust boundaries,
explicit typed errors, resource-safe asynchronous work, structured logging,
dependency review, and deterministic criterion-mapped tests.

The guide shall present the required quality gate in its canonical order:
`npm run format:check`, `npm run lint`, `npm run check`, `npm run test`,
`npx hollow test`, and `npx hollow check`. It shall explain that no skipped or
failed command can become verification and that these controls do not guarantee
complete requirements, defect-free code, or freedom from human review.

## Acceptance criteria

- AC-FW-STDS-001: The public framework documentation includes one deliberately
  ordered application-standards guide and describes it on the documentation
  index.
- AC-FW-STDS-002: The guide states that AI-generated and human-authored
  application code follow the same Sleepy Hollow engineering standard and that
  the framework standard extends rather than replaces SGAD's project-owned
  policy boundary.
- AC-FW-STDS-003: The guide makes Drizzle the default for durable relational
  persistence, names SQLite and PostgreSQL as supported profiles, and requires
  exact-content human approval for a recorded alternative.
- AC-FW-STDS-004: The guide shows the required `models/<model>/` layout with one
  governed model requirement, schema, repository, and public types file, and it
  keeps database access out of routes.
- AC-FW-STDS-005: The guide accurately summarizes readable multi-line source,
  every-function TSDoc, bounded functions and complexity, strict type safety,
  validation, errors, resource safety, structured logging, dependencies, and
  deterministic tests.
- AC-FW-STDS-006: The guide lists the six quality-gate commands in canonical
  order and states that a skipped or failed command prevents verification.
- AC-FW-STDS-007: The guide links to related canonical framework and SGAD guides
  using resolvable repository-relative links and does not create a second
  normative copy of their detailed rules.
- AC-FW-STDS-008: The guide makes no claim that standards or passing checks prove
  complete intent, defect-free code, or unnecessary human review.

## Out of scope

- Changing SGAD Core or its framework-independent engineering baseline.
- Changing application runtime behavior, scaffold output, verifier rules, model
  architecture, or persistence behavior.
- Adding a new formatter, linter, database technology, deployment provider, or
  quality threshold.
- Claiming that the framework standard is appropriate for every software project.

## Dependencies and assumptions

- `SH-F009` and its canonical references remain the source for the detailed
  Sleepy Hollow skill rules.
- `sgad-engineering-quality` remains the source for SGAD's portable baseline.
- The website documentation generator continues to publish every canonical
  framework guide from `docs/framework/`.

## Change impact

Implementation affects the framework guide set, documentation reading order and
summary metadata, documentation structure checks, and public links from the
Sleepy Hollow landing page. It does not change framework package behavior.

## Approval scope

Approval covers AC-FW-STDS-001 through AC-FW-STDS-008 and authorizes only the
guide, publication metadata, mapped tests, and links required to satisfy them.

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
- Approved criteria: AC-FW-STDS-001 through AC-FW-STDS-008.
- Governed-content digest:
  `sha256:6ebaa50d7633882ccec958671741b28e02bf7c1088936611e38bb53aee01795a`.
- Decision source: direct project-owner response, “Approve all,” after review of
  the exact governed scope and digest.

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-FW-STDS-001 through AC-FW-STDS-004 | `website/tests/framework-docs.test.mjs` — publication, contributor parity, Drizzle default, model layout, and route boundary |
| AC-FW-STDS-005 through AC-FW-STDS-008 | `website/tests/framework-docs.test.mjs` — source-quality summary, ordered gate, canonical links, and bounded claims |
| AC-FW-STDS-001 | `website/tests/site-acceptance.test.mjs` — generated guide coverage and ordering |

### Red-state evidence

- Status: observed expected red against a healthy pre-implementation baseline.
- Baseline revision: `b2bd7c7632b0a3864016b57e86127eec41c038d5` plus the approved
  requirement and mapped tests.
- Command and runner: `node --test website/tests/framework-docs.test.mjs
  website/tests/site-acceptance.test.mjs` with Node.js 26.0.0.
- Test digests: `framework-docs.test.mjs`
  `sha256:d641e3fe1f56971d88a468ecf8ad24e29b5a21354507127cd701699a4631fae9`;
  `site-acceptance.test.mjs`
  `sha256:41e006d5dc0c4ee5947d85ca41a72dfb74fec196c8b4ab88725690e06e3edd85`.
- Observed result: 40 passed and 6 failed. The runner and existing checks were
  healthy; the governed failures reported the missing canonical guide,
  publication order, summary, and generated guide entry, as expected before
  implementation.

### Verification

- Status: verified.
- Verifier and commands: repository test runners, TypeScript, Node.js, Bun,
  Vitest, and Playwright through root `npm run verify`; website structural,
  link, repository, framework-documentation, component, and type checks; and
  website `npm run test:browser`.
- Governed revision or manifest: base
  `b2bd7c7632b0a3864016b57e86127eec41c038d5`; canonical guide
  `sha256:c1c2fca7edd59a48e3e4ef1d760bcf8afcd019e70da1c0d7829daac0775caf1a`;
  publication generator
  `sha256:84cc7a03b75af30180adad3d667fed4d916a4057a87ce93b05d0a38618ed661e`;
  final governed test
  `sha256:de2be5f05218ecd7dabc7dcf37a1c89c6e633516d4c2c2abb0fd4268a8068d1c`.
- Result, time, and residual risks: passed at 2026-08-30T02:10:01Z. Root
  verification passed 240 Node and 240 Bun tests with 6 intentional skips in
  each runtime plus 5 platform-baseline tests. Website checks passed 36
  structural, 1 link, 15 repository-consistency, 10 framework-documentation,
  17 component, and all type checks; the 192-browser matrix passed in Chromium,
  Firefox, and WebKit. Four pre-existing TypeDoc inclusion warnings remain; the
  guide describes enforced policy and evidence, not guaranteed correctness.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
- Verified source, target, result, and time: pending when applicable.
