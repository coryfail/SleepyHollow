---
schema: sgad-component/v0.2
id: SH-F020
title: Distribution and public API surface
status: verified
risk: standard
source_sections:
  - "3.1"
  - "15"
depends_on:
  - SH-F001
  - SH-F011
owners:
  - Sleepy Hollow maintainers
---

# Distribution and public API surface

## Purpose

Make Sleepy Hollow installable, and make explicit which of its exports are a
supported public API that consumers may depend on.

The repository currently declares no package name, version, or export map.
Every `mod.ts` export is therefore equally reachable and equally undefined as
public or internal, which makes any future change potentially breaking and
makes compatibility impossible to reason about.

## In scope

- A declared package identity and version.
- An explicit export map naming the supported entry points.
- Publication to JSR.
- Documented installation and project-creation instructions that match the
  published artifacts.
- A release check that refuses to publish an unverified or inconsistent tree.

## Requirements

### Identity

The repository shall declare one package name and one version. The version
shall follow semantic versioning, and a release shall not reuse a published
version.

### Public surface

The package shall declare an explicit export map. Only exported entry points
are public API. A module reachable only by deep path is internal, and consumers
depending on it receive no compatibility guarantee.

The public surface shall include the framework runtime entry points a generated
project imports, the CLI entry point, and nothing whose stability the project is
unwilling to maintain. Test utilities intended for consumers shall be exported
deliberately rather than incidentally.

A change that removes or narrows a public export is a breaking change and
requires a major version.

### Registries

The package shall publish to JSR, and to no other registry. JSR is the registry
Deno consumers install from, and it serves every published package through an
npm-compatible registry as well, so a consumer working through npm tooling can
install the package without a second publication by this project.

A second artifact on npm would require a build toolchain the project does not
otherwise need, would have to be held at the same version as the JSR release,
and would have to be verified on its own. The project declines that cost.

The publication shall not imply support for runtimes the framework does not
support. The framework targets Deno, and the published metadata and
documentation shall state that plainly rather than leaving a consumer to
discover it through a runtime failure.

### Release gate

Publication shall require that the repository's own verification passes for the
revision being published. A release shall not proceed from a tree with failing
checks, uncommitted changes, or a version already published.

The set of already published versions shall be resolved from the registry's own
listing for the declared package at release time, rather than asserted by the
caller requesting the release. A caller-supplied list states what the caller
believes; only the registry knows what it holds, and a JSR version is immutable
once published, so a release proceeding on a stale belief cannot be undone.

Resolution shall be through a declared transport seam, so the gate's behaviour
is verifiable without network access and the registry is consulted once, at the
point of release, rather than by every test run.

A registry that does not answer, or answers in a form the gate cannot read,
shall refuse the release. An unreachable registry is an unanswered question
about whether the version is free, and treating an unanswered question as
permission is what the gate exists to prevent.

## Acceptance criteria

- AC-F020-001: The repository declares one package name and one semantic
  version, and the declared version is checked against the versions JSR's
  listing reports for the declared package, resolved through the gate's
  transport seam rather than supplied by the caller.
- AC-F020-002: The package declares an explicit export map, and every entry
  point it names resolves.
- AC-F020-003: A module not named in the export map is not reachable as a
  package import.
- AC-F020-004: The published metadata and installation documentation state that
  the framework targets Deno.
- AC-F020-005: Installation instructions in the repository resolve against the
  published artifacts for the declared version.
- AC-F020-006: A release attempt from a tree whose verification fails is
  refused, and the failing evidence is reported.
- AC-F020-007: A release attempt reusing an already published version is
  refused.
- AC-F020-008: A release attempt from a tree with uncommitted changes is
  refused.
- AC-F020-009: A release attempt is refused, with the registry's response
  reported as evidence, when the registry listing cannot be reached or cannot
  be read.

## Out of scope

- Supporting Node, Bun, or any runtime other than Deno.
- A compatibility layer or polyfill for Deno-specific APIs.
- Publication to npm, and reservation of the package name there. The name is
  consequently unprotected on that registry.
- An npm-installable executable. JSR declares no `bin` entry, so the CLI is
  invoked as `deno run -A jsr:<package>/cli` and is not reachable through
  `npx`.
- Automated version selection, changelog generation, or release notes.
- Publishing the SGAD workflow skill, which SH-F017 owns.
- Deployment of applications built with the framework, which SH-F013 owns.

## Dependencies and assumptions

SH-F001 generates projects that import the published package, so the export map
must satisfy what a generated project imports. SH-F011 owns the CLI entry point
the package exposes as a binary.

Resolving published versions assumes JSR exposes a listing for the declared
package and that the release environment can reach it. The transport seam keeps
that assumption out of the test suite: the gate's behaviour is verified against
a supplied transport, and the live query happens only when a release is
attempted.

The framework depends on Deno KV, Deno Deploy, and Deno runtime APIs. Reach to
consumers installing through npm tooling comes from JSR's npm-compatible
registry, which serves the JSR publication rather than a separate artifact.
That is not a claim of Node support, and this requirement does not introduce
one.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Amendment: registry-resolved published versions

- Status: approved. This amendment supersedes the prior governed content. The
  binding approval for the current content is recorded under "Approval,
  registry-resolution amendment"; the two earlier approvals bind superseded
  content and are retained as history.
- Raised at: 2026-08-09.
- Change: the release gate resolves the published version set from JSR's
  listing for the declared package, through a declared transport seam, rather
  than accepting a set asserted by the caller. AC-F020-001 is narrowed to name
  that resolution. AC-F020-009 is added, requiring refusal when the listing
  cannot be reached or read.
- Why now: the package is published, so a live listing exists to check against.
  The residual risk recorded under "Verification, criterion-mapping correction"
  and again under "Verification, JSR-only amendment" was that no publication
  had occurred and the criterion therefore verified the declared version
  against the release request. That condition no longer holds.
- Distinction worth recording: AC-F020-001 already required the declared
  version to match the version published to JSR. The gap was in verification,
  not in intent, and the narrowed wording makes the obligation observable.
  AC-F020-009 is genuinely new scope.
- Cost this decision accepts: the gate now depends on an external service at
  release time. The transport seam confines that dependency to the release
  path, so the test suite remains hermetic and runs without network access.
- Consequent implementation, authorized by the approval recorded below:
  `ReleaseRequest.publishedVersions` is replaced by a transport seam in
  `packaging/types.ts`, `packaging/release.ts` gains registry resolution and
  fail-closed handling, and `packaging_test.ts` supplies a stub transport.
  All follow the approval rather than precede it.

### Approval, registry-resolution amendment

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T23:15:17Z.
- Approved criteria: AC-F020-001 through AC-F020-009, with AC-F020-001 narrowed
  to registry-resolved verification and AC-F020-009 newly added.
- Governed-content digest:
  `sha256:6ff4670ff3fe15976fbcad8f337092ed30277d2285e64b357abec6423d174c48`.
- Decision source: owner review; direct response `Approve` after review of the
  drafted normative change, the narrowed AC-F020-001, the added AC-F020-009,
  the accepted external-dependency cost, the named consequent code changes,
  and the exact governed-content digest.

### Red-state evidence, registry-resolution amendment

- Status: failed as expected for the three affected criteria.
- Observed at: 2026-08-09, after the approval above and before the behavioural
  change.
- Baseline revision: `04b8238`.
- Command: `deno task test:packaging`.
- Result: `8 passed | 3 failed`.
  - AC-F020-001 failed: the gate never called the supplied transport, so the
    recorded calls were `[]` rather than the declared package name.
  - AC-F020-007 failed: a version present in the listing was not refused.
  - AC-F020-009 failed: an unreadable listing was not refused.
- Why this is credible red state: `deno check` passed on both the module and
  the test before the run, so all three are missing-behaviour failures rather
  than compilation errors, and each names the approved behaviour it lacks.
- Typed-language caveat, recorded honestly: the seam's type surface
  (`RegistryTransport`, `RegistryListingResult`, and the `registry` field) was
  introduced before the red run, because a type-checked test cannot reference
  a type that does not exist, and the resulting failure would have been a
  broken baseline rather than evidence. No resolution, comparison, or refusal
  behaviour was implemented before the red run.
- Scope of the red run: the remaining six criteria were unaffected by this
  amendment and are not claimed to have fresh red-state evidence.

### Verification, registry-resolution amendment

- Status: passed.
- Verified at: 2026-08-09T23:18:19Z.
- Commands: `deno task verify:packaging`, every other component's `verify:*`
  task, `deno task check:governance`, and the canonical `npm run
  test:repository` from `website/`.
- Result: `11 passed | 0 failed` for packaging; all nineteen component suites
  passed; governed digests bind for 29 requirements; the independent
  repository verifier reported `9 passed | 0 failed`.
- Change made: `ReleaseRequest.publishedVersions` was replaced by a
  `registry` transport in `packaging/types.ts`; `packaging/release.ts` resolves
  the listing at gate time, refuses a version the listing contains, and refuses
  with `SH_RELEASE_REGISTRY_UNAVAILABLE` when the listing cannot be read;
  `gateRelease` and `release` became asynchronous.
- Residual risk: the repository ships no production transport. The seam is
  exercised in tests by a supplied stub, and the live query against JSR is
  performed by `.github/workflows/publish.yml` before `deno publish`. A caller
  invoking `gateRelease` outside that workflow must supply its own transport,
  and nothing in this component compels the one it supplies to be truthful.

### Amendment: JSR-only distribution

- Status: approved. The approval recorded under "Approval" below binds the
  prior governed content, not this document; the binding approval for the
  current content is recorded under "Approval, JSR-only amendment".
- Raised at: 2026-08-09.
- Change: npm is dropped entirely. The component publishes to JSR alone.
  JSR's npm-compatible registry already serves the JSR publication to npm
  tooling, so a duplicate artifact buys reach the project already has.
  AC-F020-001 narrows from "both registries" to JSR.
- Costs this decision accepts, recorded as out of scope rather than left
  implicit: the package name is unprotected on npm and may be taken by someone
  else, and the CLI is not reachable through `npx`.
- Evidence for the change: `deno bundle --declaration` emits subpath
  declarations that import unshipped source paths, and a `tsc` emit requires
  reconstructing Deno's global and `node:` typings outside `deno check`. The
  npm artifact was therefore not obtainable without a second toolchain to
  maintain and verify.
- Consequent implementation, authorized by the approval recorded below: the
  `registries` tuple in `packaging/types.ts` and `packaging/release.ts`
  declared `["jsr", "npm"]`, and the AC-F020-001 test in `packaging_test.ts`
  asserted it. Both follow the amendment rather than precede it.

### Approval, JSR-only amendment

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T18:51:45Z.
- Approved criteria: AC-F020-001 through AC-F020-008, with AC-F020-001 narrowed
  to JSR.
- Governed-content digest:
  `sha256:884426b459e705b4aefc7c0ee83aa76dc1c221085785648c13ae00f203c61134`.
- Decision source: owner review; direct response `Approve` after review of the
  drafted amendment, the two accepted costs recorded as out of scope, the named
  consequent code changes, and the exact governed-content digest.

### Red-state evidence, JSR-only amendment

- Status: failed as expected for the one affected criterion.
- Observed at: 2026-08-09, between 18:51:45Z and 18:53:22Z, after the approval
  above and before any implementation change.
- Command: `deno task test:packaging`.
- Result: `9 passed | 1 failed`. AC-F020-001 failed with actual
  `["jsr", "npm"]` against expected `["jsr"]`. The mapped test was narrowed
  first and run against the unmodified implementation, so the failure is
  credible red state rather than a test written after the fact.
- Scope of the red run: the remaining seven criteria were unaffected by this
  amendment and are not claimed to have fresh red-state evidence.

### Verification, JSR-only amendment

- Status: passed.
- Verified at: 2026-08-09T18:53:22Z.
- Commands: `deno task verify:packaging`, `deno task check:governance`, and the
  canonical `npm run test:repository` from `website/`.
- Result: `10 passed | 0 failed`; governed digests bind for 29 requirements;
  the independent repository verifier reported `9 passed | 0 failed`.
- Change made: the `registries` tuple narrowed to `["jsr"]` in
  `packaging/types.ts` and `packaging/release.ts`, and the README status line
  no longer claims a pending npm publication.
- Residual risk: no publication has occurred, so AC-F020-001 continues to
  verify the declared version against the release request rather than against a
  live registry listing. The package name is unclaimed on npm by decision, and
  a third party may take it.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T17:34:18Z.
- Approved criteria: AC-F020-001 through AC-F020-008.
- Governed-content digest:
  `sha256:d8c40c170978b879bc55bd6e4a34400d806cf4ef98cb0d3625f49a9d35b3affd`.
- Decision source: owner review; direct response `Approve` after review
  of package identity, the explicit public export surface, dual-registry publication, and the release gate, and the exact governed-content digest.

### Criterion mapping

- AC-F020-001 -> `packaging_test.ts` declared name and semantic version test.
- AC-F020-002 -> `packaging_test.ts` export-entry resolution test.
- AC-F020-003 -> `packaging_test.ts` internal-module exclusion test.
- AC-F020-004 -> `packaging_test.ts` declared Deno runtime test.
- AC-F020-005 -> `packaging_test.ts` documented-installation resolution test,
  asserting the README names the declared package and that every documented
  specifier and entry point matches the declared name and export map.
- AC-F020-006 -> `packaging_test.ts` failing-verification refusal test.
- AC-F020-007 -> `packaging_test.ts` reused-version refusal test.
- AC-F020-008 -> `packaging_test.ts` dirty-tree refusal test.

### Red-state evidence

- Status: failed as expected for six of eight criteria.
- Observed at: 2026-08-08T20:14:45Z.
- Commands: `deno task check:packaging` and `deno task test:packaging`.
- Result: type checking passed and `deno task test:packaging` reported
  `2 passed | 6 failed`.
- Sequencing defect recorded honestly: AC-F020-002 and AC-F020-003 passed at the
  red run because the export map was added to `deno.json` before the mapped
  tests were executed, rather than after. Those two criteria therefore have no
  credible red-state evidence. The remaining six failed against the
  nonfunctional release gate as expected. The correct order is to run the mapped
  tests against the unmodified baseline first.

### Verification

- Status: passed.
- Verified at: 2026-08-08T20:14:45Z.
- Command: `deno task verify:packaging`.
- Result: `8 passed | 0 failed`.
- Consequence discovered and repaired: declaring `name`, `version`, and
  `exports` enabled JSR slow-type rules across the repository. Two real defects
  surfaced, both genuine publication blockers rather than spurious failures: a
  public `criterionTest` without an explicit return type, and a
  type-only import in `security_router.ts` using value-import syntax. Both are
  corrected, and all twelve component suites pass.
- Residual risk: no publication has been attempted. AC-F020-001 verifies the
  declared version against the request, not against a live registry, and
  AC-F020-005 has no published artifact to resolve against until a first
  release runs.

### Verification, criterion-mapping correction

- Status: passed for all eight approved criteria after correcting a mapping
  defect.
- Verified at: 2026-08-09T01:01:56Z.
- Command: `deno task verify:packaging`.
- Result: `9 passed | 0 failed`, comprising the eight mapped criteria and one
  supporting release-gate test that claims no criterion.
- Defect found by readiness audit: AC-F020-005 requires that installation
  instructions resolve against the published artifacts for the declared
  version. Its mapped test asserted that a clean verified release is permitted,
  which does not test that criterion at all. The repository additionally
  contained no installation instructions, so the criterion could not have been
  satisfied.
- Correction: installation and deployment instructions were added to `README.md`
  naming the declared package, the Deno-only runtime target, and the
  `DENO_DEPLOY_TOKEN` variable. AC-F020-005 now asserts the documented
  specifiers match the declared package name and that every documented entry
  point exists in the export map. The former assertion was retained as a
  supporting test without a criterion label.
- Residual risk unchanged: no publication has occurred, so the documented
  specifier is verified against the declared package rather than against a live
  registry listing.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
