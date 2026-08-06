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

Create a small public website with two distinct but connected destinations:

1. A Sleepy Hollow framework landing page that introduces the planned product,
   its agentic-first approach, and its relationship to SGAD.
2. A dedicated Specification-Governed Agentic Development (SGAD) page that
   explains the methodology independently of Sleepy Hollow and gives readers a
   practical way to adopt it.

The split must let readers understand Sleepy Hollow without first reading a
methodology document while giving SGAD enough room to be useful to people who
never adopt the framework.

## Authorized scope

- Maintain a static React website under `website/`.
- Publish the Sleepy Hollow page at `https://sleepyhollow.io/`.
- Publish the SGAD methodology at a stable `/sgad/` path beneath that root.
- Provide clear navigation between the two pages and to the canonical GitHub
  repository and SGAD source documents.
- Share one visual system, accessibility standard, deployment workflow, and
  evidence model across both pages.
- Build and publish both pages through GitHub Pages after the verified release
  reaches `main`.

## Out of scope

- Product documentation, API reference, tutorials, blog content, search, or a
  documentation portal.
- Authentication, forms, newsletters, analytics, cookies, tracking, databases,
  remote data access, server-side rendering, or server-side APIs.
- Product installation claims, runnable demonstrations, fabricated metrics,
  testimonials, customer logos, or unsupported availability claims.
- Additional domains, a content-management system, localization, or additional
  site routes without a separately approved requirement.
- Changing the canonical Sleepy Hollow or SGAD methodology requirements from
  website copy.

## Feature ownership

| Feature | Route | Requirement |
|---|---|---|
| Sleepy Hollow framework page | `/` | `src/pages/sleepy-hollow/requirements.md` |
| SGAD methodology page | `/sgad/` | `src/pages/sgad/requirements.md` |

Each page is independently valuable and owns its narrative acceptance criteria.
This file owns only cross-page behavior and shared delivery constraints.

## Shared experience

- Both pages must unmistakably belong to the same Sleepy Hollow site through
  shared typography, color tokens, navigation language, and interaction rules.
- The pages may use different layouts and information density to match their
  different jobs; visual consistency must not collapse them into duplicate
  templates.
- The framework page must summarize SGAD and link to the dedicated methodology
  page rather than reproducing its full lifecycle.
- The SGAD page must explain that the methodology can be used without Sleepy
  Hollow and provide a clear path back to the framework page.
- Public copy must distinguish current, planned, and verified behavior.

## Routes and static delivery

- The build must emit independent static entry documents for the root framework
  page and the `/sgad/` methodology page.
- Direct navigation or refresh at either public URL must succeed on GitHub Pages
  without client-side redirect tricks or a domain-root assumption.
- Internal links and assets must resolve from the custom-domain root without a
  repository-name path prefix.
- The published artifact must include a `CNAME` record for `sleepyhollow.io`.
- Core content and destinations on both pages must remain available when
  JavaScript is disabled.
- A missing page artifact or linked canonical repository document must fail
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
  build runs, then it emits deployable static entry documents for both the
  framework root and `/sgad/` without writing outside the authorized output.
- AC-SITE-002: Given a visitor is on either page, then the shared navigation
  identifies the current destination and provides a descriptive, keyboard-
  operable route to the other page.
- AC-SITE-003: Given `https://sleepyhollow.io/` or
  `https://sleepyhollow.io/sgad/` is opened directly or refreshed, then the
  correct page and all required assets load without a redirect loop, 404
  response, or repository-name path prefix.
- AC-SITE-004: Given JavaScript is disabled, then each page still exposes its
  core explanation and primary destinations in semantic HTML.
- AC-SITE-005: Given both pages are visually compared, then they share the same
  design tokens and brand atmosphere while using recognizably different page
  structures appropriate to their distinct purposes.
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
- AC-SITE-011: Given verification is complete, then site criteria and both page
  feature criteria have bidirectional traceability, retained expected-red
  evidence, and an implementation-bound embedded verification entry.

## Change history and approval boundary

This draft supersedes the approved single-page intent identified by requirement
digest `sha256:299742bd6eca92fd51118a13649094ede3224031f2a42081c16df5cf15fdf29f`.
That historical revision remains recoverable from Git history; its material
approval and evidence provenance is retained in the governance record below.

The prior approval and verification remain historical evidence for the
single-page implementation. They do not authorize this two-page revision. Human
approval must bind this file and both child page requirements before acceptance
tests or implementation are changed.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

| Requirement revision | Approved criteria | Digest | Approver | Approved at | Decision |
|---|---|---|---|---|---|
| Historical single-page website | AC-WEB-001–019 | `sha256:299742bd6eca92fd51118a13649094ede3224031f2a42081c16df5cf15fdf29f` | human-project-owner | 2026-08-06T14:57:58Z | “Perfect, let's continue still using SGAD” |
| Sleepy Hollow framework page | AC-HOME-001–010 | `sha256:20af56fff2d4b0786637895b333a94a75d38c98efd8b11c1d44ebb0ebbaa343e` | human-project-owner | 2026-08-06T16:27:58Z | Keep the home page product-focused and move the methodology to its own page |
| SGAD page with short install | AC-WEB-SGAD-001–012 | `sha256:49c7921fc5f92784a79b1c1379c50fadfa5c57b5be1645e6a4e71bcd7046e170` | human-project-owner | 2026-08-06T19:19:08Z | Publish the standalone skill with the short agent-skills command |
| Two-page website and delivery scope | AC-SITE-001–011 | `sha256:57d0e449cae7d4bc2e5fc6397ac9641f9255fd16b3417368e68b043a3a34075e` | human-project-owner | 2026-08-06T17:20:18Z | Commit, push, and publish the verified website at `https://sleepyhollow.io` |

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-SITE-001 | `tests/two-page-acceptance.test.mjs`; `npm run build` |
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
- Current repository-wide verification is recorded in root `requirements.md`.

### Delivery

- Delivery was authorized for the verified website at `https://sleepyhollow.io`.
- The embedded record contains no independent post-delivery result; the earlier
  verification entry stated that DNS activation remained externally pending.
- No delivery is authorized by the current repository consistency requirement.
