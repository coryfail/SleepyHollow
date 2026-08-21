---
schema: sgad-application/v0.2
id: sleepy-hollow-website
title: Sleepy Hollow public website
status: approved
risk: standard
depends_on:
  - sleepy-hollow-application
  - sgad-methodology
owners:
  - Sleepy Hollow maintainers
---

# Website requirements

## Purpose

Create a small public website with four distinct but connected destinations:

1. A Sleepy Hollow framework landing page that explains concretely what the
   framework does, shows what using it looks like, and states how to install it.
2. A documentation section that publishes the repository's canonical guides as
   readable pages on the site itself, rather than sending readers to Markdown
   files on a code host.
3. A generated API reference derived from the framework's own source
   documentation comments.
4. A dedicated Specification-Governed Agentic Development (SGAD) page that
   explains the methodology independently of Sleepy Hollow and gives readers a
   practical way to adopt it.

The split must let readers understand Sleepy Hollow without first reading a
methodology document while giving SGAD enough room to be useful to people who
never adopt the framework.

Every destination is judged on comprehension. A reader who does not already know
this project must be able to say what the framework does, what SGAD is, and what
either would cost them, after one pass. Copy that names concepts without
explaining or demonstrating them does not satisfy this requirement, however
accurate it is.

## Authorized scope

- Maintain a static React website under `website/`.
- Publish the Sleepy Hollow page at `https://sleepyhollow.io/`.
- Publish the SGAD methodology at a stable `/sgad/` path beneath that root.
- Publish the repository's canonical guides beneath a stable `/docs/` path,
  generated at build time from the exact Markdown files under `docs/` in the
  same revision.
- Publish a generated API reference beneath a stable `/api/` path, produced by
  TypeDoc from the framework's own source comments.
- State how to install the published package and CLI, using the real commands
  for the version that is actually published.
- Provide clear navigation among the pages and to the canonical GitHub
  repository, the published package, and SGAD source documents.
- Share one visual system, accessibility standard, deployment workflow, and
  evidence model across every hand-authored page.
- Build and publish the site through GitHub Pages after the verified release
  reaches `main`.

## Out of scope

- Blog content, full-text search, versioned documentation, a documentation
  content-management system, or a comment or feedback surface.
- Documentation prose hand-maintained inside `website/`. Guide text has one
  source of truth under `docs/`; the website renders it and never forks it.
- Tutorials, guides, or reference material authored to fill out the section
  rather than to document behavior the framework actually has.
- Authentication, forms, newsletters, analytics, cookies, tracking, databases,
  remote data access, server-side rendering, or server-side APIs.
- Runnable demonstrations, fabricated metrics, testimonials, customer logos, or
  claims of stability, production readiness, or adoption that the repository
  does not support.
- Additional domains, localization, or additional top-level site routes without
  a separately approved requirement.
- Changing the canonical Sleepy Hollow or SGAD methodology requirements from
  website copy.

## Feature ownership

| Feature | Route | Requirement |
|---|---|---|
| Sleepy Hollow framework page | `/` | `src/pages/sleepy-hollow/sleepy-hollow.req.md` |
| Documentation section | `/docs/` | `src/pages/docs/docs.req.md` |
| SGAD methodology page | `/sgad/` | `src/pages/sgad/sgad.req.md` |

Each feature is independently valuable and owns its narrative acceptance
criteria. This file owns only cross-page behavior and shared delivery
constraints.

The generated API reference at `/api/` has no narrative of its own. It is build
output governed by this file, not a hand-authored page, and it is exempt from
the shared visual system because TypeDoc controls its markup.

## Shared experience

- Every hand-authored page must unmistakably belong to the same Sleepy Hollow
  site through shared typography, color tokens, navigation language, and
  interaction rules.
- The pages may use different layouts and information density to match their
  different jobs; visual consistency must not collapse them into duplicate
  templates.
- The framework page must summarize SGAD and link to the dedicated methodology
  page rather than reproducing its full lifecycle.
- The SGAD page must explain that the methodology can be used without Sleepy
  Hollow and provide a clear path back to the framework page.
- Public copy must distinguish current, planned, and verified behavior.
- Where a page introduces a term the reader may not know, it must explain the
  term or show the thing it names. Naming a concept is not explaining it.
- Where a page describes what the framework does, it must be possible to show
  the corresponding code, command, or output; where it is not, the claim is too
  abstract to publish.

## Routes and static delivery

- The build must emit an independent static entry document for the root
  framework page, the `/sgad/` methodology page, the documentation index, and
  every published guide.
- Direct navigation or refresh at any public URL must succeed on GitHub Pages
  without client-side redirect tricks or a domain-root assumption.
- Internal links and assets must resolve from the custom-domain root without a
  repository-name path prefix.
- The published artifact must include a `CNAME` record for `sleepyhollow.io`.
- Core content and destinations on every page must remain available when
  JavaScript is disabled. On a guide, the core content is the whole guide.
- Documentation entry documents and the generated API reference are build
  output. They must be produced by the build and excluded from version control,
  so a published guide can never disagree with its source file.
- A missing page artifact, a guide whose source file no longer exists, or a
  linked canonical repository document that cannot be resolved must fail
  verification before deployment.

## State, access, and side effects

- Both pages are public, static, and read-only.
- Authentication and authorization decision: `none`.
- The website owns no browser or application state and performs no remote reads
  or writes after static assets load.
- Only a verified revision on `main` may publish a GitHub Pages artifact.
- Pull requests and feature branches may build and verify but must not deploy.
- First publication remains an external mutation requiring the repository's
  applicable environment protection; the human project owner authorized the
  custom-domain production release in the governing conversation.

## Shared non-functional requirements

### Accessibility and comprehension

- Each document must have one logical level-one heading, ordered heading levels,
  semantic landmarks, descriptive link labels, and immediate visible keyboard
  focus.
- Text and interactive states must meet WCAG 2.2 AA contrast requirements.
- Meaningful graphics require accessible alternatives; decorative graphics must
  be ignored by assistive technology.
- Technical terms necessary to the story must be explained near their first use.

### Responsive behavior

- Both pages must function without horizontal scrolling at 320, 375, 414, and
  768 CSS pixels and at representative desktop widths.
- Navigation and action labels must not wrap into broken multi-line controls.
- Display headings and technical examples must wrap or scroll within their own
  bounded region without widening the document.

### Visual system and motion

- Preserve the approved dark, misted, nocturnal Sleepy Hollow atmosphere and its
  restrained technical tone.
- Use the shared Hallmark-governed token system; raw colors and font families
  must not be improvised inside page-specific styles.
- Page structures must differ enough to support their content jobs while sharing
  the same brand system.
- Motion must be restrained, limited to transform and opacity, and removed or
  reduced when `prefers-reduced-motion` is enabled.

### Technology and compatibility

- Website dependencies remain isolated under `website/`; framework consumers do
  not install them.
- Markdown rendering happens at build time. The published guide pages must not
  ship a Markdown parser, syntax highlighter, or documentation runtime to the
  browser.
- The static build must work in current stable Chromium, Firefox, and Safari.
- Automated browser acceptance covers representative Chromium, Firefox, and
  WebKit engines. WebKit coverage is not presented as proof of every Safari
  release.
- Generated dependencies, build output, browser reports, and TypeScript build
  metadata must not be committed.
- Metadata must provide an accurate title and summary for each page without
  claiming a finalized logo or brand asset.

## Acceptance criteria

- AC-SITE-001: Given website dependencies are installed, when the production
  build runs, then it emits deployable static entry documents for the framework
  root, `/sgad/`, the documentation index, and every published guide, without
  writing outside the authorized output.
- AC-SITE-002: Given a visitor is on any hand-authored page, then the shared
  navigation identifies the current destination and provides descriptive,
  keyboard-operable routes to the site's other destinations.
- AC-SITE-003: Given any published site URL is opened directly or refreshed,
  then the correct page and all required assets load without a redirect loop,
  404 response, or repository-name path prefix.
- AC-SITE-004: Given JavaScript is disabled, then each page still exposes its
  core explanation and primary destinations in semantic HTML, and a guide page
  exposes its complete prose.
- AC-SITE-005: Given the hand-authored pages are visually compared, then they
  share the same design tokens and brand atmosphere while using recognizably
  different page structures appropriate to their distinct purposes.
- AC-SITE-006: Given keyboard-only and automated accessibility checks, then both
  pages expose logical landmarks, ordered headings, visible focus, descriptive
  links, and WCAG 2.2 AA contrast.
- AC-SITE-007: Given viewport widths of 320, 375, 414, and 768 CSS pixels, then
  neither page has document-level horizontal overflow, clipped essential
  content, unsafe headings, or wrapped multi-line action labels.
- AC-SITE-008: Given reduced motion is requested, then neither page relies on
  spatial animation for content or navigation.
- AC-SITE-009: Given either page runs in a browser, then it performs no analytics,
  tracking, authentication, remote data writes, or browser-storage writes.
- AC-SITE-010: Given a pull request or feature revision, then the workflow builds
  and verifies both pages without deploying; given the verified revision reaches
  `main`, it uploads only the current production artifact through the protected
  GitHub Pages environment.
- AC-SITE-011: Given verification is complete, then site criteria and every page
  feature's criteria have bidirectional traceability, retained expected-red
  evidence, and an implementation-bound embedded verification entry.
- AC-SITE-012: Given a guide is published at `/docs/…`, then its prose was
  generated during the build from the exact canonical Markdown file under
  `docs/` in the same revision, and no second copy of that prose is maintained
  under `website/`.
- AC-SITE-013: Given the production build completes, then a generated API
  reference is published beneath `/api/`, produced by TypeDoc from
  the framework's own source documentation comments, and reachable by a
  descriptive link from the documentation section.
- AC-SITE-014: Given the repository is inspected, then no documentation entry
  document, rendered guide content, or generated API reference file is tracked
  in version control.
- AC-SITE-015: Given a canonical guide file is added, renamed, or removed, then
  the next build reflects that change without editing website source, and a
  guide whose source file is missing fails verification rather than publishing
  stale prose.
- AC-SITE-016: Given the site states how to install Sleepy Hollow, then the
  stated package name, commands, and version claim match the package actually
  packed for npm and the install instructions in `README.md`.

## Change history and approval boundary

This draft supersedes the approved single-page intent identified by requirement
digest `sha256:299742bd6eca92fd51118a13649094ede3224031f2a42081c16df5cf15fdf29f`
and the approved two-page intent identified by digest
`sha256:e94af44b188d2ea6fedd19003d0612385a72babf483c9b89627efcb2a8614ed9`. Those
historical revisions remain recoverable from Git history; their material
approval and evidence provenance is retained in the governance record below.

This revision changes three things the prior approval decided differently, and
each is a deliberate reversal rather than an extension:

1. Product documentation and an API reference moved from out of scope to
   authorized scope, because the framework is now published and readers need
   documentation on the site rather than in a code host's file viewer.
2. Installation instructions moved from out of scope to authorized scope,
   because the locally packed npm artifact makes the commands independently
   verifiable before publication.
3. Comprehension became a governed property rather than an implicit one,
   because the delivered copy satisfied every prior criterion while leaving a
   first-time reader unable to say what the framework does.

The prior approvals and verifications remain historical evidence for the
two-page implementation. They do not authorize this revision. Human approval
must bind this file and each child page requirement before acceptance tests or
implementation are changed.

## Governance record

> Historical verification note: Deno commands, runtime names, and platform
> artifacts appearing below this boundary belong to the pre-Node/Bun
> implementation or migration record. They are retained for audit history only;
> current behavior and verification use the Node.js/Bun package workflow.

### Invalidation, 0.2.0 named requirement files

- Status: prior approval and verification are stale for current content.
- Invalidated at: 2026-08-18T13:18:57Z.
- Reason: governed prose changed to adopt the approved named `*.req.md`
  convention and current artifact paths.
- Superseding authority: `named-requirement-files`, approved for AC-NRF-001
  through AC-NRF-014 at
  `sha256:e75c7a3c82796f8833779e32e3a740e02011cd35754082b7bc233b6f0baeb0eb`.
- Historical entries below remain intact and apply only to their recorded
  content digests and revisions.

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T23:32:11Z.
- Approved criteria: AC-SITE-001 through AC-SITE-016.
- Governed-content digest:
  `sha256:730077cb52300a9492f753139ceeec8954c56286911897a9a496e06ff3bc939f`.
- Decision source: owner review; direct response `Approve all four` after being
  shown the material changes and the exact governed-content digest.
- Decision: publish the canonical guides and a generated API reference on the
  site, state the real JSR install commands, and make comprehension a governed
  property of every page rather than an implicit hope.

### Approval, superseded

- Status: approved for the two-page scope this revision supersedes.
- Approver: human-project-owner.
- Approved at: 2026-08-08T20:21:37Z.
- Approved criteria: the criteria recorded in this requirement.
- Governed-content digest:
  `sha256:e94af44b188d2ea6fedd19003d0612385a72babf483c9b89627efcb2a8614ed9`.
- Decision source: owner review; direct response `Approve` after review
  of the current content after the unbound-approval correction and the exact governed-content digest.

### Approval, unbound

- Status: no recorded approval binds the current content.
- Observed at: 2026-08-08T20:20:04Z.
- Current governed-content digest:
  `sha256:e94af44b188d2ea6fedd19003d0612385a72babf483c9b89627efcb2a8614ed9`.
- Finding: recomputing the canonical governed-content digest for this file
  matches none of the digests recorded below. The content has changed since
  every recorded approval, so the `approved` projection asserted authority the
  digest disproves. The status is corrected to `draft` pending re-approval of
  the current content.
- No downstream evidence is invalidated by this correction, because the
  correction records a drift that already existed rather than introducing one.

### Approval

| Requirement revision | Approved criteria | Digest | Approver | Approved at | Decision |
|---|---|---|---|---|---|
| Historical single-page website | AC-WEB-001–019 | `sha256:299742bd6eca92fd51118a13649094ede3224031f2a42081c16df5cf15fdf29f` | human-project-owner | 2026-08-06T14:57:58Z | “Perfect, let's continue still using SGAD” |
| Sleepy Hollow framework page | AC-HOME-001–010 | `sha256:20af56fff2d4b0786637895b333a94a75d38c98efd8b11c1d44ebb0ebbaa343e` | human-project-owner | 2026-08-06T16:27:58Z | Keep the home page product-focused and move the methodology to its own page |
| SGAD page with short install | AC-WEB-SGAD-001–012 | `sha256:49c7921fc5f92784a79b1c1379c50fadfa5c57b5be1645e6a4e71bcd7046e170` | human-project-owner | 2026-08-06T19:19:08Z | Publish the standalone skill with the short agent-skills command |
| Two-page website and delivery scope | AC-SITE-001–011 | `sha256:57d0e449cae7d4bc2e5fc6397ac9641f9255fd16b3417368e68b043a3a34075e` | human-project-owner | 2026-08-06T17:20:18Z | Commit, push, and publish the verified website at `https://sleepyhollow.io` |

### Verification, current content

- Status: passed for the approved documentation, install, and comprehension
  revision.
- Verified at: 2026-08-10T00:12:45Z.
- Base revision: `ba80feae1a35afdd3765b14dbfddd702e1694999`.
- Revision remap, 2026-08-10: this entry originally cited base revision
  `2d97b6cd0c7d655ae58df039cbf647fb47e064b0`. A `git filter-branch` over
  `development` stripped co-author trailers from sixteen commit messages, which
  rewrote every commit in that range; the same tree is now named by the digest
  above. The pre-squash history is retained under the tag
  `evidence/development-pre-squash-0.1.1`, so both the old and new revisions
  remain resolvable. Only commit messages changed — no tree, no evidence, and
  no result recorded here was altered.
- Implementation manifest:
  `working-tree:sha256:a5fd16f591f23d13e31ee96367f48f28c2f01047d86ceeb3a3f175413a8c9f39`
  (diff of `website/` against the base revision, including new untracked
  sources).
- Verifier: `website/package.json#verify` version `0.1.1`, plus
  `deno task check:governance` from the repository root.
- Results: structural 28/28, links 1/1, repository-consistency 9/9,
  React/Vitest 12/12, TypeScript build, Vite production build across 18 entry
  documents, and Playwright/Axe 129/129 across Chromium, Firefox, and WebKit —
  covering WCAG 2.2 AA on all four routes, all four required responsive widths
  on all four routes, reduced motion, keyboard focus, the no-JavaScript
  fallback for the home, SGAD, documentation index, and guide routes, the
  1280×800 hero fit, and a live fetch of the generated `/api/` reference.
  Governed digests bind for 29 tracked requirements and for the new
  documentation requirement.
- Scope of this entry: it establishes that the site as built satisfies every
  criterion approved at 2026-08-09T23:32:11Z, including the criteria added by
  that approval. It supersedes the entries below, which were bound to the
  two-page scope.
- Owner review pass, 2026-08-10: the project owner reviewed the running site
  and four defects were corrected under the same approved criteria, with no
  requirement text or acceptance criterion changed.
  1. `/api/` was served only from a production build, so the link was live in
     production and dead in development. A dev-only Vite middleware now serves
     the generated reference from `dist/api`; it is `apply: "serve"` and cannot
     affect the production bundle.
  2. The generated reference contained no link back to the site — its own
     wordmark points at its own index — so following the documentation link
     stranded the visitor. `scripts/brand-api-reference.mjs` now inserts one
     return bar into each of the 1,814 generated documents after `deno doc`
     runs, and a browser check follows that link back to `/docs/`.
  3. The six capability cards inherited the two-column `.framework` split and
     rendered at roughly twenty characters a line on a desktop viewport. The
     section now owns its layout and uses the full measure.
  4. The `hollow check` note sat in a second grid row beneath the taller prose
     column, visually detached from the output it explains. It is now grouped
     with that output in one panel.
- Residual risk: the generated API reference is verified as reachable, as
  containing expected symbols, and as routing back to the site, not audited
  page by page — its markup is produced by the Deno toolchain and is not
  governed by this project's visual or accessibility criteria. The injected
  return bar is the one exception, and it depends on the toolchain continuing
  to emit a `<body>` tag; the injector skips any document where that fails
  rather than corrupting it, so a format change would silently drop the bar
  from affected pages. The published site has not been re-fetched from
  `sleepyhollow.io` since this revision; delivery remains ungoverned here.

### Verification, superseded two-page content

- Status: passed for the re-approved content.
- Verified at: 2026-08-08T20:24:58Z.
- Commands: `npm run test:links`, `npm run test:repository`, and
  `npm run test:structure` in `website`.
- Result: all three suites pass, covering the website link, repository-consistency, and two-page structure suites.
- Scope of this entry: it establishes that the current content is consistent and
  that its mapped repository checks pass. It supersedes the historical entries
  below, which were bound to digests that no longer match this file.
- Residual risk: browser-level acceptance through Playwright was not executed in
  this environment, so rendered-page behavior rests on the structural suites
  rather than a live browser run.

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-SITE-001 | `tests/site-acceptance.test.mjs`; `npm run build` |
| AC-SITE-002 | `src/App.test.tsx`; `tests/landing-page.spec.ts` |
| AC-SITE-003 | structural and browser checks; custom-domain expected red |
| AC-SITE-004 | structural and no-JavaScript browser checks |
| AC-SITE-005 | structural checks; browser visual review |
| AC-SITE-006 | React, Axe, and keyboard-focus checks |
| AC-SITE-007 | Playwright responsive checks at 320, 375, 414, and 768 CSS px |
| AC-SITE-008 | Playwright reduced-motion checks |
| AC-SITE-009 | React and structural storage/analytics checks |
| AC-SITE-010 | structural workflow checks; `.github/workflows/website-pages.yml`; concurrency expected red |
| AC-SITE-011 | embedded traceability and two-page expected red |
| AC-SITE-012 | `tests/site-acceptance.test.mjs` generated-prose and no-duplicate-copy checks |
| AC-SITE-013 | structural `docs:api` build-chain checks; Playwright API-reference link check |
| AC-SITE-014 | structural `git ls-files` and `.gitignore` checks |
| AC-SITE-015 | structural `planGuides` missing-source check |
| AC-SITE-016 | structural install-command, `deno.json`, and `README.md` agreement checks |
| AC-HOME-011 | React, structural, and Playwright install-command checks |
| AC-HOME-012 | structural route-example checks against the current public API |
| AC-HOME-013 | React, structural, and Playwright `hollow check` checks |
| AC-HOME-014 | React and Playwright documentation-route checks |
| AC-HOME-015 | structural capability-list checks |
| AC-HOME-016 | React, structural, and Playwright agentic-positioning checks on the first screen |
| AC-HOME-017 | structural developer-analogy check |
| AC-HOME-018 | React, structural, and Playwright compact-loop checks, including its position above the code example |
| AC-HOME-019 | structural checks barring output-quality, correctness, and review-replacement claims |
| AC-HOME-020 | structural check barring any productivity, velocity, or time-saving figure |
| AC-HOME-021 | React, structural, and Playwright test-first-step checks on the compact loop |
| AC-WEB-SGAD-013 | structural concrete-opening ordering check |
| AC-WEB-SGAD-014 | structural on-site documentation route check |
| AC-DOCS-001 | React, structural, and Playwright index-listing checks |
| AC-DOCS-002 | React, structural, and Playwright rendered-guide checks |
| AC-DOCS-003 | structural generated-prose and no-duplicate-copy checks |
| AC-DOCS-004 | React and Playwright current-marker and next-guide checks |
| AC-DOCS-005 | structural and Playwright API-reference link checks |
| AC-DOCS-006 | structural link-rewriting checks; Playwright resolved-link check |
| AC-DOCS-007 | structural noscript-fallback checks; Playwright no-JavaScript guide check |
| AC-DOCS-008 | structural `overflow-x` check; Playwright 320px code-block check |
| AC-DOCS-009 | Playwright Axe checks on `/docs/` and `/docs/routing/` |
| AC-DOCS-010 | React and structural data-entry-surface checks |
| AC-HOME-001 | React and Playwright product-opening checks |
| AC-HOME-002 | React and structural product-explanation checks |
| AC-HOME-003 | structural plain-language checks |
| AC-HOME-004 | React and structural SGAD-introduction checks |
| AC-HOME-005 | React and Playwright internal-route checks |
| AC-HOME-006 | structural and Playwright methodology-exclusion checks |
| AC-HOME-007 | structural unsupported-claim checks |
| AC-HOME-008 | browser visual review and structural page distinction |
| AC-HOME-009 | `tests/link-targets.test.mjs` |
| AC-HOME-010 | structural and Playwright no-diagram checks |
| AC-WEB-SGAD-001 | React and Playwright independent-methodology checks |
| AC-WEB-SGAD-002 | structural authority-boundary checks |
| AC-WEB-SGAD-003 | React and Playwright lifecycle checks |
| AC-WEB-SGAD-004 | structural expected-red explanation checks |
| AC-WEB-SGAD-005 | structural independent-verdict checks |
| AC-WEB-SGAD-006 | structural and Playwright adoption-reference checks |
| AC-WEB-SGAD-007 | structural, Playwright, and no-JavaScript file-example checks |
| AC-WEB-SGAD-008 | `tests/link-targets.test.mjs` |
| AC-WEB-SGAD-009 | React and Playwright return-route checks |
| AC-WEB-SGAD-010 | structural terminology checks |
| AC-WEB-SGAD-011 | structural methodology-claim checks |
| AC-WEB-SGAD-012 | React, structural, link-target, Playwright, and local skill-discovery checks |

### Red-state evidence

| Change | Observed result | Material characterization |
|---|---|---|
| Documentation, install, and comprehension, 2026-08-09T23:41:00Z | 13 passed, 15 failed; Node.js `v26.0.0`; `node --test tests/site-acceptance.test.mjs` at base `ba80feae1a35afdd3765b14dbfddd702e1694999` | Missing documentation generator, generated guide content and entry documents, `/docs/` and `/api/` routes and their navigation, the published install commands, the route example, the verification claim, the concrete SGAD opening, the guide-source workflow trigger, and the extended criterion mapping. The 13 unrelated structural checks continued to pass, so the failures are absent behavior rather than a broken runner |
| Historical single-page baseline, 2026-08-06T14:57:58Z | 1 passed, 18 failed; Node.js `v26.0.0` | Missing React/Vite app, canonical copy, design system, browser coverage, workflow, and traceability; the no-collection invariant passed |
| Two-page split, 2026-08-06T16:29:00Z | 3 passed, 11 failed | Missing SGAD entry, shared navigation, page components, browser coverage, and mappings |
| Feature-record correction, 2026-08-06T16:52:00Z | 13 passed, 1 failed | Old application-wide example remained |
| Application-record and license correction, 2026-08-06T17:02:00Z | 13 passed, 2 failed | Feature-only example and incorrect public-license copy remained |
| SGAD hero spacing | focused browser failure | Excessive empty band remained before the SGAD introduction |
| Custom domain | two focused failures | Root build base and `sleepyhollow.io` CNAME were absent |
| Pages concurrency, 2026-08-06T18:00:00Z | failed production observation and focused check | Pull-request, push, and manual queues were not isolated |
| Short skill install, 2026-08-06T19:07:00Z | structural 15/16; links 0/1 | Short command and canonical local skill package were absent at base `05e2aab` |

The historical single-page structural test digest was
`sha256:10b0e38e04a501685af69a94ef36af3bb0b687d5f38053dd153bdf87e7ab0c95`.
Each result above was classified as expected missing behavior against an
otherwise healthy runner.

### Verification

- Status: passed historically at 2026-08-06T17:24:12Z for the approved two-page
  website before later approved incremental corrections.
- Base revision: `fc6316cc9fe829450e3ac79c1582b6c959016fdf`.
- Implementation manifest:
  `working-tree:sha256:257f6b894e1e2d1badfffb7dfa4e974ad018dc6111cc8d83f0d4c3401a999706`.
- Verifier: `website/package.json#verify` version `0.1.0`.
- Results: structural 16/16, links 1/1, React 7/7, TypeScript and Vite build,
  Playwright/Axe 22/22, both direct routes, no-JavaScript fallbacks, responsive
  checks, reduced motion, WCAG automation, and Hallmark 58/58 passed.
- Short-install correction: passed independently at 2026-08-06T19:22:50Z for
  website SGAD digest
  `sha256:49c7921fc5f92784a79b1c1379c50fadfa5c57b5be1645e6a4e71bcd7046e170`.
- Redesign implementation pass, 2026-08-06: a bounded visual/structural
  improvement for marketing effectiveness (Hallmark-governed) — filled primary
  CTA button, numbered principle card grid, a static Tier-A CSS atmospheric
  hero panel on the framework page only, and a restructured SGAD closing
  action row. `website/design.md` was added to lock the shared token system.
  No requirement text, acceptance criterion, or narrative claim changed;
  approved criteria AC-SITE-001 through AC-SITE-011, AC-HOME-001 through
  AC-HOME-010, and AC-WEB-SGAD-001 through AC-WEB-SGAD-012 remain governed by
  the approvals above. Passed independently at 2026-08-06T19:57:00Z.
  Implementation manifest:
  `working-tree:sha256:251ef84f8b34a77c0d2eee65468103e16940f0eeaa69fc94c6dff2cf7bb1f205`
  (diff of `website/` against base revision `fc6316cc9fe829450e3ac79c1582b6c959016fdf`).
  Verifier: `website/package.json#verify`. Results: structural 16/16, links
  1/1, repository-consistency 9/9, React/Vitest 8/8, TypeScript build, Vite
  production build, Playwright/Axe 66/66 across Chromium, Firefox, and WebKit
  (WCAG 2.2 AA, all four required responsive widths on both routes, reduced
  motion, keyboard focus, no-JavaScript fallback, 1280×800 hero fit).
- User-requested correction, 2026-08-06: the shared floating-pill nav (N5)
  was replaced with an edge-aligned bar (N9) — sticky to the top, wordmark
  hard-left, "Home" / "SGAD Methodology" / "GitHub" hard-right — because the
  bare acronym link and the floating chip were not to the project owner's
  taste. Also fixed a pre-existing width defect: the file-map figcaption
  heading carried a stale 24ch max-width from an old two-column layout,
  wrapping into two cramped lines inside a much wider box. No requirement
  text or acceptance criterion changed; `.nav-pill` selectors were renamed to
  `.nav-bar` and the exact-text assertion `"SGAD"` was updated to `"SGAD
  Methodology"` in `src/App.test.tsx` and `tests/landing-page.spec.ts` to
  match the intentional, more descriptive link rename — same checks, same
  rigor, correct selector. Passed independently at 2026-08-06T20:48:00Z.
  Implementation manifest:
  `working-tree:sha256:1ce750f0d6acc474137c749db0d6140cb5e85ee191c6a37430297538877fec1b`
  (diff of `website/` against base revision `fc6316cc9fe829450e3ac79c1582b6c959016fdf`).
  Verifier: `website/package.json#verify`. Results: structural 16/16, links
  1/1, repository-consistency 9/9, React/Vitest 8/8, TypeScript build, Vite
  production build, Playwright/Axe 66/66 across Chromium, Firefox, and WebKit.
- User-requested removal, 2026-08-06: the hero atmospheric CSS panel
  (`hero__glow`) added during the redesign pass was removed at the project
  owner's request — the framework page hero is typography-only again
  (`.home-hero` reverted to a single-column layout). No requirement text or
  acceptance criterion changed. Passed independently at 2026-08-06T20:55:00Z.
  Implementation manifest:
  `working-tree:sha256:485c76de492818f2d96f826ea5396bdee8bcfe050d7d02c5ee133989c288bde2`
  (diff of `website/` against base revision `fc6316cc9fe829450e3ac79c1582b6c959016fdf`).
  Verifier: `website/package.json#verify`. Results: structural 16/16, links
  1/1, repository-consistency 9/9, React/Vitest 8/8, TypeScript build, Vite
  production build, Playwright/Axe 66/66 across Chromium, Firefox, and WebKit.
- User-requested hero alignment, 2026-08-06: the project owner asked for the
  two page heroes to "look similar." Brought the framework-page hero's
  typography, vertical anchor, and border weight into line with the SGAD
  hero's — same heading clamp/max-width, same lede size, bottom-anchored
  alignment, same heavy border-bottom rule — without collapsing the two page
  structures, which AC-SITE-005 and the child page requirements (`page
  structure and visual direction`) require to stay recognizably different.
  The SGAD page keeps its install-command block and long-form document body;
  the home page keeps its concise product sections below the fold. No
  requirement text or acceptance criterion changed. Passed independently at
  2026-08-06T21:00:00Z. Implementation manifest:
  `working-tree:sha256:a5e2dc562449d6401c046605bf2be954ad030a60222ad9ec6eca138af5c8f972`
  (diff of `website/` against base revision `fc6316cc9fe829450e3ac79c1582b6c959016fdf`).
  Verifier: `website/package.json#verify`. Results: structural 16/16, links
  1/1, repository-consistency 9/9, React/Vitest 8/8, TypeScript build, Vite
  production build, Playwright/Axe 66/66 across Chromium, Firefox, and WebKit.
- User-requested margin and layout correction, 2026-08-06: the SGAD page's
  `.methodology-document` carried its own inner 68rem width cap while the
  home page's sections stretched to the shared 96rem `main` container,
  producing visibly different side margins between the two pages. Removed the
  inner cap so both pages share the exact same outer width and gutter. That
  exposed a second defect: the file-map figure and the "Apply SGAD with tools
  you already trust." section, once full width, left their prose in a narrow
  left-hugging column with a large dead gap on the right. Gave both a
  two-column margin-note layout (caption/intro left, content right) at
  ≥60rem, matching the pattern already used by `.methodology-prose` and
  `.methodology-caution` on the same page; the file-map figure spans full
  width beneath the adoption intro/steps row. No requirement text or
  acceptance criterion changed. Passed independently at 2026-08-06T21:05:00Z.
  Implementation manifest:
  `working-tree:sha256:a9c64964af8dd9f954f223dfb177eab7d64d87f2a24b6f10f7cf9c979984cd06`
  (diff of `website/` against base revision `fc6316cc9fe829450e3ac79c1582b6c959016fdf`).
  Verifier: `website/package.json#verify`. Results: structural 16/16, links
  1/1, repository-consistency 9/9, React/Vitest 8/8, TypeScript build, Vite
  production build, Playwright/Axe 66/66 across Chromium, Firefox, and WebKit.
- User-requested type-scale correction, 2026-08-06: several body-copy
  elements were still sitting at the 1rem/0.875rem tier left over from the
  original single-page layout — nav bar links, file-map role labels and
  evidence paragraph, the framework principle-card descriptions, the SGAD
  lifecycle stage descriptions, and the adoption steps list. Raised them to
  match the size already used by comparable paragraph text elsewhere on the
  same pages (mostly `--text-md`/`--text-base`). This initially regressed
  AC-SITE-007 at 320px on both routes — nav bar links no longer fit on one
  row at the larger size — caught by the automated Playwright suite;
  corrected by keeping the larger nav-link size everywhere at ≥30rem and
  reverting to `--text-sm` only below that breakpoint, where the nav bar
  already sits on its own row. No requirement text or acceptance criterion
  changed. Passed independently at 2026-08-06T21:12:00Z. Implementation
  manifest:
  `working-tree:sha256:ea14906beb979d475cdbbc68c907ef3a02d0cf47ae15f4ccf508095197d8bfee`
  (diff of `website/` against base revision `fc6316cc9fe829450e3ac79c1582b6c959016fdf`).
  Verifier: `website/package.json#verify`. Results: structural 16/16, links
  1/1, repository-consistency 9/9, React/Vitest 8/8, TypeScript build, Vite
  production build, Playwright/Axe 66/66 across Chromium, Firefox, and WebKit.
- Current repository-wide verification is recorded in root `requirements.md`.

### Delivery

- Delivery was authorized for the verified website at `https://sleepyhollow.io`.
- The embedded record contains no independent post-delivery result; the earlier
  verification entry stated that DNS activation remained externally pending.
- No delivery is authorized by the current repository consistency requirement.

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: all acceptance criteria currently owned by the website.
- Governed-content digest:
  `sha256:5636854fe3dd65285040439d9e9210d3266069ab2dacf3cc0f6f5ab6b9e64350`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.
