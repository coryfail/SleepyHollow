---
schema: sgad-component/v0.2
id: website-docs-section
title: On-site documentation section
status: verified
risk: standard
depends_on:
  - sleepy-hollow-website
  - sleepy-hollow-application
owners:
  - Sleepy Hollow maintainers
---

# Documentation section requirements

## Purpose

Publish the repository's canonical guides as readable pages on the website, so a
visitor who wants to know how routing, storage, security, verification, or
deployment work can find out without leaving the site for a code host's file
viewer.

The section exists to close a comprehension gap, not to add a route. Before this
requirement the only public explanation of the framework was a landing page of
abstractions and a set of Markdown files a reader had to know to look for.

## Audience and primary action

- Primary audiences: developers evaluating the framework, developers using it,
  and agent authors who need the API surface.
- Primary action: read the guide that answers the reader's current question.
- Secondary actions: move to the next guide, open the generated API reference,
  or return to the framework page.

## Source of truth

Guide prose has exactly one source: the Markdown files under `docs/` in the same
repository revision. The website renders those files at build time and never
holds an edited copy of them. A correction to a guide is a correction to the
Markdown file.

This constraint is the point of the feature, not an implementation detail. A
documentation site that can drift from the repository it documents is worse than
no documentation site, because it is confidently wrong.

## Authorized narrative

- Publish every guide under `docs/framework/` as a page in a Framework group.
- Publish every document under `docs/sgad/` as a page in an SGAD group, with
  `docs/sgad/README.md` serving as that group's overview.
- Give each guide a one-line description of what it covers, so a reader can
  choose without opening all of them.
- Present the guides in a deliberate reading order rather than alphabetically.
- Link to the generated API reference and say plainly that it is generated from
  the framework's own source documentation comments.
- Explain, on the index, what the reader will find in each group.

## Content boundaries

- The section must not introduce prose that does not exist in the canonical
  Markdown. Framing text on the index page — group descriptions and per-guide
  summaries — is website copy and is permitted, but the guide bodies are not
  editable here.
- The section must not claim documentation coverage the guides do not have.
- The section must not add search, versioning, feedback, comments, or any
  surface that collects input.

## Page structure and visual direction

- Use the shared Sleepy Hollow design system. A guide page must read as part of
  this site, not as a generic documentation theme dropped into it.
- Use a reading-focused structure: a persistent list of guides, a bounded
  measure for body text, and clear heading hierarchy.
- The rendered Markdown must carry the site's typography for headings, body
  text, lists, tables, blockquotes, and inline code.
- Code blocks must be bounded, monospaced regions that scroll within themselves
  on narrow screens rather than widening the document.
- The generated API reference is exempt from the shared visual system; it is
  presented as a separate generated tool and labeled as such, so its different
  appearance does not read as a broken page.

## Acceptance criteria

- AC-DOCS-001: Given a visitor opens `/docs/`, then the page lists every
  published guide, grouped as Framework and SGAD, each with a one-line
  description of what it covers.
- AC-DOCS-002: Given a visitor opens a guide page, then the complete prose of
  the corresponding canonical Markdown file is rendered as semantic HTML with a
  single level-one heading and ordered heading levels beneath it.
- AC-DOCS-003: Given a guide page is built, then its content was produced during
  the build from the canonical file under `docs/`, and no copy of that prose is
  stored under `website/src/`.
- AC-DOCS-004: Given a visitor is reading a guide, then persistent documentation
  navigation lists every guide, marks the current one, and offers a labeled
  route to the next guide in reading order.
- AC-DOCS-005: Given a reader wants the API surface, then the documentation
  section links to the generated reference beneath `/api/` and describes it as
  generated from the framework's source documentation comments.
- AC-DOCS-006: Given a guide's Markdown links to another published guide, then
  the rendered link resolves to that guide's site route; given it links to a
  repository file with no published page, then it resolves to that file on the
  canonical repository host.
- AC-DOCS-007: Given JavaScript is disabled, then a guide page still exposes its
  complete prose and its documentation navigation in semantic HTML.
- AC-DOCS-008: Given a guide contains fenced code, then the rendered block keeps
  its content on one horizontal axis inside its own scrolling region and does
  not cause document-level horizontal overflow at 320 CSS pixels.
- AC-DOCS-009: Given a guide page is checked for accessibility, then it meets the
  same WCAG 2.2 AA contrast, landmark, focus, and link-description standard as
  the hand-authored pages.
- AC-DOCS-010: Given the documentation section is inspected, then it contains no
  form, input, search field, or other surface that collects visitor input.

## Approval boundary

Approval authorizes only the documentation section behavior and acceptance
criteria AC-DOCS-001 through AC-DOCS-010. Site-wide delivery behavior, the
Sleepy Hollow product narrative, and SGAD methodology content require their own
approved requirements.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T23:32:11Z.
- Approved criteria: AC-DOCS-001 through AC-DOCS-010.
- Governed-content digest:
  `sha256:55bc11533ad9bb1b442b95c01045c86eea8af4464f953f670d17446245030d8a`.
- Decision source: owner review; direct response `Approve all four` after being
  shown the material changes and the exact governed-content digest.
- Decision: publish the canonical guides on the site, generated at build time
  from the exact Markdown under `docs/`, with no second copy of the prose under
  `website/`.

### Criterion mapping

AC-DOCS-001 through AC-DOCS-010 map to the exact per-criterion entries in
`website/requirements.md` and to the named checks below.

| Criterion | Governed tests or checks |
|---|---|
| AC-DOCS-001 | `src/App.test.tsx`; `tests/site-acceptance.test.mjs`; `tests/landing-page.spec.ts` |
| AC-DOCS-002 | rendered-guide checks in `tests/site-acceptance.test.mjs` and `tests/landing-page.spec.ts` |
| AC-DOCS-003 | the generated-prose and no-duplicate-copy check in `tests/site-acceptance.test.mjs` |
| AC-DOCS-004 | current-marker and next-guide checks in `src/App.test.tsx` and `tests/landing-page.spec.ts` |
| AC-DOCS-005 | `docs:api` build-chain and API-reference reachability checks |
| AC-DOCS-006 | link-rewriting checks over every generated guide |
| AC-DOCS-007 | noscript-fallback checks plus the no-JavaScript browser run |
| AC-DOCS-008 | `overflow-x` check plus the 320px Playwright code-block check |
| AC-DOCS-009 | Axe WCAG 2.2 AA runs on `/docs/` and `/docs/routing/` |
| AC-DOCS-010 | data-entry-surface checks in the React and structural suites |

### Red-state evidence

- Status: failed-as-expected at 2026-08-09T23:41:00Z under
  `node --test tests/site-acceptance.test.mjs` at base revision
  `ba80feae1a35afdd3765b14dbfddd702e1694999`, with 13 checks passing and 15
  failing.
- The five checks carrying AC-DOCS criteria all failed for absent behavior:
  `scripts/generate-docs.mjs` did not exist, `generated/docs-content.js` could
  not be imported, no `docs/**/index.html` entry document existed, and no
  `DocsPage` component was present.
- Material characterization: expected missing behavior. The runner was healthy
  and the 13 checks covering the existing pages, license, tokens, and no-JS
  fallbacks continued to pass in the same run.

### Verification

- Status: passed at 2026-08-10T00:12:45Z.
- Base revision: `ba80feae1a35afdd3765b14dbfddd702e1694999`, formerly
  `2d97b6cd0c7d655ae58df039cbf647fb47e064b0`. The commit was renamed by a
  `git filter-branch` that stripped co-author trailers on 2026-08-10; the tree
  is unchanged and the pre-squash history is retained under the tag
  `evidence/development-pre-squash-0.1.1`.
- Implementation manifest:
  `working-tree:sha256:a5fd16f591f23d13e31ee96367f48f28c2f01047d86ceeb3a3f175413a8c9f39`.
- Verifier: `website/package.json#verify` version `0.1.1`.
- Results: 15 guides published from the canonical Markdown, every rendered link
  resolving to a site route or the canonical repository host, every guide
  carrying its complete prose in a no-JavaScript fallback, Axe WCAG 2.2 AA
  passing on the index and a guide route across Chromium, Firefox, and WebKit,
  and no document-level horizontal overflow at 320, 375, 414, or 768 CSS pixels
  on either documentation route.
- Residual risk: browser acceptance covers the documentation index and the
  routing guide, not all 15 guide pages individually. The remaining guides share
  one generated template and one rendering path, so a template defect would
  surface on the covered routes; a defect specific to one guide's Markdown would
  not.

### Delivery

- Status: governed by the parent website requirement; no independent
  section-only delivery record exists.
