---
schema: sgad-component/v0.2
id: SH-F020
title: Distribution and public API surface
status: approved
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
- Publication to JSR and to npm.
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

The package shall publish to JSR as the primary registry for Deno consumers,
and to npm for reach and name reservation. Both publications shall come from
the same verified revision and shall declare the same version.

The npm artifact shall not imply support for runtimes the framework does not
support. The framework targets Deno, and the published metadata and
documentation shall state that plainly rather than leaving a Node consumer to
discover it through a runtime failure.

### Release gate

Publication shall require that the repository's own verification passes for the
revision being published. A release shall not proceed from a tree with failing
checks, uncommitted changes, or a version already published.

## Acceptance criteria

- AC-F020-001: The repository declares one package name and one semantic
  version, and the declared version matches the version published to both
  registries.
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

## Out of scope

- Supporting Node, Bun, or any runtime other than Deno.
- A compatibility layer or polyfill for Deno-specific APIs.
- Automated version selection, changelog generation, or release notes.
- Publishing the SGAD workflow skill, which SH-F017 owns.
- Deployment of applications built with the framework, which SH-F013 owns.

## Dependencies and assumptions

SH-F001 generates projects that import the published package, so the export map
must satisfy what a generated project imports. SH-F011 owns the CLI entry point
the package exposes as a binary.

The framework depends on Deno KV, Deno Deploy, and Deno runtime APIs. npm
publication is a distribution and naming channel for Deno consumers who install
through npm specifiers. It is not a claim of Node support, and this requirement
does not introduce one.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T17:34:18Z.
- Approved criteria: AC-F020-001 through AC-F020-008.
- Governed-content digest:
  `sha256:d8c40c170978b879bc55bd6e4a34400d806cf4ef98cb0d3625f49a9d35b3affd`.
- Decision source: Claude conversation; direct response `Approve` after review
  of package identity, the explicit public export surface, dual-registry publication, and the release gate, and the exact governed-content digest.

### Criterion mapping

- Status: pending approval and governed tests.

### Red-state evidence

- Status: pending approved test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
