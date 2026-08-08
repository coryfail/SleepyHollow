---
schema: sgad-component/v0.2
id: website-sleepy-hollow-page
title: Sleepy Hollow framework landing page
status: draft
risk: standard
depends_on:
  - sleepy-hollow-website
  - sleepy-hollow-application
owners:
  - Sleepy Hollow maintainers
---

# Sleepy Hollow framework page requirements

## Purpose

Introduce Sleepy Hollow as the planned agentic-first headless API framework,
explain why governed agent work matters, and invite interested readers to learn
about the SGAD methodology that informs the framework.

The page must stand on its own as the product landing page. A visitor should not
need to understand SGAD before understanding what Sleepy Hollow is intended to
become.

## Audience and primary action

- Primary audiences: individual developers, engineering leads, AI-agent
  builders, and curious nontechnical readers.
- Primary action: continue to the dedicated SGAD methodology page.
- Secondary action: inspect the Sleepy Hollow GitHub repository.

## Authorized narrative

- Identify Sleepy Hollow as an agentic-first headless API framework for Deno
  that is currently in development.
- Explain Deno briefly for readers who do not know the runtime.
- Explain the planned path from an application idea to reviewed requirements,
  mapped tests, independently checked code, and a deployable API.
- Describe the relationship between agent skills and deterministic framework
  tooling without implying that the producing agent certifies itself.
- Introduce SGAD as the design methodology used by Sleepy Hollow and link to the
  dedicated page for the complete explanation.
- Link to the canonical repository.

## Content boundaries

- The page may summarize SGAD's governing idea: humans approve behavioral
  intent, agents implement bounded specifications, and evidence governs
  completion.
- The page must not reproduce the full seven-stage SGAD lifecycle, adoption
  checklist, file-layout example, or methodology documentation. Those belong to
  the SGAD page.
- The page must not present Sleepy Hollow as installable, released, production-
  ready, or proven by adoption or performance metrics.
- The page must not imply that SGAD requires Sleepy Hollow.

## Page structure and visual direction

- Lead with a concise, unmistakably product-focused first screen.
- Use a typography-led hero with restrained atmospheric depth; do not include
  the evidence-trail illustration, its path markers, or a replacement diagram.
- Use a product-landing rhythm with concise sections rather than a long-form
  methodology document.
- Provide an intentional transition into the SGAD page instead of using SGAD as
  another equal-weight section on the same page.
- Shared navigation must identify this page as the Sleepy Hollow destination.

## Acceptance criteria

- AC-HOME-001: Given a visitor opens the root page, then the first screen names
  Sleepy Hollow, identifies it as an agentic-first headless API framework for
  Deno, and clearly states that it is in development.
- AC-HOME-002: Given a visitor reads the framework explanation, then the page
  describes the planned relationship among reviewed requirements, agent
  implementation, test-driven development, deterministic verification, and a
  deployable API without contradicting `requirements/application.md`.
- AC-HOME-003: Given a visitor does not know Deno or deterministic verification,
  then nearby copy explains the essential meaning without requiring specialist
  knowledge.
- AC-HOME-004: Given SGAD is introduced, then the page expands its name or links
  it to an immediately understandable definition and states that Sleepy Hollow
  uses the methodology.
- AC-HOME-005: Given a visitor wants the complete methodology, then the primary
  action navigates to the internal `/sgad/` page with a descriptive accessible
  label.
- AC-HOME-006: Given the complete root page is inspected, then it does not
  reproduce the full SGAD lifecycle, independent-adoption checklist, or SGAD
  file-layout example.
- AC-HOME-007: Given the page is reviewed for honest status, then it contains no
  installation prompt, release claim, fabricated metric, testimonial, customer
  logo, or unsupported product screenshot.
- AC-HOME-008: Given the rendered page is visually reviewed, then its misted,
  nocturnal woodland language feels serious and technical rather than like
  Halloween decoration, a horror promotion, or a generic dark SaaS template.
- AC-HOME-009: Given a visitor chooses to inspect the project, then a secondary
  action opens the canonical public GitHub repository without a placeholder URL.
- AC-HOME-010: Given the first screen is rendered, then it contains no
  evidence-trail path, tree-and-marker illustration, or substitute process
  diagram; typography and restrained atmosphere carry the hero hierarchy.

## Approval boundary

Approval authorizes only the Sleepy Hollow page behavior and acceptance criteria
AC-HOME-001 through AC-HOME-010. Site-wide delivery behavior and SGAD methodology
content require their own approved requirements.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval, unbound

- Status: no recorded approval binds the current content.
- Observed at: 2026-08-08T20:20:04Z.
- Current governed-content digest:
  `sha256:7e659ea8953b0442ac7f79aa514a8ef32dbb7b283900dc3db08b0788c67344da`.
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
- Approved at: 2026-08-06T16:27:58Z.
- Approved criteria: AC-HOME-001 through AC-HOME-010.
- Historical exact-content digest:
  `sha256:20af56fff2d4b0786637895b333a94a75d38c98efd8b11c1d44ebb0ebbaa343e`.
- Decision: keep the page product-focused and move the full methodology to its
  own page.

### Criterion mapping

- AC-HOME-001 through AC-HOME-010 map to the exact per-criterion entries in
  `website/requirements.md` and the named React, structural, link, browser, and
  visual checks.

### Red-state evidence

- Status: failed-as-expected at 2026-08-06T16:29:00Z as part of the two-page
  split: 3 of 14 structural checks passed and 11 failed for the absent page
  structure and navigation while the runner remained healthy.

### Verification

- Status: passed historically at 2026-08-06T17:24:12Z under
  `website/package.json#verify` for implementation manifest
  `working-tree:sha256:257f6b894e1e2d1badfffb7dfa4e974ad018dc6111cc8d83f0d4c3401a999706`.
- Current verification is recorded by the parent website requirement.

### Delivery

- Status: governed by the parent website requirement; no independent page-only
  delivery record exists.
