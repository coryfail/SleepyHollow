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

Position Sleepy Hollow as what it is: an agentic-first API framework for Deno
with Specification-Governed Agentic Development built into it. Show that this
combination lets a developer build API endpoints with AI rapidly, while holding
that work to the procedures, requirements, and review a senior engineer would
insist on.

The page must stand on its own as the product landing page. A visitor should not
need to understand SGAD before understanding what Sleepy Hollow is — but SGAD is
the differentiator, not an afterthought, and the page must say so.

The governing idea, in the project owner's own framing: an AI agent needs the
same things any developer needs — a set of procedures, best practices, and
requirements to work against. Sleepy Hollow supplies them, so an agent produces
endpoints quickly and still works to the standard a senior human engineer would
be held to.

Two failures this revision corrects:

1. The first delivered page described the framework entirely in abstract nouns
   without showing a route, a command, or a result. Accuracy is necessary here
   and it is not sufficient.
2. The revision that fixed that led with verification and skepticism — what the
   framework refuses to certify — and buried the agentic positioning and the
   built-in method that are the actual reasons to choose it. Verification is how
   the promise is kept, not the promise itself.

## Audience and primary action

- Primary audiences: individual developers, engineering leads, AI-agent
  builders, and curious nontechnical readers.
- Primary action: install the framework, or read the documentation that shows
  how to use it.
- Secondary actions: continue to the dedicated SGAD methodology page, or
  inspect the Sleepy Hollow GitHub repository.

## Authorized narrative

- Identify Sleepy Hollow as an agentic-first headless API framework for Deno
  with SGAD built in, and say plainly what an API framework does for readers who
  need that.
- Explain Deno briefly for readers who do not know the runtime.
- State the honest release status: published to JSR, in development, pre-1.0,
  API subject to change.
- Lead with what the framework is for — building API endpoints with AI rapidly,
  under a method that keeps the work to a professional standard — before
  explaining what it refuses to do.
- Make the developer analogy explicit: an AI agent needs the same procedures,
  best practices, and requirements a human developer needs, and an ordinary
  framework supplies none of them.
- Present SGAD as a built-in capability of the framework, named on the first
  screen, not as a related methodology mentioned near the end.
- Show the method as a compact loop a reader can absorb in one pass, then send
  them to the SGAD page for the complete lifecycle.
- Include test-driven development as a visible step in that loop, not as an
  implementation detail mentioned later. Tests are written from the approved
  requirement and run before the implementation exists, and a failure only
  counts when it is caused by the missing behavior rather than by a broken test
  setup. This is the step that makes the agent's later "it passes" mean
  something, so a reader who skims the loop must still see it.
- Name the specific problem the framework exists to solve, in terms a reader can
  picture: an agent can produce plausible code, plausible tests, and a green
  checkmark, and nothing in an ordinary framework checks that the test actually
  exercised the handler it claims to cover.
- Show what the framework gives an ordinary backend — file-based routing, schema
  validation, typed storage, security defaults, generated contracts, deployment
  — before explaining what it adds beyond that.
- Show a real route definition using the framework's actual API, short enough to
  read at a glance.
- Explain that the framework records what handlers do while tests run, and
  refuses to certify a route that no test exercised.
- Show how to install the published package and the CLI, using the real
  commands.
- Describe the relationship between agent skills and deterministic framework
  tooling without implying that the producing agent certifies itself.
- Introduce SGAD as the design methodology used by Sleepy Hollow and link to the
  dedicated page for the complete explanation.
- Link to the documentation section, the published package, and the canonical
  repository.

## Content boundaries

- The page may summarize SGAD's governing idea: humans approve behavioral
  intent, agents implement bounded specifications, and evidence governs
  completion.
- The page may present the method as a compact loop of at most five steps, so a
  reader understands what SGAD does for them without leaving the page. Five is
  the ceiling because the loop must stay scannable; the seven-stage lifecycle
  remains the SGAD page's to tell.
- The page must not reproduce the full seven-stage SGAD lifecycle, adoption
  checklist, file-layout example, or methodology documentation. Those belong to
  the SGAD page.
- Speed claims must stay qualitative. The page may say that endpoints are built
  rapidly or quickly; it must not state or imply a measured productivity,
  velocity, or time-saving figure, because the project has measured none.
- Where the page invokes senior-engineer standards, it must be describing the
  procedures the framework enforces — approved requirements, mapped tests,
  observed behavior, independent verification. It must not claim that the
  output is of senior-engineer quality, that the code is correct, or that human
  review, security review, or domain expertise become unnecessary.
- The page must not present Sleepy Hollow as stable, production-ready, feature
  complete, or proven by adoption or performance metrics. Installability is now
  a fact and may be stated; maturity is not and may not.
- The page must not imply that SGAD requires Sleepy Hollow.
- Code shown on the page must be valid against the framework's current public
  API. Illustrative pseudocode that would not run is not permitted.
- Commands shown on the page must be the commands that actually work against
  the published package.

## Page structure and visual direction

- Lead with a concise, unmistakably product-focused first screen that names the
  framework, identifies it as agentic-first with SGAD built in, and states its
  status.
- Place the developer analogy and the compact method loop high on the page,
  above the code example, because they are the reason a visitor keeps reading.
- Use a typography-led hero with restrained atmospheric depth; do not include
  the evidence-trail illustration, its path markers, or a replacement diagram.
- Use a product-landing rhythm with concise sections rather than a long-form
  methodology document.
- Show code and commands as bounded, monospaced regions that scroll within
  themselves rather than widening the document.
- Sequence the page so a reader meets the problem, the shape of the solution,
  the code, and the install step in that order.
- Provide an intentional transition into the SGAD page instead of using SGAD as
  another equal-weight section on the same page.
- Shared navigation must identify this page as the Sleepy Hollow destination.

## Acceptance criteria

- AC-HOME-001: Given a visitor opens the root page, then the first screen names
  Sleepy Hollow, identifies it as an agentic-first headless API framework for
  Deno with Specification-Governed Agentic Development built in, and clearly
  states that it is in development and pre-1.0.
- AC-HOME-002: Given a visitor reads the framework explanation, then the page
  describes the relationship among reviewed requirements, agent implementation,
  test-driven development, deterministic verification, and a deployable API
  without contradicting `requirements/application.req.md`.
- AC-HOME-003: Given a visitor does not know Deno or deterministic verification,
  then nearby copy explains the essential meaning without requiring specialist
  knowledge.
- AC-HOME-004: Given SGAD is introduced, then the page expands its name or links
  it to an immediately understandable definition and states that Sleepy Hollow
  uses the methodology.
- AC-HOME-005: Given a visitor wants the complete methodology, then the primary
  action navigates to the internal `/sgad/` page with a descriptive accessible
  label.
- AC-HOME-006: Given the complete root page is inspected, then it may present
  the method as a compact loop of at most five steps, and it does not reproduce
  the full seven-stage SGAD lifecycle, the independent-adoption checklist, or
  the SGAD file-layout example.
- AC-HOME-007: Given the page is reviewed for honest status, then it contains no
  fabricated metric, testimonial, customer logo, unsupported product screenshot,
  or claim of stability, maturity, or production readiness. Stating that the
  package is published and how to install it is permitted and required by
  AC-HOME-011.
- AC-HOME-008: Given the rendered page is visually reviewed, then its misted,
  nocturnal woodland language feels serious and technical rather than like
  Halloween decoration, a horror promotion, or a generic dark SaaS template.
- AC-HOME-009: Given a visitor chooses to inspect the project, then a secondary
  action opens the canonical public GitHub repository without a placeholder URL.
- AC-HOME-010: Given the first screen is rendered, then it contains no
  evidence-trail path, tree-and-marker illustration, or substitute process
  diagram; typography and restrained atmosphere carry the hero hierarchy.
- AC-HOME-011: Given a visitor decides to try Sleepy Hollow, then the page shows
  the copy-pasteable command `deno add jsr:@sleepy-hollow/framework`, shows how
  to install the `hollow` CLI, and links to the published package on JSR.
- AC-HOME-012: Given a visitor wants to see what using the framework looks like,
  then the page shows a route definition written against the framework's current
  public API, including its declared schemas and its explicit authentication
  decision.
- AC-HOME-013: Given a visitor asks what the framework checks that others do
  not, then the page states in concrete terms that behavior is recorded while
  tests run and that a route no test exercised fails verification, naming the
  command that fails.
- AC-HOME-014: Given a visitor wants to learn how to use the framework, then a
  descriptive action navigates to the on-site documentation section.
- AC-HOME-015: Given the page names what the framework provides, then it lists
  the concrete capabilities a backend needs — routing, validation, storage,
  security, generated contracts, and deployment — rather than only describing
  the governance layer above them.

- AC-HOME-016: Given a visitor reads the first screen, then the page states that
  the framework is for building API endpoints with AI rapidly, using qualitative
  language only.
- AC-HOME-017: Given a visitor asks why an agent needs this framework, then the
  page makes the developer analogy explicit: an AI agent needs the same
  procedures, best practices, and requirements a human developer needs, and this
  framework supplies them.
- AC-HOME-018: Given a visitor wants to know what SGAD does for them, then the
  page presents the method as a compact loop of at most five steps, above the
  route example, and links to `/sgad/` for the complete lifecycle.
- AC-HOME-019: Given the page invokes senior-engineer standards, then it
  describes the procedures the framework enforces rather than claiming the
  output is senior-quality, correct, or exempt from human review.
- AC-HOME-020: Given the page is inspected for measurement claims, then it
  contains no productivity, velocity, time-saving, adoption, or benchmark
  figure.
- AC-HOME-021: Given a visitor reads the compact method loop, then one step is
  test-driven development, stating that the tests come from the approved
  requirement and run before the implementation exists, and that a failure
  counts only when the behavior is missing rather than the test setup broken.

## Approval boundary

Approval authorizes only the Sleepy Hollow page behavior and acceptance criteria
AC-HOME-001 through AC-HOME-021. Site-wide delivery behavior, documentation
behavior, and SGAD methodology content require their own approved requirements.

## Governance record

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
- Approved at: 2026-08-10T11:46:15Z.
- Approved criteria: AC-HOME-001 through AC-HOME-021.
- Governed-content digest:
  `sha256:4fb5297fdc8eb5bd257ab83cc4797cbfc6ed8f198f8b49724f4d6ca8b52e801c`.
- Decision source: owner review; direct response `Approve` after being shown the
  raised step ceiling, the proposed five-step loop, and the exact
  governed-content digest.
- Decision: test-driven development becomes a visible step in the compact loop
  rather than a detail mentioned further down the page, because it is the step
  that makes the later passing result mean anything. The loop ceiling rises
  from four steps to five; the seven-stage lifecycle stays on the SGAD page.

### Approval, superseded

- Status: approved for the repositioning this supersedes.
- Approver: human-project-owner.
- Approved at: 2026-08-10T11:34:23Z.
- Approved criteria: AC-HOME-001 through AC-HOME-020.
- Governed-content digest:
  `sha256:8e5bb7b4a2a177554619ca410579be895803e5de566d47de79ef64565cc7ed31`.
- Decision source: owner review; direct response `Approve` after being shown the
  repositioning, the two new guardrail criteria, and the exact
  governed-content digest.
- Decision: lead with the product — an agentic-first API framework for Deno with
  SGAD built in, for building endpoints with AI rapidly at a professional
  standard. Verification is how the promise is kept, not the promise itself.
  Senior-engineer language describes the enforced procedures, never the quality
  of the output, and no speed claim carries a number.

### Approval, superseded

- Status: approved for the comprehension revision this supersedes.
- Approver: human-project-owner.
- Approved at: 2026-08-09T23:32:11Z.
- Approved criteria: AC-HOME-001 through AC-HOME-015.
- Governed-content digest:
  `sha256:19d66121fc75accbd78223bc1d699f01d046d19a73a52c07bccc0c33a3f9bbbd`.
- Decision source: owner review; direct response `Approve all four` after being
  shown the material changes and the exact governed-content digest.
- Decision: the page must show the framework rather than describe it — real
  route code, the real install command, and a concrete statement of what
  verification rejects. Installability becomes a statable fact; maturity claims
  remain prohibited.

### Approval, superseded

- Status: approved for the narrative this revision supersedes.
- Approver: human-project-owner.
- Approved at: 2026-08-08T20:21:37Z.
- Approved criteria: the criteria recorded in this requirement.
- Governed-content digest:
  `sha256:7e659ea8953b0442ac7f79aa514a8ef32dbb7b283900dc3db08b0788c67344da`.
- Decision source: owner review; direct response `Approve` after review
  of the current content after the unbound-approval correction and the exact governed-content digest.

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

### Verification, current content

- Status: passed for AC-HOME-001 through AC-HOME-021.
- Verified at: 2026-08-10T11:49:08Z.
- Implementation manifest:
  `working-tree:sha256:2a6f512857f7e536c8d9d9a599ed9f69cfaacd3594b5c6293b0b0c20490c4cf3`.
- Verifier: `website/package.json#verify` version `0.1.1`.
- Results: structural 31/31, links 1/1, repository-consistency 9/9,
  React/Vitest 13/13, TypeScript build, Vite production build, and
  Playwright/Axe 135/135 across Chromium, Firefox, and WebKit. The page now
  opens on the agentic positioning with SGAD named as built in, carries the
  developer analogy in the owner's own framing, and presents a five-step method
  loop — including the test-first step — that the browser suite confirms sits
  above the route example.
- Owner review pass, 2026-08-10: the project owner reported that the
  capabilities heading overlapped the capability table while scrolling. Cause:
  `.section-intro` is `position: sticky` for the two-column `.framework`
  layout, and `.home-capabilities` inherited it after being given a
  single-column layout, so the heading pinned over the content scrolling
  beneath it. The intro is now static in that section, and a browser check
  fails on any single-column section whose intro is sticky, plus a geometric
  check that the heading never overlaps the ledger. No requirement text or
  acceptance criterion changed for this correction.
- The two guardrail criteria are enforced negatively and independently of the
  copy: AC-HOME-019 fails the build on any claim that the output is
  senior-quality, that the code is correct, or that human review becomes
  unnecessary; AC-HOME-020 fails on any percentage, multiplier, or time-saved
  figure. Both were confirmed to fail against seeded violating text before
  being relied on.
- Residual risk: the guardrails match known phrasings of an overreaching claim,
  not the claim's meaning. A novel wording that implies senior-quality output
  without using those constructions would pass the suite and would still
  violate the approved content boundary. Copy review remains a human step.

### Verification, superseded comprehension revision

- Status: passed for AC-HOME-001 through AC-HOME-015.
- Verified at: 2026-08-10T00:12:45Z.
- Implementation manifest:
  `working-tree:sha256:a5fd16f591f23d13e31ee96367f48f28c2f01047d86ceeb3a3f175413a8c9f39`.
- Verifier: `website/package.json#verify` version `0.1.0`.
- Results: the page now carries the published install commands, a route
  definition written against the current public API, the real
  `SH_CHECK_ROUTE_UNOBSERVED` diagnostic text, a route into the documentation
  section, and the concrete capability list. The install commands are checked
  against `deno.json` and `README.md` rather than asserted, and the shown
  diagnostic is checked against `cli/check/verifier.ts`, so neither can drift
  into fiction. The 1280×800 hero fit and all four responsive widths still pass
  across three engines.
- Residual risk: the route example is checked for the tokens the current API
  requires, not compiled. A signature change that kept those tokens would not
  be caught by the website suite.

### Verification, superseded content

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

- AC-HOME-001 through AC-HOME-010 map to the exact per-criterion entries in
  `website/requirements.md` and the named React, structural, link, browser, and
  visual checks.

### Red-state evidence

- Status: failed-as-expected at 2026-08-10T11:47:00Z for AC-HOME-021: 30 of 31
  structural checks passed and exactly one failed, because the compact loop had
  four steps and none of them established that tests are written from the
  approved requirement and run before the implementation exists. A single
  focused failure against 30 passing checks is the expected shape for adding one
  criterion to working behavior.
- Status: failed-as-expected at 2026-08-10T11:36:00Z for the repositioning:
  26 of 30 structural checks passed and 4 failed. The three checks carrying
  AC-HOME-016 through AC-HOME-020 failed because the page opened on
  verification rather than on the agentic positioning, never named SGAD as
  built in, carried no developer analogy, and declared no compact method loop;
  the traceability check failed for the unmapped new criteria. The 26 checks
  covering the existing page, the documentation section, and the SGAD page
  passed in the same run, so the failures are absent behavior rather than a
  broken runner.
- Status: failed-as-expected at 2026-08-09T23:41:00Z for AC-HOME-011 through
  AC-HOME-015: 13 of 28 structural checks passed and 15 failed at base revision
  `ba80feae1a35afdd3765b14dbfddd702e1694999`. The three checks carrying the new
  home criteria failed because the page carried no install command, no route
  example, no `hollow check` claim, no documentation route, and no list of the
  ordinary backend capabilities the framework provides. The runner was healthy
  and the checks covering the existing home narrative continued to pass.
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
