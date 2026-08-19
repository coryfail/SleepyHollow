---
schema: sgad-component/v0.2
id: SH-F020
title: npm distribution and public API surface
status: approved
risk: standard
source_sections:
  - "3.1"
  - "15"
depends_on:
  - SH-F001
  - SH-F011
  - SH-F021
owners:
  - Sleepy Hollow maintainers
---

# npm distribution and public API surface

## Purpose

Publish one verified Node and Bun package with an explicit supported API and an
ordinary installable `hollow` executable.

## Authorized scope

- A root npm package with one semantic version and committed lockfile.
- Compiled ESM JavaScript, declaration files, source maps, license, readme,
  changelog, package metadata, explicit exports, and a `hollow` binary.
- Node 24 LTS as the declared minimum engine and Bun compatibility proven by
  package-level conformance.
- npm as the only framework package registry.
- Packed-artifact installation tests and a release gate that refuses an
  unverified, dirty, malformed, unpublished-name, or reused-version release.

## Identity and public surface

The repository shall declare one npm package name and one semantic version. The
package name remains `@sleepy-hollow/framework` unless npm ownership or
availability verification proves it unusable, in which case changing it
requires a requirement amendment rather than a silent substitute. A release
shall never reuse an npm version.

Only entries declared in `package.json` exports are public. The surface shall
include the application API, routing, validation, database, security,
configuration, services, testing, capture, generated-client support where
applicable, and CLI entry point. Removed legacy entry points shall not remain as
empty compatibility claims. A module reachable only through a deep filesystem
path is internal.

The package shall expose a `bin` mapping named `hollow`. Global installation,
package-manager execution, and local project execution shall reach the same CLI
contract. Documentation may use `npx hollow` only when a packed or published
artifact proves that command resolves; otherwise it shall show the scoped
package invocation accurately.

## Artifact construction

Published contents shall be built from strict TypeScript into ESM JavaScript and
declarations before packing. Consumers shall not execute TypeScript from
`node_modules`. The tarball shall contain only declared runtime files and
documentation, including the changelog: no tests, repository governance history,
local database,
credentials, website build, development cache, uncompiled source-only entry,
or unrelated generated artifact.

The package shall install and run from a temporary empty project under Node and
Bun without repository-relative imports or undeclared dependencies. The npm
lockfile, package manifest, built export graph, executable permissions, and
tarball contents shall be deterministic for the verified revision.

## Registry and release gate

npm is the only framework registry. Published metadata shall state the Node and
Bun support policy and shall not imply support for removed runtimes or
unimplemented deployment providers.

Publication requires the repository verifier, Node package conformance, Bun
package conformance, clean-tree check, version check, package-name ownership or
availability check, pack-content check, and provenance inputs to pass for the
same revision. Published versions and package identity shall be resolved from
the npm registry through an injected transport at release time, not supplied by
the caller. An unreachable, malformed, unauthorized, or contradictory registry
response refuses release.

No publish, tag, commit, push, release, package-name reservation, organization
creation, or ownership mutation is authorized by this requirement. The release
implementation and tests may construct and install local tarballs only.

## Acceptance criteria

- AC-F020-001: The root manifest declares one name, semantic version, npm
  lockfile, Node engine, module type, build outputs, and `hollow` binary, and the
  release gate resolves package identity and versions from npm through an
  injected transport.
- AC-F020-002: Every explicit export resolves from the packed artifact under
  Node and Bun, while an undeclared deep import is rejected.
- AC-F020-003: The packed tarball contains compiled ESM JavaScript,
  declarations, source maps, license, readme, changelog, and required runtime
  assets, and
  excludes tests, governance records, local data, credentials, caches, and
  unrelated artifacts.
- AC-F020-004: A temporary empty project can install the tarball and use the
  public API and `hollow` executable under Node and Bun without repository
  access or undeclared dependencies.
- AC-F020-005: Installation and CLI documentation exactly match commands proven
  against the packed artifact and state the supported runtime policy.
- AC-F020-006: A release attempt with failing verification, package
  conformance, or artifact inspection is refused with the blocking evidence.
- AC-F020-007: A release attempt reusing an npm version or targeting an
  unavailable or unauthorized package identity is refused.
- AC-F020-008: A release attempt from a tree with uncommitted changes is
  refused.
- AC-F020-009: An unreachable or malformed npm registry response refuses release
  rather than treating missing evidence as permission.
- AC-F020-010: Active package metadata, exports, scripts, locks, documentation,
  and installation behavior contain no removed registry or runtime dependency.

## Out of scope

- CommonJS publication.
- Supporting browsers or every Node-compatible runtime.
- Publishing the SGAD workflow skill, which SH-F017 owns.
- Application deployment, which SH-F013 owns.
- Automated semantic-version selection, release notes, changelog generation,
  commits, pushes, tags, or publication.

## Dependencies and assumptions

SH-F001 generates package consumers, SH-F011 owns CLI behavior, and SH-F021 owns
runtime compatibility. npm organization ownership for the existing scoped name
has not been demonstrated; local implementation shall retain the intended name
and report that external publication remains blocked until ownership is proven.

## Change impact

This requirement removes the current registry, source-distribution model,
runtime invocation, export filenames, and release transport. It adds a compiled
artifact and executable and invalidates the historical approval and verification
entries below.

## Approval scope

Approval authorizes AC-F020-001 through AC-F020-010 and local build, pack, and
temporary-install tests. It does not authorize npm publication or any external
registry mutation.

## Governance record

### Verification invalidation, 0.2.0 release identity

- Status: prior verification is stale; the recorded approval still binds the
  unchanged governed content.
- Invalidated at: 2026-08-18T13:18:57Z.
- Reason: package manifests changed to 0.2.0 under the approved
  `named-requirement-files` migration.

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
- Baseline revision: `6ddb394`, formerly `04b8238`. The commit was renamed by a
  `git filter-branch` that stripped co-author trailers on 2026-08-10; the tree
  is unchanged and the pre-squash history is retained under the tag
  `evidence/development-pre-squash-0.1.1`.
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

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: all acceptance criteria currently owned by SH-F020.
- Governed-content digest:
  `sha256:add7aa3a8123323a5d090ca36bc68031f152065482b4c7204a1d91fd637bbb96`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.

### Red-state evidence, platform migration baseline

- Status: mixed baseline before implementation.
- Observed at: 2026-08-19T13:52:03Z.
- Command: `node --test tests/platform-migration-baseline.test.mjs`.
- Result: the changelog portion of AC-F020-003 passed because the requested
  changelog and linked migration notice are present; package construction and
  packed-artifact behavior remain unimplemented and are covered by the failed
  AC-F021-001 baseline.
