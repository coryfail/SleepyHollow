---
schema: sgad-component/v0.1
id: website-sgad-page
title: SGAD methodology page
status: approved
risk: standard
depends_on:
  - sleepy-hollow-website
  - sgad-methodology
owners:
  - SleepyHollow maintainers
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
- Link to the canonical SGAD guide and reusable templates in the repository.

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
- Shared navigation must identify this page as the SGAD destination and provide
  a clear route back to Sleepy Hollow.

## Acceptance criteria

- AC-SGAD-001: Given a visitor opens `/sgad/`, then the first screen expands
  Specification-Governed Agentic Development, defines it in plain language, and
  states that it can be used without Sleepy Hollow.
- AC-SGAD-002: Given a visitor reads the authority explanation, then the page
  clearly distinguishes human behavioral-intent approval, specification-bounded
  agent work, and evidence-based completion.
- AC-SGAD-003: Given a visitor reads the workflow, then specification, approval,
  acceptance tests, expected red, implementation, independent verification, and
  evidence-backed delivery appear as distinct ordered responsibilities.
- AC-SGAD-004: Given expected red is explained, then the page distinguishes a
  meaningful missing-behavior failure from syntax, configuration, dependency,
  or test-environment failure.
- AC-SGAD-005: Given independent verification is explained, then the page states
  that the producing agent's confidence or summary is not the verification
  verdict.
- AC-SGAD-006: Given a reader wants to adopt SGAD, then the page provides concrete
  steps covering colocated requirements, stable acceptance-criterion IDs,
  approval records, bidirectional test mapping, expected-red evidence, and an
  independent verification command.
- AC-SGAD-007: Given the practical file example is read without styling, then its
  relationship among requirements, tests, implementation, and evidence remains
  understandable in semantic text.
- AC-SGAD-008: Given a visitor wants more detail, then descriptive links open the
  canonical SGAD guide and reusable templates without placeholder destinations.
- AC-SGAD-009: Given a visitor wants product context, then a secondary internal
  route returns to the Sleepy Hollow framework page without implying that the
  methodology depends on it.
- AC-SGAD-010: Given a nontechnical reader encounters TDD, deterministic
  verification, traceability, or content digests, then each essential term is
  explained near its first use or omitted when it is not necessary.
- AC-SGAD-011: Given the methodology claims are reviewed against `docs/sgad/`,
  then the page does not present SGAD as an established standard, a guarantee,
  or a substitute for human judgment and domain-specific review.

## Approval boundary

Approval authorizes only the SGAD page behavior and acceptance criteria
AC-SGAD-001 through AC-SGAD-011. Site-wide delivery behavior and the Sleepy
Hollow product narrative require their own approved requirements.
