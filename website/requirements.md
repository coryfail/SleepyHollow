---
schema: sgad-application/v0.1
id: sleepy-hollow-website
title: Sleepy Hollow public website
status: approved
risk: standard
depends_on:
  - sleepy-hollow-application
  - sgad-methodology
owners:
  - SleepyHollow maintainers
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
  evidence, and an implementation-bound verification report.

## Change history and approval boundary

This draft supersedes the approved single-page intent identified by requirement
digest `sha256:299742bd6eca92fd51118a13649094ede3224031f2a42081c16df5cf15fdf29f`.
That exact requirement is retained at
`evidence/archive/website-landing-page.requirements.md`.

The prior approval and verification remain historical evidence for the
single-page implementation. They do not authorize this two-page revision. Human
approval must bind this file and both child page requirements before acceptance
tests or implementation are changed.
