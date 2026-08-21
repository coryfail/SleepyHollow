---
schema: sgad-component/v0.2
id: sleepy-hollow-repository
title: Repository-wide consistency and polish
status: draft
risk: standard
depends_on:
  - sgad-methodology
  - SH-F017
  - sleepy-hollow-website
owners:
  - Sleepy Hollow maintainers
---

# Repository-wide consistency and polish

## Purpose

Make the current Sleepy Hollow repository internally coherent. Correct
conflicting governance rules, ambiguous identifiers, stale structure,
inaccurate project claims, verification gaps, and small website-maintainability
defects without implementing the planned framework or redesigning the public
site.

The completed current tree must read as one intentional implementation of the
canonical embedded SGAD model.

## Authorized scope

- Correct the canonical SGAD documentation, templates, packaged skill, and
  Sleepy Hollow requirements so they express one embedded-governance model.
- Define one non-circular digest algorithm that binds behavioral intent while
  treating lifecycle `status` as a derived, human-readable projection.
- Normalize active requirement metadata and ensure every requirement,
  dependency, open decision, and acceptance criterion has an unambiguous
  repository-wide identity.
- Correct the placement and completeness of embedded governance records.
- Limit the current requirement inventory, documentation, tests, and governance
  prose to canonical active requirements and their embedded records.
- Make `requirements/application.req.md` the application-wide requirement.
  Keep repository-wide governance in a meaningful root-level `*.req.md` file
  and keep named component requirements beside their behavior.
- Update the canonical SGAD documentation, packaged skill, adoption guidance,
  templates, and public explanation with the requirement-ownership rule for
  application-wide, component-owned, and repository-wide behavior.
- Align current README, contribution, application, model, SGAD, skill, website,
  and CI language with the repository's actual development state.
- Refactor small website constants and verification configuration where
  duplication or incomplete coverage can cause drift.
- Add deterministic repository-consistency checks and map them to this
  requirement.
- Remove empty directories that have no canonical owner or artifact.

## Out of scope

- Implementing any planned Sleepy Hollow CLI, runtime, model, generated artifact,
  official application skill, deployment command, or unresolved open decision.
- Changing the meaning of SH-F001 through SH-F016 product acceptance criteria,
  dependency IDs, or open-decision IDs.
- Adding public website routes, product claims, analytics, data collection,
  server behavior, a new visual concept, or new product functionality.
- Updating dependency versions or adding a formatter, linter, framework, service,
  font package, or other production dependency.
- Treating this cleanup approval as exact-content approval of the complete
  Sleepy Hollow product specification, its draft components, or the draft SGAD
  methodology.
- Fabricating missing historical authority, red-state evidence, verification, or
  delivery results.
- Rewriting Git history.
- Committing, staging, pushing, merging, publishing, deploying, changing branch
  protection, or mutating any external environment.

## Canonical governed-content digest

For a governed Markdown requirement, calculate its SHA-256 digest as follows:

1. Find the first line whose complete content is `## Governance record`.
2. Select the exact UTF-8 bytes before that heading, preserving all other bytes
   and line endings.
3. If the selected content begins with YAML frontmatter, omit the single
   top-level `status:` line from that frontmatter, including its line ending.
4. Hash the remaining selected bytes without any other normalization.

The `status` field remains required workflow-routing metadata, but the verifier
derives whether its value is honest from the embedded approval and verification
entries. Changing only that projection cannot invalidate the authority it
describes; changing any other governed byte does. A missing, malformed, or
misleading status value fails structural verification rather than changing the
approval digest.

The exact `## Governance record` heading is reserved for the append-only record
at the end of the file. Descriptive sections use another heading so a verifier
cannot select the wrong boundary. No level-two heading may follow the governance
record.

## Consistency rules

### Requirements and governance

- Each governed `*.req.md` file is the sole current-tree home for its complete
  approval, criterion-mapping, red-state, verification, and applicable delivery
  history.
- Requirement placement follows behavioral ownership:
  - `requirements/application.req.md` owns product-wide intent, shared architecture,
    cross-cutting behavior, and system-level acceptance criteria.
  - A meaningful `<component>/<feature>.req.md` owns behavior that can be assigned to one
    subsystem, including a website, CLI, runtime module, skill, or documentation
    set.
  - A meaningful root-level `*.req.md` file is used only for durable governed behavior that spans
    the repository and cannot be assigned honestly to the application or one
    component.
- The top-level `requirements/` directory contains `application.req.md`. It is
  not a miscellaneous document collection, and a root-level requirement is not
  a substitute for identifying a real component owner.
- Active application and component requirements use explicit schema, ID, title,
  lifecycle status, risk, dependency, and owner metadata appropriate to their
  type.
- `sleepy-hollow-application` identifies the application specification so
  existing website dependencies resolve to a real requirement.
- Requirement IDs and acceptance-criterion IDs are globally unique, excluding
  documented placeholders in canonical and packaged templates.
- The website SGAD-page criteria use the `AC-WEB-SGAD-*` namespace so they do not
  collide with the canonical methodology's `AC-SGAD-*` criteria. This is an
  identifier-only migration; criterion meaning remains unchanged.
- Every governed requirement has exactly one complete `Governance record` after
  all behavioral content. Pending or unavailable records remain explicitly
  honest.
- The active requirement inventory contains only current requirements and their
  current governance histories.
- Shared model documents remain supporting contracts rather than independently
  implementable component requirements. Their lifecycle language matches the
  embedded-governance rules without inventing approvals.

### Documentation and naming

- Human-readable prose uses `Sleepy Hollow`; repository identifiers, package
  names, URLs, and the GitHub repository path may retain `SleepyHollow` where the
  technical identifier requires it.
- Current documentation describes the framework and SGAD methodology as in
  development or draft. It does not call unimplemented framework behavior
  production-ready or call a draft methodology requirement approved.
- Documentation, requirements, skill guidance, website copy, test descriptions,
  filenames, and current governance records present the canonical embedded
  model as the repository's sole design.
- Canonical documentation and the packaged skill teach the same ownership-based
  placement rule. The minimal public tree may omit a root-level `*.req.md` file when
  no separately governed repository-wide behavior exists.
- Documentation and skill guidance describe only the two canonical requirement
  templates. They do not promise a standalone verification-report template.
- Canonical and packaged templates remain byte-for-byte equal, and the packaged
  skill metadata remains valid under the skill-creator validator.
- All repository-local Markdown links resolve.

### Website and continuous integration

- Canonical repository, SGAD-guide, template, and install-command values have one
  TypeScript source of truth for the React implementation.
- Both static HTML entry documents retain accurate route-specific metadata,
  no-JavaScript content, canonical destinations, and honest development status.
- The website performs no automatic third-party font request. Its token system
  uses local system-font stacks while preserving the approved nocturnal,
  typography-led visual direction. Small cross-platform glyph and line-wrap
  differences are an accepted consequence of removing the undeclared remote
  dependency.
- The website verifier covers Chromium, Firefox, and WebKit projects, while
  reporting that WebKit automation is representative coverage rather than proof
  of every Safari release.
- The Pages workflow runs the complete canonical verifier for every repository
  path that can affect its result, deploys only verified `main` pushes, and does
  not duplicate build work unnecessarily.
- The website remains accessible, responsive, read-only, storage-free, and
  behaviorally equivalent on `/` and `/sgad/`.

## Acceptance criteria

- AC-REPO-001: Given the canonical methodology, skill, templates, and repository
  requirements are inspected, then each defines the same status-excluding
  governed-content digest algorithm and reserves one end-of-file
  `## Governance record` boundary.
- AC-REPO-002: Given all active governed requirements are parsed, then each has
  valid required metadata, exactly one complete end-of-file governance record,
  an honest lifecycle projection, and no behavioral section omitted from its
  digest boundary.
- AC-REPO-003: Given repository identities are analyzed globally, then active
  requirement IDs and acceptance-criterion IDs are unique, all dependency and
  open-decision references resolve, and website SGAD criteria use
  `AC-WEB-SGAD-*` without changing their meaning.
- AC-REPO-004: Given the requirement inventory and filesystem are inspected,
  then `requirements/application.req.md` owns application intent, the repository
  requirement is a meaningful root-level `*.req.md` file, every component
  requirement is named and colocated, and no empty unowned feature tree remains.
- AC-REPO-005: Given current project prose is searched and reviewed, then public
  naming and development-state claims follow the documented convention,
  application and model governance language is current, and no active guidance
  promises the removed verification-report artifact.
- AC-REPO-006: Given canonical SGAD docs, adoption guidance, templates, public
  explanation, and the packaged skill are compared, then they apply the same
  ownership-based placement rule, their governance rules are semantically
  consistent, both template pairs match byte-for-byte, internal Markdown links
  resolve, and skill validation passes.
- AC-REPO-007: Given the website source is inspected, then shared canonical values
  have one TypeScript source, static metadata and no-JavaScript fallbacks remain
  route-correct, and no automatic third-party font request remains.
- AC-REPO-008: Given the canonical website verifier runs, then structural,
  repository-consistency, link, governance, React, type, build, and browser
  checks pass across Chromium, Firefox, and WebKit without changing the two
  approved routes or adding stateful behavior.
- AC-REPO-009: Given the Pages workflow is evaluated for each change class that
  can affect verification, then its path filters include the website, SGAD docs,
  SGAD skill, product requirements, shared models, CLI and core requirement
  trees, and the workflow itself; pull requests never deploy and `main` pushes
  deploy only after the complete verifier passes.
- AC-REPO-010: Given SH-F001 through SH-F016 are compared before and after the
  cleanup, then their product criterion text, dependency IDs, open-decision IDs,
  intended behavior, and draft implementation authority remain unchanged.
- AC-REPO-011: Given the new consistency checks run against the pre-cleanup
  working tree, then they fail for the identified digest, governance-placement,
  identity, stale-structure, documentation, font, and CI defects while the
  previously verified baseline remains otherwise healthy.
- AC-REPO-012: Given final independent verification runs against the declared
  working-tree manifest, then all mapped checks pass, `git diff --check` passes,
  the repository and installed SGAD skill packages match, and residual risks are
  recorded without staging, committing, pushing, publishing, or deploying.

## Dependencies and assumptions

- Existing approved working-tree changes are preserved and corrected in place;
  unrelated user changes are not reverted.
- Existing website behavior and visual direction are healthy; this work improves
  internal consistency and verification coverage rather than redesigning them.
- The current package lock is internally consistent. Dependency freshness and
  upgrades require a separate governed change.
- The human project owner is the approving authority for this bounded cleanup.

## Change impact

The change touches documentation, requirements, skill instructions and metadata,
website source and tests, and the Pages workflow. It may invalidate current
governance-only digests and website verification entries, which must receive new
content-bound records. It does not authorize any planned framework implementation
or external delivery.

## Approval scope

Submit AC-REPO-001 through AC-REPO-012 together for standard-risk exact-content
approval. Approval authorizes only the repository consistency corrections,
mapped checks, red or characterization evidence, implementation, and independent
verification described above.

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

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-06T22:48:06Z.
- Approved criteria: AC-REPO-001 through AC-REPO-012.
- Governed-content digest:
  `sha256:f15e870dba8d7716eaae6ad7af98a1315572b96af28d0918d8194c8d5331dd0b`.
- Recording correction: at 2026-08-06T23:09:32Z, the initial digest entry was
  found inconsistent with the approved canonical algorithm and corrected before
  verification. The governed content and approval decision were unchanged.
- Decision source: owner review; direct response `Approve` after the owner
  required the ownership-based placement rule to be reflected in the canonical
  docs and packaged skill.

### Criterion mapping

- AC-REPO-001 and AC-REPO-002 ->
  `website/tests/repository-consistency.test.mjs` governance-boundary checks.
- AC-REPO-003 -> repository identity, dependency, decision, and criterion checks.
- AC-REPO-004 -> canonical requirement-placement and ownership-guidance checks.
- AC-REPO-005 -> naming, development-state, and current-artifact checks.
- AC-REPO-006 -> template parity, Markdown links, skill metadata, and
  skill-creator validation.
- AC-REPO-007 -> website canonical-value and local-asset checks.
- AC-REPO-008 and AC-REPO-009 -> repository consistency checks, complete
  `npm run verify`, and Pages workflow assertions.
- AC-REPO-010 -> exact SH-F001 through SH-F016 behavioral-preservation checks.
- AC-REPO-011 -> the governed pre-cleanup execution recorded below.
- AC-REPO-012 -> final `npm run verify`, skill validation, installed-package
  comparison, working-tree manifest, and `git diff --check`.

### Red-state evidence

- Status: failed-as-expected.
- Observed at: 2026-08-06T22:49:52Z.
- Base revision: `aa61dff5857c4b58ecd7762df23410fe00c2ba1e` with the
  approved embedded-governance working-tree changes present.
- Command: `node --test tests/repository-consistency.test.mjs` from `website/`.
- Runner: Node.js `v26.0.0` on macOS arm64.
- Test digest:
  `sha256:a180b7cfdb8c2e0b407cf64267971535bed8ae108fd330608fc81bbaffc34d43`.
- Result: 3 passed and 6 failed.
- Expected failures: incomplete requirement metadata and governance boundaries,
  unresolved or duplicated identities, noncanonical requirement placement,
  inconsistent naming and status claims, automatic third-party fonts and
  duplicated canonical values, and incomplete browser and CI verification.
- Healthy controls: product-behavior preservation, canonical/package template
  parity and local Markdown links, and ignored-output guards passed.

### Verification

- Status: passed.
- Verified at: 2026-08-06T23:11:26Z.
- Base revision: `aa61dff5857c4b58ecd7762df23410fe00c2ba1e` plus the
  declared working tree.
- Implementation manifest:
  `working-tree:sha256:76c8cb524a11d350ec3ec7eebc0b4071689d5f0e13efb8b6dac22a387b2dbaa7`
  across 78 tracked or unignored files that exist in the current tree. The
  manifest hashes sorted `<relative-path>\0<file-sha256>\n` records, excludes
  deleted and ignored paths, and uses the canonical status-excluding governed
  bytes for this file so the append-only record is non-circular.
- Consistency-test digest:
  `sha256:c077f1cbdb919557bd7986397fbdf137c6fd3f3d580341e8e156723597321cda`.
- Canonical verifier: `npm run verify` from `website/`.
- Results: structural 16/16, link 1/1, repository consistency 9/9, React
  8/8, TypeScript and production build, and Playwright/Axe 66/66 across
  Chromium, Firefox, and WebKit passed.
- Independent package checks: the skill-creator validator passed for the
  repository and installed SGAD skill packages; `diff -qr` confirmed they are
  byte-for-byte equal; `git diff --check` passed.
- Current-tree audit: `requirements/application.md` is the only item inside
  `requirements/`, component requirements remain colocated, and searches found
  no noncanonical artifact paths or placement guidance.
- Residual risks: Playwright WebKit is representative coverage rather than proof
  of every Safari release; system-font metrics may vary slightly by platform;
  Git history was not rewritten; and no commit, push, publication, deployment,
  or other external delivery was performed.
- CI portability correction verified at 2026-08-07T01:47:59Z. GitHub Actions
  run `31137472441` failed before browser execution because the Ubuntu runner
  could not spawn the undeclared `rg` executable. The repository inventory now
  uses `git ls-files --cached --others --exclude-standard -z`, which is provided
  by the checked-out Git environment and preserves tracked plus unignored file
  coverage without filtering generated paths before AC-REPO-012 inspects them.
- Corrected consistency-test digest:
  `sha256:f2018f92c1cfe044883df865713a4080478eb16dbce2d056013e92e2d11aae83`.
- Reverification: repository consistency 9/9 and the complete canonical verifier
  passed with the same structural, link, React, type, build, and 66/66
  cross-browser results recorded above.
- Framework-activation revalidation passed at 2026-08-07T13:19:04Z after the
  human owner approved SH-F001 and SH-F002. The AC-REPO-010 control now preserves
  untouched draft components while accepting an activated component only when
  its embedded approval binds the current governed-content digest; this keeps
  the cleanup's no-silent-authority intent without permanently preventing later
  product work. The updated consistency-test digest is
  `sha256:c92de302c31aba542bf9f216f7fbd1163bb06caea8c1ec5d92155c677a813a28`.
  Repository consistency passed 9/9 and the complete canonical verifier again
  passed structural 16/16, links 1/1, React 8/8, TypeScript, production build,
  and Playwright/Axe 66/66 across Chromium, Firefox, and WebKit.
- Framework-kernel revalidation completed by 2026-08-07T14:03:02Z after exact
  reapproval of SH-F002 at
  `sha256:c6ad75a20d7cac55e53ac59334e15072674147fbc340e0da9658470b5abfb0a6`
  and SH-F003 at
  `sha256:19ec47355a971203e0b6e85c256eb9df52fb8a17feaf37a13f94975ebef90652`.
  The current 28-file framework manifest is
  `working-tree:sha256:941fd4b35f0c4b78b46e2e447381e6572c5547f60a11cab4db784666faf0443f`.
  `deno task verify:framework` passed routing 9/9 and validation 10/10 with two
  nested steps each plus formatting, linting, and type checks. The canonical
  repository verifier passed structural 16/16, links 1/1, repository consistency
  9/9, React 8/8, TypeScript/build, and Playwright/Axe 66/66 across Chromium,
  Firefox, and WebKit. No commit, push, or delivery was performed.
- Deno KV kernel activation passed at 2026-08-07T14:19:24Z after the human owner
  approved SH-F004 at
  `sha256:907a8e8cd07974545db0f5a4f01ac91b56d42ea28c1dc4899de511f56cab5a96`.
  The current 37-file framework manifest is
  `working-tree:sha256:f7e1e76626c370eefd6b6dd602e4140e6d7bbde16d130e464097a4e9dcedc30f`.
  `deno task verify:framework` passed routing 9/9, validation 10/10, and KV 9/9
  plus formatting, linting, and type checks. The canonical repository verifier
  again passed structural 16/16, links 1/1, repository consistency 9/9, React
  8/8, TypeScript/build, and Playwright/Axe 66/66 across Chromium, Firefox, and
  WebKit. No commit, push, or delivery was performed.
- Security-kernel activation passed at 2026-08-07T14:56:52Z after the human
  owner approved SH-F005 at
  `sha256:4eb04f57e6fdc65d3ed42b96f790286b069644daf1fdb4038bca9c5ea22fd017`.
  The current 45-file framework manifest is
  `working-tree:sha256:0831c0a1254252c07acc336837f0e8179e6ff7017d7d1b11d12c00f9977f1d53`.
  `deno task verify:framework` passed routing 9/9, validation 10/10, KV 9/9,
  and security 11/11 with twelve total nested steps plus formatting, linting,
  and type checks. The canonical repository verifier again passed structural
  16/16, links 1/1, repository consistency 9/9, React 8/8, TypeScript/build,
  and Playwright/Axe 66/66 across Chromium, Firefox, and WebKit. No commit,
  push, or delivery was performed.
- Configuration and observability activation passed at
  2026-08-07T15:11:17Z after the human owner approved SH-F012 at
  `sha256:0a2408dd0c34e4b35bc5feb00d2ea8cf53a8fdcf269d9912ced09eb9cd471e28`.
  The current 52-file framework manifest is
  `working-tree:sha256:1c06425c13ac1a3e320487f8244afab496f1b427b3804bd3728db763fd84a53d`.
  `deno task verify:framework` passed routing 9/9, validation 10/10, KV 9/9,
  security 11/11, and configuration 9/9 with thirteen total nested steps plus
  formatting, linting, and type checks. The canonical repository verifier again
  passed structural 16/16, links 1/1, repository consistency 9/9, React 8/8,
  TypeScript/build, and Playwright/Axe 66/66 across Chromium, Firefox, and
  WebKit. No commit, push, or delivery was performed.
- Project-creation activation passed at 2026-08-07T15:17:48Z for the previously
  approved SH-F001 digest
  `sha256:5d0236364f999f012df2182a85f1d5c3c1c55b6cccbe4e19f21bc8a675e67068`.
  The current 57-file product manifest is
  `working-tree:sha256:de690a4fe42299b5a1ea5d1c6c52a539b5909340d0b3e90a20ee3c07597d6c20`.
  Project creation passed 9/9, its generated scaffold passed its own verifier,
  and a compiled standalone binary reported `hollow 0.1.0`; the framework and
  canonical repository gates also passed with the results recorded above. No
  commit, push, publication, deployment, or other delivery was performed.

- Test correction, endpoint requirement kinds, 2026-08-09T11:41:00Z: the
  AC-REPO-001/AC-REPO-002 sweep asserted the component frontmatter contract on
  every discovered `requirements.md`, including the `sgad-endpoint` documents in
  `examples/todos`, which declare `id`, `path`, `status`, `methods`, and
  `service` and carry an approval-only governance record. The sweep therefore
  failed on well-formed endpoint documents, leaving the canonical gate red for a
  defect in the check rather than in the repository. The sweep now classifies by
  kind and asserts the contract each kind actually has, and additionally
  requires a non-empty `methods` list and, for a non-draft endpoint, that the
  recorded approval digest binds the current governed content. No criterion text
  changed: AC-REPO-002 already required valid required metadata, which is
  kind-specific by definition. The endpoint branch is proven live by an
  assertion that at least one endpoint requirement is covered, and was
  negative-tested by mutating governed bytes, removing `methods`, and renaming
  the `Approval` heading, each of which fails the check.

### Delivery

- Verification scope initially excluded delivery.
- Status: delivered.
- Authorized at: 2026-08-06T23:18:39Z.
- Authority: human-project-owner; direct instruction to push the verified change
  to `development` and `main`, then clean up the feature branch.
- Intended delivery: commit the declared working tree, fast-forward and push
  `development` and `main`, confirm their remote tips, and remove the temporary
  feature branch.
- Delivered at: 2026-08-06T23:20:21Z.
- Implementation commit:
  `bcf4ccf430bbf6c9b86838ffab22ab79ce4f1e57` (`refactor: simplify SGAD
  governance`).
- Result: `origin/development` and `origin/main` were independently confirmed at
  the implementation commit after non-forced pushes. No remote feature branch
  existed, and the merged local `feature/simplify-sgad-artifacts` branch was
  deleted.
