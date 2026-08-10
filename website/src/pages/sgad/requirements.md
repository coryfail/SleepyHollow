---
schema: sgad-component/v0.2
id: website-sgad-page
title: SGAD methodology page
status: verified
risk: standard
depends_on:
  - sleepy-hollow-website
  - sgad-methodology
owners:
  - Sleepy Hollow maintainers
---

# SGAD methodology page requirements

## Purpose

Explain Specification-Governed Agentic Development as a framework-independent
method for keeping human intent, agent work, and independently checkable evidence
connected. Give readers enough structure to begin applying SGAD with ordinary
Markdown, source control, and their existing test tools.

The page must remain useful to people who never use Sleepy Hollow.

## Audience and primary action

- Primary audiences: individual developers, engineering leads, AI-agent
  builders, governance-minded teams, and nontechnical stakeholders who need to
  understand how human review remains authoritative.
- Primary action: read and apply the SGAD workflow.
- Secondary actions: open the canonical SGAD documents or return to the Sleepy
  Hollow framework page.

## Authorized narrative

- Expand and define Specification-Governed Agentic Development before relying
  on the SGAD acronym.
- State the central authority boundary: humans review and approve behavioral
  intent; approved specifications authorize bounded work; agents implement;
  independent verification evaluates evidence.
- Explain the lifecycle as distinct responsibilities: specify, approve, derive
  acceptance tests, observe expected red, implement, verify independently, and
  deliver with evidence.
- Explain why a failing test is useful only when it fails for the expected
  missing behavior rather than because the test environment is broken.
- Explain the separation between the producing agent and the independent
  verification decision.
- Provide a practical adoption checklist and a compact example of colocated
  requirements, tests, implementation, and evidence.
- Explain that application-wide intent belongs in
  `requirements/application.md`, component requirements stay beside their
  behavior, and root `requirements.md` is reserved for repository-wide behavior.
- Open with a concrete account of what actually changes for a team that adopts
  SGAD, before any lifecycle detail: what a developer writes, what a human
  approves, what a machine checks, and what a finished change consists of.
- Link to the canonical SGAD guide and reusable templates in the repository, and
  to the SGAD documentation published on this site.
- Provide one copy-pasteable terminal line using the open agent-skills CLI to
  install the standalone SGAD skill directly from its repository path.

## Content boundaries

- Present SGAD as a proposed open methodology documented by this project, not as
  an established industry standard or a guarantee of correct software.
- Do not make Sleepy Hollow a prerequisite for using SGAD.
- Do not turn the page into Sleepy Hollow product marketing; one concise note may
  explain that Sleepy Hollow is intended to embody the methodology.
- Do not claim that automated checks eliminate the need for human judgment,
  security review, domain expertise, or production monitoring.
- Do not invent compliance, adoption, productivity, quality, or safety metrics.

## Page structure and visual direction

- Use a reading-focused, methodology-document structure distinct from the
  product landing page while preserving the shared Sleepy Hollow design system.
- Make the seven lifecycle responsibilities easy to scan without reducing them
  to generic feature cards.
- Keep the human approval boundary visually prominent throughout the workflow.
- Present the adoption checklist and file-layout example as practical reference
  material rather than product UI.
- Present the install command as a compact technical affordance that stays on one
  line when space permits and scrolls within its own bounded region on narrow
  screens.
- Shared navigation must identify this page as the SGAD destination and provide
  a clear route back to Sleepy Hollow.

## Acceptance criteria

- AC-WEB-SGAD-001: Given a visitor opens `/sgad/`, then the first screen expands
  Specification-Governed Agentic Development, defines it in plain language, and
  states that it can be used without Sleepy Hollow.
- AC-WEB-SGAD-002: Given a visitor reads the authority explanation, then the page
  clearly distinguishes human behavioral-intent approval, specification-bounded
  agent work, and evidence-based completion.
- AC-WEB-SGAD-003: Given a visitor reads the workflow, then specification, approval,
  acceptance tests, expected red, implementation, independent verification, and
  evidence-backed delivery appear as distinct ordered responsibilities.
- AC-WEB-SGAD-004: Given expected red is explained, then the page distinguishes a
  meaningful missing-behavior failure from syntax, configuration, dependency,
  or test-environment failure.
- AC-WEB-SGAD-005: Given independent verification is explained, then the page states
  that the producing agent's confidence or summary is not the verification
  verdict.
- AC-WEB-SGAD-006: Given a reader wants to adopt SGAD, then the page provides concrete
  steps covering colocated requirements, stable acceptance-criterion IDs,
  approval records, bidirectional test mapping, expected-red evidence, and an
  independent verification command.
- AC-WEB-SGAD-007: Given the practical file example is read without styling, then its
  relationship among requirements, tests, implementation, and evidence remains
  understandable in semantic text and the surrounding explanation assigns
  application, component, and repository-wide requirements to their owners.
- AC-WEB-SGAD-008: Given a visitor wants more detail, then descriptive links open the
  canonical SGAD guide and reusable templates without placeholder destinations.
- AC-WEB-SGAD-009: Given a visitor wants product context, then a secondary internal
  route returns to the Sleepy Hollow framework page without implying that the
  methodology depends on it.
- AC-WEB-SGAD-010: Given a nontechnical reader encounters TDD, deterministic
  verification, traceability, or content digests, then each essential term is
  explained near its first use or omitted when it is not necessary.
- AC-WEB-SGAD-011: Given the methodology claims are reviewed against `docs/sgad/`,
  then the page does not present SGAD as an established standard, a guarantee,
  or a substitute for human judgment and domain-specific review.
- AC-WEB-SGAD-012: Given an agent user wants to apply SGAD outside Sleepy Hollow,
  then the page provides the visible, copy-pasteable terminal command
  `npx skills add coryfail/SleepyHollow --skill sgad-workflow`
  without implying that the Sleepy Hollow framework is installed.
- AC-WEB-SGAD-013: Given a visitor reaches `/sgad/` without knowing the method,
  then the page states concretely what a team does differently under SGAD before
  it presents the lifecycle, and that explanation does not depend on the phrases
  specification-governed, bounded authority, or evidence-based completion to
  carry its meaning.
- AC-WEB-SGAD-014: Given a reader wants the complete methodology, then the page
  routes to the SGAD documentation published on this site, in addition to the
  canonical repository sources.

## Approval boundary

Approval authorizes only the SGAD page behavior and acceptance criteria
AC-WEB-SGAD-001 through AC-WEB-SGAD-014. Site-wide delivery behavior,
documentation behavior, and the Sleepy Hollow product narrative require their
own approved requirements.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T23:32:11Z.
- Approved criteria: AC-WEB-SGAD-001 through AC-WEB-SGAD-014.
- Governed-content digest:
  `sha256:9f68d70fe001b32a8fde7e2185915738f3e65d3aac359d7804345f05df3fb1dc`.
- Decision source: owner review; direct response `Approve all four` after being
  shown the material changes and the exact governed-content digest.
- Decision: explain what a team actually does differently under SGAD before
  presenting the lifecycle, without leaning on the method's own vocabulary to
  carry the explanation, and route readers to the on-site SGAD documentation.

### Approval, superseded

- Status: approved for the narrative this revision supersedes.
- Approver: human-project-owner.
- Approved at: 2026-08-08T20:21:37Z.
- Approved criteria: the criteria recorded in this requirement.
- Governed-content digest:
  `sha256:bb13e32a8e656e3bc3ecb67c3136e9c79ec62304136a85d5ab4071c662fc96fb`.
- Decision source: owner review; direct response `Approve` after review
  of the current content after the unbound-approval correction and the exact governed-content digest.

### Approval, unbound

- Status: no recorded approval binds the current content.
- Observed at: 2026-08-08T20:20:04Z.
- Current governed-content digest:
  `sha256:bb13e32a8e656e3bc3ecb67c3136e9c79ec62304136a85d5ab4071c662fc96fb`.
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
- Approved at: 2026-08-06T19:19:08Z.
- Approved criteria: AC-WEB-SGAD-001 through AC-WEB-SGAD-012.
- Historical exact-content digest:
  `sha256:49c7921fc5f92784a79b1c1379c50fadfa5c57b5be1645e6a4e71bcd7046e170`.
- Decision: publish the standalone SGAD skill with the short agent-skills CLI
  installation command.

### Verification, current content

- Status: passed for AC-WEB-SGAD-001 through AC-WEB-SGAD-014.
- Verified at: 2026-08-10T00:12:45Z.
- Implementation manifest:
  `working-tree:sha256:a5fd16f591f23d13e31ee96367f48f28c2f01047d86ceeb3a3f175413a8c9f39`.
- Verifier: `website/package.json#verify` version `0.1.1`.
- Results: the page opens with a four-part plain-language account of what a
  team does differently, placed ahead of the lifecycle and checked for that
  ordering, and routes to the SGAD documentation published on this site. The
  seven lifecycle stages, the install command, the file map, and the honesty
  boundary all continue to pass unchanged across three engines.
- Residual risk: the ordering check reads source position, so a future
  refactor that moved the opening into a component defined later in the file
  would fail the check without the rendered order changing.

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

- AC-WEB-SGAD-001 through AC-WEB-SGAD-012 map to the exact per-criterion entries in
  `website/requirements.md` and the named React, structural, link, browser,
  no-JavaScript, and skill-discovery checks.

### Red-state evidence

- Concrete opening and on-site documentation route: failed-as-expected at
  2026-08-09T23:41:00Z for AC-WEB-SGAD-013 and AC-WEB-SGAD-014. The check
  failed because the page went from its lede straight into the lifecycle with
  no plain-language account of what a team does differently, and carried no
  route to the SGAD documentation published on this site. The other four SGAD
  structural checks passed in the same healthy run.
- Two-page split: 3 of 14 structural checks passed and 11 failed at
  2026-08-06T16:29:00Z for the absent SGAD route and content.
- Short-install correction: structural checks passed 15/16 and link checks 0/1
  at 2026-08-06T19:07:00Z because the short command and canonical package were
  absent at base revision `05e2aab`.
- Both results were failed-as-expected with healthy unrelated checks.

### Verification

- Status: passed at 2026-08-06T19:22:50Z for the historical approved digest.
- Structural, React, link-target, local skill-discovery, and Chromium
  desktop/mobile checks passed.
- Current verification is recorded by the parent website requirement.

### Delivery

- Status: governed by the parent website requirement; no independent page-only
  delivery record exists.
