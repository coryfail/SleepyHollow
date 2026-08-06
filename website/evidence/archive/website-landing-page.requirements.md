---
schema: sgad-component/v0.1
id: website-landing-page
title: Sleepy Hollow and SGAD landing page
status: approved
risk: standard
depends_on:
  - sleepy-hollow-application
  - sgad-methodology
owners:
  - SleepyHollow maintainers
---

# Landing page requirements

## Purpose

Create a simple public landing page that explains what Sleepy Hollow is intended
to become, what Specification-Governed Agentic Development (SGAD) is, and how a
person can begin applying SGAD without adopting Sleepy Hollow.

The page serves individual developers, engineering leads, AI-agent builders, and
curious nontechnical readers. It should make agentic development governance
understandable without erasing the technical concepts that make SGAD useful.

## Authorized scope

- Create a static React landing page under `website/`.
- Explain the planned Sleepy Hollow framework using the approved product
  requirements as the source of truth.
- Explain SGAD as a framework-independent methodology using the repository's SGAD
  documents as the source of truth.
- Present a concise, approachable SGAD workflow and practical steps for adopting
  it in another project.
- Link readers to the Sleepy Hollow repository and the canonical SGAD
  documentation stored in that repository.
- Establish a responsive, accessible visual system whose atmosphere evokes
  Sleepy Hollow while keeping the content legible and credible.
- Build and publish the static site to GitHub Pages through GitHub Actions after
  changes reach the production branch.

## Out of scope

- Product documentation, API reference, tutorials, a blog, or a documentation
  search experience hosted inside the website.
- Authentication, user accounts, forms, newsletters, comments, analytics,
  cookies, tracking, databases, server-side rendering, or server-side APIs.
- An installation flow or runnable Sleepy Hollow demo before those capabilities
  exist and are verified.
- Claims about adoption, performance, customers, release readiness, or other
  metrics that are not supported by repository evidence.
- A custom domain, content-management system, localization, or multiple website
  routes in the initial release.
- Changing the Sleepy Hollow or SGAD product requirements from the landing-page
  implementation.

## Inputs

- Canonical Sleepy Hollow product content comes from
  `requirements/application.md`.
- Canonical SGAD content comes from `docs/sgad/`, with
  `docs/sgad/README.md`, `docs/sgad/principles.md`, and
  `docs/sgad/workflow.md` providing the primary narrative.
- Repository and documentation links must resolve to real public destinations;
  placeholder URLs are not permitted in the production build.
- Public-facing copy may summarize canonical documents but must not contradict
  them or present draft behavior as released behavior.

## Success outcomes

### Page narrative

The page should form one coherent story rather than a collection of generic
feature cards:

1. Introduce Sleepy Hollow as an agentic-first headless API framework for Deno
   that is currently being developed.
2. Explain the problem it addresses: agents can generate code quickly, but human
   intent and independently checkable evidence must govern what is accepted.
3. Explain the planned Sleepy Hollow relationship between its agent workflow and
   deterministic framework tooling.
4. Define SGAD in plain language and identify its core boundary: humans approve
   behavioral intent, approved specifications authorize work, agents implement,
   and independent evidence governs completion.
5. Present an understandable SGAD lifecycle that includes specifying behavior,
   approving bounded intent, deriving tests, observing the expected red state,
   implementing, independently verifying, and delivering with evidence.
6. Show how readers can adopt SGAD without Sleepy Hollow by colocating
   requirements, giving acceptance criteria stable identifiers, mapping tests to
   those criteria, recording expected-red evidence, and using independent
   verification.
7. Direct interested readers to the canonical SGAD guide and the GitHub
   repository for deeper detail.

### Visual direction

- The experience should evoke "Sleepy Hollow" through a dark, misted,
  woodland-at-night atmosphere with restrained supernatural or storybook cues.
- The design must feel serious and technical rather than like seasonal Halloween
  decoration, a horror promotion, or a generic dark SaaS template.
- Atmospheric decoration must support the information hierarchy and must never
  reduce text contrast, obscure controls, or compete with the explanation.
- Copy should use plain language, define SGAD before relying on the acronym, and
  briefly explain specialist terms where they first appear.
- The page must not use fabricated testimonials, customer logos, statistics,
  product screenshots, or unsupported comparison claims.

## Error outcomes

- If a repository or documentation destination is unavailable, the build or link
  validation must fail rather than publishing a known placeholder or broken
  internal link.
- If the production build cannot be created, GitHub Pages deployment must not
  proceed with stale or partial output.
- If verification fails, the workflow must report the failure and preserve the
  previously deployed site.
- A missing decorative asset must not make the written explanation inaccessible;
  essential meaning must remain in semantic text.

## State and data access

- The site is a static, read-only document.
- The initial release owns no user or application state and performs no data
  reads or writes after its static assets load.
- The site must not store identifiers or preferences in cookies, local storage,
  session storage, IndexedDB, or remote services.

## Authentication and authorization

- Authentication and authorization decision: `none`.
- All published content is public.
- GitHub Pages deployment permissions must be limited to reading repository
  contents, writing Pages output, and obtaining the deployment identity token
  required by GitHub Pages.

## Side effects

- A production deployment publishes a new static GitHub Pages artifact.
- Only the `main` production branch may automatically deploy the public site.
- Pull requests and feature branches may build and verify the site but must not
  publish it.
- Deployment is an external mutation and requires the repository's applicable
  approval and environment protections before the first publication.

## Non-functional requirements

### Technology and repository layout

- The website must be an isolated React application under `website/`, using
  TypeScript and a static Vite build unless an approved requirement revision
  selects another React-compatible static build tool.
- Website dependencies must remain scoped to `website/`; consuming or developing
  the framework must not require installing website dependencies.
- The production build must work at the repository-specific GitHub Pages base
  path and must not assume deployment at the domain root.
- Generated dependencies and build output must not be committed.

### Accessibility and comprehension

- The document must use semantic landmarks and a logical heading hierarchy.
- Every interactive element must be reachable and operable by keyboard and have
  a visible focus indicator.
- Text and interactive states must meet WCAG 2.2 AA contrast requirements.
- Decorative graphics must be ignored by assistive technology; meaningful
  graphics require an accessible text alternative.
- The page must remain understandable when styling, animation, or decorative
  imagery is unavailable.

### Responsive behavior

- The page must function without horizontal scrolling at viewport widths of
  320, 375, 414, and 768 CSS pixels and at representative desktop widths.
- Navigation and action labels must remain readable without clipping or
  two-line clickable text at the required widths.
- Display headings must wrap safely without forcing content outside the viewport.

### Motion and performance

- Motion must be restrained, communicate hierarchy or state, and animate only
  transform or opacity.
- The experience must honor `prefers-reduced-motion`; no information may depend
  on animation.
- The page must remain useful with JavaScript unavailable: its core explanatory
  content and destinations must be present in the generated static HTML or an
  approved fallback strategy must provide equivalent access.
- Production output must contain no development-only diagnostics or source-map
  references exposed unintentionally.

### Metadata and compatibility

- The document must declare its language and provide a descriptive page title
  and summary metadata for search and link previews.
- The favicon and social-preview presentation must not claim a finalized brand
  identity unless corresponding approved assets exist.
- The production build must work in current stable versions of Chromium,
  Firefox, and Safari.

## Acceptance criteria

- AC-WEB-001: Given the website dependencies are installed, when the production
  build runs from `website/`, then it emits a static deployable artifact without
  build errors or files outside the authorized output directory.
- AC-WEB-002: Given a visitor opens the page, then the first screen identifies
  Sleepy Hollow as an agentic-first headless API framework for Deno and makes its
  in-development status clear without implying that installation or production
  use is currently available.
- AC-WEB-003: Given a visitor reads the Sleepy Hollow explanation, then the page
  describes reviewed requirements, agent implementation, test-driven
  development, and deterministic framework verification without contradicting
  `requirements/application.md`.
- AC-WEB-004: Given a visitor encounters SGAD for the first time, then the page
  expands the acronym, defines it in plain language, and explains that SGAD can
  be used without Sleepy Hollow.
- AC-WEB-005: Given a visitor reads the SGAD workflow, then the page presents
  specification, human approval, acceptance tests, expected red evidence,
  implementation, independent verification, and evidence-backed delivery as
  distinct lifecycle responsibilities.
- AC-WEB-006: Given a visitor wants to apply SGAD independently, then the page
  provides a concise sequence of concrete adoption steps and links to the
  canonical SGAD guide and reusable templates.
- AC-WEB-007: Given a visitor is not a software specialist, then every essential
  section is understandable without assumed knowledge of Deno, TDD, CI, or
  agentic-development terminology, and any necessary specialist term is defined
  in nearby copy.
- AC-WEB-008: Given a visitor follows a primary or secondary page action, then it
  opens the intended canonical SGAD documentation or Sleepy Hollow repository
  destination with a descriptive accessible label and no placeholder URL.
- AC-WEB-009: Given the complete rendered page, then its visual language evokes a
  misted, nocturnal Sleepy Hollow atmosphere while avoiding Halloween kitsch,
  graphic horror, fabricated product imagery, and a generic dark SaaS
  presentation.
- AC-WEB-010: Given the page is inspected structurally, then it contains one
  logical level-one heading, ordered heading levels, and appropriate header,
  navigation, main, section, and footer landmarks.
- AC-WEB-011: Given a keyboard-only visitor traverses the page, then every
  interactive element is reachable in meaningful order, exposes an immediate
  visible focus indicator, and can be activated without a pointer.
- AC-WEB-012: Given automated contrast checks on default, hover, focus, active,
  disabled, error, loading, and success styles that the site uses, then text and
  interactive states meet WCAG 2.2 AA contrast thresholds.
- AC-WEB-013: Given viewport widths of 320, 375, 414, and 768 CSS pixels, then the
  page has no horizontal overflow, clipped essential content, unsafe heading
  wrapping, or wrapped multi-line action labels.
- AC-WEB-014: Given a visitor requests reduced motion, then nonessential spatial
  motion is removed or reduced to a brief opacity transition and no content or
  control becomes unavailable.
- AC-WEB-015: Given the page runs in a browser, then it performs no analytics,
  tracking, authentication, remote data writes, or browser-storage writes.
- AC-WEB-016: Given a pull request or feature-branch revision, then automated
  checks build and verify the website without deploying a public Pages artifact.
- AC-WEB-017: Given a verified website revision reaches `main`, then the Pages
  workflow builds `website/`, uploads only its production artifact, and deploys
  it using the `github-pages` environment and least-required workflow
  permissions.
- AC-WEB-018: Given the site is served from the repository-specific GitHub Pages
  path, then all application assets and internal fragment links resolve without
  assuming a domain-root deployment.
- AC-WEB-019: Given implementation and verification are complete, then each
  acceptance criterion has bidirectional traceability to one or more automated
  tests, deterministic checks, or an explicitly identified human visual-review
  item, and all expected-red evidence is recorded before the satisfying
  implementation.

## Dependencies and assumptions

- The GitHub repository will remain the canonical source for Sleepy Hollow and
  SGAD content during the initial website release.
- The repository permits GitHub Actions and GitHub Pages deployments.
- The repository name and owner can be derived at build or configuration time so
  links and the Pages base path do not depend on an unreviewed placeholder.
- The site will initially be published at the repository's standard GitHub Pages
  URL; choosing a custom domain requires a separate approved requirement.
- Current React, Vite, Node.js, and GitHub Actions versions will be pinned or
  selected during implementation and recorded in the lockfile and workflow.
- Hallmark governs the design process and visual verification but does not replace
  SGAD approval, acceptance testing, or independent verification.

## Change impact

Changes may affect public messaging, canonical documentation links, brand and
design tokens, accessibility evidence, website tests, the static build, GitHub
Actions permissions, and the deployed Pages artifact. Changes to Sleepy Hollow or
SGAD source requirements require a content-impact review; changes to the website
requirements, tests, dependencies, build configuration, or deployment workflow
invalidate the affected approval or verification evidence.

## Open decisions

- Final public repository URLs will be confirmed from the configured Git remote
  before tests are authored.
- The Hallmark macrostructure, catalog theme, typography pairing, and enrichment
  technique will be proposed in a design preview after these behavioral
  requirements are approved.
- A logo, favicon, or social-preview image is deferred unless an approved asset
  already exists or a later requirement explicitly authorizes creating one.

## Approval scope

Approval authorizes the behaviors and acceptance criteria AC-WEB-001 through
AC-WEB-019 for the initial single-page React website and its GitHub Pages build
and deployment workflow. It does not authorize any out-of-scope capability,
custom domain, analytics, data collection, product availability claim, or public
deployment before the required delivery approval and verification evidence
exist.
