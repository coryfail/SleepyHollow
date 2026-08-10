---
schema: sgad-component/v0.2
id: framework-documentation
title: Framework documentation set
status: verified
risk: standard
depends_on:
  - sleepy-hollow-application
  - SH-F009
  - website-docs-section
owners:
  - Sleepy Hollow maintainers
---

# Framework documentation requirements

## Purpose

Own the prose under `docs/framework/`, so that a developer who reads it can
reach a verified endpoint without holding information the guides never gave
them.

The guide set is the only public explanation of how to satisfy `hollow check`.
`website-docs-section` governs how these files are published; nothing has
governed what they must say. That gap is why the set currently documents a
verifier whose preconditions it never teaches a reader to meet.

## Audience and primary action

- Primary audiences: a developer evaluating the framework, a developer building
  on it, and a developer deciding whether to work through an agent.
- Primary action: carry out the next step of the framework's own loop —
  install, create, author intent, implement, verify, deploy.
- Secondary action: judge, before installing anything, what the framework
  requires of them.

## Authorized scope

- Document how to obtain and activate the official Sleepy Hollow skill, as the
  approved onboarding flow in `requirements/application.md` §3.1 step 3 already
  requires of the product.
- Document the governed requirement format in `docs/framework/` well enough to
  author and approve one requirement by hand.
- State which parts of the loop the framework enforces and which a reader or
  agent supplies.
- Keep every install command in the guide set resolvable against a real
  published artifact.

## Out of scope

- Changing `cli/create` scaffold output, the CLI, the runtime, or the verifier.
- Changing what `hollow check` accepts, or the canonical digest algorithm in
  the root `requirements.md`, which remains that requirement's to define.
- Removing or thinning `skills/sleepy-hollow/references/`. The skill is
  installed standalone and must remain self-contained when the repository is
  absent.
- Adding website routes, navigation, or visual behavior, all of which belong to
  `sleepy-hollow-website` and `website-docs-section`.
- Documenting unresolved open decisions as though they were settled.

## Source of truth and duplication boundary

Two audiences need the requirement format: a human reading the site, and an
agent that has installed the skill without the repository. Neither can be
served by a pointer to the other's copy.

So the format is stated in both `docs/framework/` and
`skills/sleepy-hollow/references/requirement-format.md`, and the governed
constraint is agreement rather than single-sourcing: the two must not
contradict each other on frontmatter fields, file placement, or the governance
boundary. The canonical digest algorithm has exactly one definition, in the
root `requirements.md`; both documents cite it and neither restates it as a
competing procedure.

## Content boundaries

- The guides must not present the skill as required to use the framework. The
  framework verifies independently, and the manual path must remain documented
  and usable.
- The guides must not present the manual path as equivalent in effort when it
  is not.
- The guides must not name a command, package, skill, or flag that does not
  resolve.
- The guides must not restate the digest algorithm in terms that could diverge
  from the canonical definition.

## Acceptance criteria

- AC-FWDOC-001: Given a reader has installed the CLI and wants the agent path,
  then `docs/framework/` provides the visible, copy-pasteable command
  `npx skills add coryfail/SleepyHollow --skill sleepy-hollow` and states what
  the skill does.
- AC-FWDOC-002: Given a reader does not want to use an agent, then the guide set
  states that the framework verifies independently of the skill, and the manual
  path is documented end to end.
- AC-FWDOC-003: Given a reader must satisfy `hollow check` without the skill,
  then `docs/framework/` documents the governed requirement format: frontmatter
  fields, file placement, required sections, acceptance-criterion identity, and
  the reserved `## Governance record` boundary.
- AC-FWDOC-004: Given the requirement format is documented in both
  `docs/framework/` and `skills/sleepy-hollow/references/requirement-format.md`,
  then the two agree on frontmatter fields, placement, and the governance
  boundary, and neither states a digest procedure that differs from the
  canonical algorithm in the root `requirements.md`.
- AC-FWDOC-005: Given a guide names an installable artifact, then that artifact
  resolves: the skill name matches a directory under `skills/`, and the
  framework and CLI install commands match the package name in `deno.json`.
- AC-FWDOC-006: Given the skill install command appears in more than one
  surface, then `README.md`, `docs/framework/`, and `website/src/site.ts` state
  it identically, character for character.
- AC-FWDOC-007: Given a Markdown file is added to `docs/framework/`, then it
  carries a reading-order position and a one-line summary in
  `website/scripts/generate-docs.mjs`, so the published set stays complete.
- AC-FWDOC-008: Given a reader follows `getting-started.md` in order, then every
  identifier that a later step requires — requirement ID, acceptance-criterion
  ID, and their approval — has been introduced by an earlier step or an explicit
  link to the guide that introduces it.

## Dependencies and assumptions

- `sleepy-hollow-application` §3.1 fixes the onboarding flow this set documents.
- `SH-F009` owns the skill itself and its bundled references.
- `website-docs-section` owns publication, including `READING_ORDER` and the
  per-guide summaries that AC-FWDOC-007 constrains.
- The `skills` installer resolves a public repository and a named skill
  directory. Verified against `coryfail/SleepyHollow` on 2026-08-10, which
  listed both `sgad-workflow` and `sleepy-hollow`.
- `website/scripts/generate-docs.mjs` discovers guides from disk, so every
  Markdown file under `docs/framework/` is published, including this governance
  file. That follows the established `docs/sgad/requirements.md` precedent,
  which is published with its own summary and navigation title.
- The filename `requirements.md` is reserved for governance under the placement
  rule in the root `requirements.md`, so a guide about authoring requirements
  carries a different filename and route.

## Change impact

Changing this requirement affects the published documentation section, the
repository-consistency suite, and the skill's bundled requirement-format
reference, which must be re-checked for agreement under AC-FWDOC-004.

## Approval scope

Approval covers AC-FWDOC-001 through AC-FWDOC-008 and authorizes prose changes
under `docs/framework/`, the matching install-command constant and summary entry
in `website/`, and the skill-install line in `README.md`. It does not authorize
any change to the CLI, the runtime, the verifier, or the generated scaffold.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted. Append history; do not rewrite old
entries to make stale evidence appear current.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-10T13:49:51Z.
- Approved criteria: AC-FWDOC-001 through AC-FWDOC-008.
- Governed-content digest:
  `sha256:2b08dda5d2b2172f2fdd1884a7e93a02cc6f9e547e9bad101e87f953c08d8c67`.
- Decision source: owner review; direct response `Approve` after being shown the
  eight criteria, the exact governed-content digest, the deliberate
  duplication boundary between the guide and the installed skill's bundled
  reference, and the consequence that this governance file publishes as a page.
- Decision: govern the framework guide prose as its own component, and document
  both the skill install path and the manual requirement-authoring path that
  `hollow check` already requires.

### Criterion mapping

| Criterion | Governed tests or checks |
|---|---|
| AC-FWDOC-001 | install-command presence and skill-description checks in `website/tests/framework-docs.test.mjs` |
| AC-FWDOC-002 | independent-verification and manual-path checks in `website/tests/framework-docs.test.mjs` |
| AC-FWDOC-003 | requirement-format coverage checks over `docs/framework/writing-requirements.md` |
| AC-FWDOC-004 | guide-and-skill agreement checks, including the single digest definition |
| AC-FWDOC-005 | artifact-resolution checks against `skills/` and `deno.json` |
| AC-FWDOC-006 | character-for-character install-command agreement across `README.md`, `docs/framework/`, and `website/src/site.ts` |
| AC-FWDOC-007 | reading-order and summary completeness checks against `website/scripts/generate-docs.mjs` |
| AC-FWDOC-008 | forward-reference checks over `docs/framework/getting-started.md` |

### Red-state evidence

- Status: failed-as-expected at 2026-08-10T13:58:00Z under
  `node --test tests/framework-docs.test.mjs` from `website/`, at baseline
  revision `2909573b9392dd3e74c29618799d589e17a119ba`, with 7 of 8 checks
  failing.
- The seven failures are absent behavior, not defects: no framework guide
  contains the install command, `docs/framework/writing-requirements.md` does
  not exist, `README.md` and `website/src/site.ts` carry no
  `--skill sleepy-hollow` command, `docs/framework/requirements.md` has no
  reading-order position or summary, and `getting-started.md` reaches
  `requirementId:` without having introduced how an approved requirement is
  produced.
- AC-FWDOC-005 passed at baseline. It is a resolution invariant rather than new
  behavior: the guides already name only `jsr:@sleepy-hollow/framework`, which
  matches `deno.json`, and they name no skill at all yet. It is recorded as an
  already-satisfied regression guard, and it is not evidence that any part of
  this requirement was implemented.
- An earlier draft of the suite reported AC-FWDOC-002 as passing at baseline.
  The check was reading `docs/framework/requirements.md`, so this requirement's
  own prose satisfied the criterion governing the guides. The helper now
  excludes the governance file from reader-facing content checks, and the
  criterion fails at baseline as it should. The vacuous pass is recorded here
  because a green check that reads its own specification is the failure mode
  this evidence exists to detect.
- Material characterization: expected missing behavior. The runner was healthy;
  the surviving invariant and the other website suites continued to pass in the
  same tree.

### Verification

- Status: passed at 2026-08-10T14:04:00Z.
- Base revision: `2909573b9392dd3e74c29618799d589e17a119ba`.
- Implementation manifest: `git ls-files -s` over the staged tree,
  `sha256:a6aa9f678289c3849b22a20ffd3cea68b7a5c726ee3066800745861467f02c8d`.
- Verifier and command: `website/package.json#verify` version `0.1.2`, plus
  `deno task check:governance` and `deno task verify:skill`.
- Results: all 8 AC-FWDOC checks pass; the website gate passes at 31, 1, 9, 8,
  and 13 checks across the structural, link, repository, framework-docs, and
  React suites, with 135 browser checks passing across Chromium, Firefox, and
  WebKit; governed digests bind for 30 requirements; the 12 SH-F009 skill
  checks pass unchanged.
- The published guide was confirmed rendering at `/docs/writing-requirements/`
  and `/docs/getting-started/`, in reading order and carrying the install
  command.
- Residual risk: AC-FWDOC-002 and AC-FWDOC-004 are keyword and containment
  checks over prose. They can confirm that the guides make the required
  statements and do not contradict the skill's bundled reference; they cannot
  confirm the prose is clear or that a reader succeeds by following it. The
  install command is verified to resolve as of 2026-08-10, but nothing in this
  suite re-checks the remote installer, so an upstream change to the `skills`
  CLI would not surface here.

### Delivery

- Status: pending. Not committed, merged, tagged, or published at the time this
  record was written.
