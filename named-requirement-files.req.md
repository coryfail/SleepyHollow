---
schema: sgad-component/v0.2
id: named-requirement-files
title: Named requirement files
status: verified
risk: standard
depends_on:
  - sleepy-hollow-application
  - sgad-methodology
  - SH-F006
  - SH-F009
  - SH-F018
owners:
  - Sleepy Hollow maintainers
---

# Named requirement files

## Purpose

Replace the one-generic-requirement-per-directory convention with named
requirement artifacts. A directory may own several independently governed
features without requiring artificial subdirectories or an ambiguous
`requirements.md` file.

This is the defining compatibility change for Sleepy Hollow 0.2.0.

## Authorized scope

- Define `*.req.md` as the canonical governed-requirement filename pattern in
  SGAD and Sleepy Hollow.
- Update the standalone SGAD methodology, templates, skill, examples, and public
  website to teach the named-file convention.
- Update the Sleepy Hollow framework and official skill to create, discover,
  protect, parse, verify, and report named requirement files.
- Rename every current governed requirement artifact to a meaningful
  `<feature>.req.md` name and update current references to those paths.
- Update repository governance checks, hooks, format exclusions, CI path rules,
  examples, tests, and documentation for the new pattern.
- Remove active contribution guidance for the retired `development` branch and
  document `main` as the integration and release branch.
- Set the framework, CLI, generated-project dependency, website package, and
  current generator identity to version `0.2.0`.

## Out of scope

- Changing governed product behavior unrelated to requirement discovery,
  naming, protection, migration, or version reporting.
- Reorganizing implementation files solely to make their basenames match a
  requirement filename.
- Requiring one requirement file per directory or requiring a requirement
  basename to equal its parent directory name.
- Preserving `requirements.md` as a valid 0.2.0 requirement artifact.
- Publishing, tagging, deploying, merging, or otherwise delivering 0.2.0.
- Fabricating approval, red-state, verification, or delivery evidence for
  renamed historical artifacts.

## Canonical filename convention

A governed requirement is a Markdown file whose name ends in `.req.md` and has
a non-empty basename before that suffix. The basename identifies the governed
feature within its directory. It should be concise and meaningful to humans.

Examples:

```text
account/
├── profile.req.md
├── profile.test.ts
├── profile.ts
├── password-reset.req.md
├── password-reset.test.ts
└── password-reset.ts
```

Files do not need to share a basename with implementation or test files, and the
framework does not infer governance relationships from basename equality.
Stable requirement and criterion IDs inside each artifact remain the
authoritative traceability mechanism.

Application-wide intent lives at `requirements/application.req.md`. A
repository-wide or component requirement uses a meaningful named file such as
`repository.req.md`, `routing.req.md`, or `sgad.req.md` beside the behavior it
owns. A directory may contain any number of named requirement files whose
requirement IDs are globally unique.

## Discovery and migration behavior

Sleepy Hollow recursively discovers every regular, non-symlink `*.req.md` file
inside each declared API root. Discovery remains deterministic and accepts
multiple named requirement files in the same directory.

The exact legacy filename `requirements.md` is not a governed requirement in
0.2.0. When it occurs inside a declared requirement-discovery boundary or is
configured as the application requirement, verification must fail with an
actionable migration diagnostic that identifies the legacy path and directs the
developer to rename it to a meaningful `*.req.md` path. It must never be
silently skipped or treated as current evidence.

New project scaffolds use `requirements/application.req.md`, exclude
`**/*.req.md` from formatting, and configure the application requirement at its
new path. Endpoint decomposition creates `<requirement-id>.req.md` inside the
endpoint directory; the requirement ID is already constrained to a portable
filename-safe character set.

## Compatibility and governance

The filename migration changes artifact locations, not the governed-content
digest algorithm. A pure rename preserves a content-bound approval because the
path is not part of the governed-content digest. If current governed prose is
edited to describe the new convention or new paths, its approval and downstream
evidence become stale and must be invalidated or replaced honestly while the
historical governance record remains intact.

References, diagnostics, permission guards, format exclusions, generated
configuration, test manifests, public examples, and verifier inventories must
all use `*.req.md`. No active instruction may teach generic `requirements.md` as
the current convention after the migration.

## Acceptance criteria

- AC-NRF-001: Given canonical SGAD and Sleepy Hollow guidance is inspected, then
  it defines a governed requirement as a meaningful named `*.req.md` file,
  permits multiple requirement files in one directory, and does not require the
  basename to match the directory, test, or implementation basename.
- AC-NRF-002: Given application, component, endpoint, and repository-wide
  examples are inspected, then application intent uses
  `requirements/application.req.md` and every other current governed artifact
  uses a meaningful `<feature>.req.md` path beside the behavior it owns.
- AC-NRF-003: Given two valid `*.req.md` files exist in one declared API
  directory, then evidence discovery loads both in deterministic order and
  preserves their distinct requirement and criterion identities.
- AC-NRF-004: Given nested named requirements, symlinks, files outside declared
  roots, malformed requirements, or duplicate IDs, then discovery retains its
  existing bounded, fail-closed behavior while recognizing only regular
  `*.req.md` artifacts.
- AC-NRF-005: Given a legacy `requirements.md` occurs in a declared discovery
  boundary or is configured as the application requirement, then verification
  fails with the legacy path and an actionable rename-to-`*.req.md` diagnostic
  instead of ignoring or accepting it.
- AC-NRF-006: Given endpoint decomposition receives an approved application and
  multiple proposals, then it emits one `<requirement-id>.req.md` artifact per
  proposal, detects path collisions, and creates no test or implementation
  artifact before endpoint approval.
- AC-NRF-007: Given a new project is created with Sleepy Hollow 0.2.0, then its
  application requirement, configuration, verification script, README, format
  exclusions, returned file inventory, and next actions consistently use
  `requirements/application.req.md` and `*.req.md`.
- AC-NRF-008: Given test write permissions are planned, then every `*.req.md`
  path is protected as governed output without relying on the removed generic
  filename.
- AC-NRF-009: Given all current repository artifacts and references are
  inspected, then no governed file is named `requirements.md`, no active prose
  teaches that filename, all current links and configuration paths resolve, and
  historical evidence remains explicitly historical rather than rewritten.
- AC-NRF-010: Given canonical and packaged SGAD templates and skills are
  compared, then both packages teach the same named-file convention, template
  pairs remain byte-for-byte equal, and skill validation passes.
- AC-NRF-011: Given the website is tested structurally and in supported browsers,
  then its SGAD explanation and file map show multiple named requirement files
  in one directory without regressing accessibility, responsiveness, routes, or
  link integrity.
- AC-NRF-012: Given release surfaces are inspected, then the framework manifest,
  CLI version output, scaffolded framework dependency, website package, and
  current generated-artifact version report `0.2.0` consistently.
- AC-NRF-013: Given contribution guidance is inspected, then feature, release,
  and hotfix work starts from or targets `main`, and no active instruction
  depends on a `development` branch.
- AC-NRF-014: Given the complete independent repository verifier runs, then
  governance, framework, skills, examples, website, formatting, linting, type,
  unit, integration, link, and browser checks pass with no unexplained legacy
  requirement paths.

## Dependencies and assumptions

- The human project owner is the approval authority for this standard-risk
  cross-cutting change.
- Requirement and criterion IDs, not filenames, remain the stable semantic
  identities used for approval, mapping, selection, and evidence.
- The existing governed-content digest algorithm intentionally excludes the
  filesystem path and therefore does not invalidate approval for a byte-for-byte
  rename.
- Version 0.2.0 may require users of the pre-1.0 0.1.x line to rename governed
  artifacts and update `sleepyhollow.config.ts`; the actionable legacy
  diagnostic is the supported migration path.
- Existing historical governance entries may mention their original paths,
  versions, branches, or commands and remain unchanged when clearly historical.

## Change impact

The change affects every current governed artifact path and the tools that
discover or protect those artifacts. It also changes generated project layout
and configuration, so existing 0.1.x projects require a small explicit migration
before 0.2.0 verification succeeds. No runtime API, stored data, network
contract, authentication rule, or deployment target changes.

## Approval scope

Submit AC-NRF-001 through AC-NRF-014 together for standard-risk exact-content
approval. Approval authorizes the named-file migration, mapped red-state tests,
implementation, version update, and independent verification described above.
It does not authorize release delivery.

## Governance record

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-18T13:05:41Z.
- Approved criteria: AC-NRF-001 through AC-NRF-014.
- Governed-content digest:
  `sha256:e75c7a3c82796f8833779e32e3a740e02011cd35754082b7bc233b6f0baeb0eb`.
- Decision source: owner review; direct response `Approve` after review of the
  exact 0.2.0 named-requirement-file specification and digest.

### Criterion mapping

- AC-NRF-001 and AC-NRF-002 -> canonical/package guidance assertions and the
  named-artifact inventory in `website/tests/repository-consistency.test.mjs`.
- AC-NRF-003 through AC-NRF-005 -> named, multi-file, bounded-root,
  multi-service, malformed, duplicate, and legacy-path cases in
  `cli/evidence/evidence_test.ts`.
- AC-NRF-006 -> named decomposition and portable path-collision cases in
  `skills/sleepy-hollow/planning/planning_test.ts`, plus artifact-phase cases in
  `skills/sleepy-hollow/skill_test.ts`.
- AC-NRF-007 -> scaffold location, configuration, format exclusion, inventory,
  next-action, dependency, and version cases in `cli/create/create_test.ts`.
- AC-NRF-008 -> governed-write permission rejection in
  `cli/test/test_test.ts`.
- AC-NRF-009 and AC-NRF-010 -> complete `*.req.md` inventory, current-guidance,
  link, template-parity, and skill-package checks in
  `website/tests/repository-consistency.test.mjs`.
- AC-NRF-011 -> structural assertions in
  `website/tests/site-acceptance.test.mjs` and rendered assertions in
  `website/tests/landing-page.spec.ts`.
- AC-NRF-012 -> exact release-surface assertions in
  `cli/create/create_test.ts` and
  `website/tests/repository-consistency.test.mjs`.
- AC-NRF-013 -> contribution-workflow assertions in
  `website/tests/repository-consistency.test.mjs`.
- AC-NRF-014 -> `deno task check:governance`, component and example verifiers,
  the website `npm run verify` gate, and `git diff --check`.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-18T13:29:12Z.
- Baseline revision: `68d2fc25eaf0a1e787ff45724c9a71c48f51bbb4` plus the
  approved requirement, final mapped tests, and the separately authorized
  `CONTRIBUTING.md` branch-guidance edit, before implementation changes.
- Supersession: this replay supersedes the 2026-08-18T13:09:22Z red run because
  four mapped test sources were subsequently formatted or refined. The replay
  used a clean `git archive` of the baseline and exact copies of the final test
  sources, so the recorded hashes bind the evidence that follows.
- Runner environment: Deno `2.9.5` and Node.js `v26.0.0` on macOS arm64.
- Type health: `deno check` passed for every modified Deno test file before the
  red runs, establishing that the failures were not compilation failures.
- `deno task test:create`: 8 passed and 6 failed. Failures identified the old
  application path and README, old format exclusions, CLI `0.1.1`, scaffold
  result `0.1.0`, and generated dependency `0.1.2`.
- `deno task test:evidence`: 5 passed and 12 failed. Named artifacts were not
  discovered, multiple files in one directory loaded as an empty inventory,
  and legacy files were silently accepted or ignored instead of diagnosed.
- `deno task test:planning`: 9 passed and 2 failed. Decomposition still emitted
  `requirements.md` and did not detect portable named-path collisions.
- `deno task test:skill`: 11 passed and 1 failed. The artifact gate did not
  recognize `.req.md` as a requirement.
- Focused `AC-NRF-008` execution from `cli/test/test_test.ts`: 0 passed and 1
  failed because test write permissions still accepted `feature.req.md`.
- `npm run test:repository`: 4 passed and 8 failed. The current inventory,
  canonical paths, guidance, CI patterns, and release versions remained on the
  legacy convention.
- `npm run test:structure`: 29 passed and 2 failed. The healthy site controls
  passed while traceability still read the legacy website requirement path and
  the SGAD file map still presented `requirements.md`.
- Test digests: evidence
  `sha256:95e759412254bcdfa73106c9ffb93ac44c05ea0f1fb47690be7d4e95f285a5b6`;
  creation
  `sha256:976efd6eecd16bf8912dda9cc0fc883c0535c745e19c70dc3236d18cb801822c`;
  test command
  `sha256:0591a38d0236289dbc28ca60d387b361594760cc1453656d1450fdf6014091ab`;
  planning
  `sha256:0330f74817d0adb52a388f5de96fd6d20048a3c0179428513b5c2e298e89a56c`;
  skill
  `sha256:7f6f8fe02f0f0b5017c652f2b5dcfffae9c24ce9b2b07c1eb5cfe25abc19dea3`;
  repository
  `sha256:ee27e1ac5b6539ca922c979ccccb573f869cffb89e69fa2e02ba86f6e44f92ac`;
  site structure
  `sha256:ffb217cf818987b65ca4582fefb0d7abc4af785a55f00c0e0368dcb35eeafa1f`;
  browser
  `sha256:266d1eb973712cc0ec9db04da7f24ebca61f91624dab01dfe601b4594d456fe3`.
- Healthy controls: unchanged test-command behavior passed 12/12 before the
  added governed-write case; the remaining planning and skill cases stayed
  green; and 29/31 website structural checks remained green.

### Verification

- Status: passed.
- Verified at: 2026-08-18T13:35:02Z.
- Verification target: the uncommitted working tree on
  `feature/named-requirement-files`, based on
  `68d2fc25eaf0a1e787ff45724c9a71c48f51bbb4`. A commit identity remains pending
  because delivery, staging, and committing were not authorized.
- `deno task check:governance` passed with 21 bound governed-content digests.
- `deno task verify:framework`, `verify:create`, `verify:evidence`,
  `verify:planning`, `verify:skill`, `verify:test-command`, `verify:cli`,
  `verify:check`, `verify:dev`, `verify:capture`, and `verify:deploy` passed their
  formatting, linting, type, unit, and integration gates. The local-network dev
  cases passed after the verifier received permission to bind loopback ports.
- `deno task verify:examples` passed both official examples, including their
  generated-project verification scripts; `deno task verify:packaging` passed
  all 11 release-package checks.
- `npm run verify` passed as one complete website gate: 31 structural tests, 1
  link-target test, 12 repository-consistency tests, 8 framework-documentation
  tests, 13 Vitest tests, TypeScript compilation, and 135 Playwright tests
  across Chromium, Firefox, and WebKit.
- The Skill Creator `quick_validate.py` validator passed both
  `skills/sgad-workflow` and `skills/sleepy-hollow`. Its missing PyYAML runtime
  dependency was installed only in a temporary directory and removed after the
  validation run.
- `find` reported no remaining file named `requirements.md`; the remaining
  legacy-path strings outside governed history are bounded migration
  diagnostics, negative assertions, and baseline-comparison fixtures.
- `git diff --check` passed.
- Residual risk: this is a pre-1.0 filename compatibility break, so downstream
  0.1.x projects must apply the documented rename and configuration migration.
  Delivery evidence and a committed revision are intentionally absent.

### Delivery

- Status: not applicable until delivery is separately authorized.
