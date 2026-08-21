---
schema: sgad-component/v0.2
id: SH-F021
title: Node and Bun runtime platform
status: approved
risk: high
source_sections:
  - "3.1"
  - "10"
  - "15"
depends_on:
  - SH-F001
  - SH-F002
  - SH-F003
owners:
  - Sleepy Hollow maintainers
---

# Node and Bun runtime platform

## Purpose

Make Sleepy Hollow a portable JavaScript and TypeScript framework whose
canonical production runtime is Node.js and whose built artifacts are also
verified under Bun, without retaining an active dependency on Deno-specific
runtime, tooling, packaging, database, or deployment APIs.

## Authorized scope

- Node.js 24 LTS as the minimum supported and canonical runtime.
- Bun as a supported compatible runtime for generated applications and the
  installed CLI.
- ECMAScript modules, Web-standard request and response contracts, and explicit
  runtime adapters for server, process, filesystem, environment, watcher, and
  signal behavior.
- A root npm workspace, compiled JavaScript and declaration output, Node-based
  formatting, linting, type checking, testing, generation, and governance
  verification.
- Conversion of the framework, CLI, examples, generated scaffold, website
  integration, documentation, and CI from Deno-specific behavior to the new
  runtime boundary.
- Removal of active Deno source, dependency, task, lockfile, package, registry,
  deployment, and user-guidance references.
- A root `CHANGELOG.md` migration entry that explains the decision to leave
  Deno and directs users to the breaking-change migration notice.

## Runtime contract

The framework core shall express HTTP behavior through Web `Request`,
`Response`, `Headers`, `URL`, `fetch`, `AbortController`, `ReadableStream`, and
Web Crypto contracts. Runtime-specific server and operating-system behavior
shall live behind explicit adapters and shall not leak into route definitions,
validation, repositories, capture evidence, generated clients, or application
requirements.

Node.js 24 LTS shall be the minimum supported runtime and the reference runtime
for verification and published compatibility. Bun shall run the same compiled
package, public API, CLI grammar, generated project, HTTP contract, database
repository contract, and selected deployment preparation behavior. A Bun-only
implementation may be used behind an adapter when the corresponding Node API is
not portable, but it shall not change observable framework behavior.

Source shall be authored as strict TypeScript ESM and compiled to distributable
JavaScript plus declarations. Published packages shall not depend on runtime
execution of TypeScript source. Relative imports, package exports, process exit
behavior, signals, path containment, child processes, file watching, and stream
bridging shall be verified on supported operating systems without invoking a
shell for structured commands.

## Toolchain and tests

The root project shall use `package.json` and one committed npm lockfile as the
canonical dependency and task definition. TypeScript shall type-check without
emitting, the build shall emit the published JavaScript and declarations, and
the test suite shall use pinned Vitest under Node with no runtime-global test
API. Runtime conformance tests shall execute the built CLI and a generated
application under both Node and Bun.

CI shall run the full verifier on Node 24 LTS and the declared current Node LTS
compatibility range. A separate Bun job shall run type-compatible installation,
CLI, server, SQLite, and generated-project conformance. A missing Bun executable
in a local checkout may skip only the local Bun conformance command with an
explicit diagnostic; release verification and CI shall not skip it.

All current component behavior remains governed by its owning requirement.
Changing the runner does not weaken mapped acceptance tests, capture evidence,
path safety, credential redaction, verification gates, or deployment approval.
Every affected verification entry becomes stale until its mapped suite passes
under the new toolchain.

## Removal boundary

Active source, configuration, dependency manifests, lockfiles, generated
projects, public exports, installation instructions, website claims, examples,
and current product requirements shall contain no dependency on or support
claim for Deno, Deno KV, Deno Deploy, JSR, `deno.json`, or `deno.lock`.

`CHANGELOG.md` and the linked versioned migration notice may name these retired
technologies only in a dated historical migration entry that clearly says they
are no longer supported. That notice shall state the portability, deployment,
persistence, and packaging reasons for the change and provide replacement
steps. It shall not describe a compatibility path, a supported Deno deployment,
or a current Deno command.

Historical approval, red-state, verification, and delivery entries are immutable
audit records and may retain the names of the tools and platforms that actually
produced them. Those historical references shall be clearly superseded and
shall not be interpreted as current support.

## Error outcomes

- Startup under an unsupported runtime fails before serving traffic and names
  the supported Node and Bun versions.
- A missing required runtime adapter fails closed instead of falling back to a
  partially compatible implementation.
- Child-process, filesystem, watcher, signal, stream, or server failures retain
  stable, redacted framework diagnostics.
- A build, test, or release that observes active Deno coupling fails the
  independent repository check.

## Acceptance criteria

- AC-F021-001: A clean checkout installs, builds, type-checks, and runs the full
  independent verifier using the root npm toolchain on Node 24 LTS without a
  Deno executable or Deno-owned artifact.
- AC-F021-002: The built package and generated empty application run under both
  Node and Bun and produce equivalent HTTP status, headers, body, shutdown, and
  CLI result contracts for the conformance fixtures.
- AC-F021-003: Route, validation, security, capture, client, and repository
  public contracts use Web or framework-owned types rather than runtime-global
  Deno types.
- AC-F021-004: Server, process, filesystem, environment, watcher, signal, and
  stream behavior is reached only through explicit runtime adapters and retains
  the existing containment, cleanup, redaction, and failure guarantees.
- AC-F021-005: The npm package contains compiled JavaScript and declarations,
  and consumers do not execute TypeScript from `node_modules`.
- AC-F021-006: Active code, manifests, locks, exports, generated scaffolds,
  documentation, website claims, and current requirement content contain no
  Deno runtime, Deno KV, Deno Deploy, or JSR dependency or support claim;
  preserved historical governance entries are the only allowed references.
- AC-F021-007: Every preexisting governed component suite is ported without
  deleting assertions or weakening criterion mappings, and affected evidence is
  reported stale until the new verifier passes.
- AC-F021-008: An unsupported runtime or missing adapter fails before traffic,
  data mutation, package publication, or deployment and emits an actionable,
  redacted diagnostic.
- AC-F021-009: `CHANGELOG.md` contains a dated Node/Bun migration entry that
  accurately explains the Deno removal, states that Deno support ended, and
  links to the versioned migration notice without claiming any legacy runtime,
  database, registry, or deployment support.

## Out of scope

- Browser execution of the server framework.
- Supporting CommonJS as a public module format.
- Claiming compatibility with every Node-compatible runtime.
- Preserving Deno or JSR compatibility.
- Replacing Web-standard APIs with a Node-only route contract.
- External publication, deployment, or destructive migration of user data.

## Dependencies and assumptions

SH-F001 owns generated project configuration, SH-F002 owns the fetch-compatible
router, and SH-F003 owns runtime validation. SH-F004 owns database drivers,
SH-F013 owns deployment, and SH-F020 owns the npm artifact. Bun is not installed
in the current development environment and must be installed before its required
conformance evidence can be produced.

## Change impact

This migration invalidates current implementation and verification evidence for
every component whose tests or runtime effects use Deno. It removes the current
JSR distribution, Deno-specific CLI invocation, Deno KV public API, and Deno
Deploy adapter. The framework is pre-1.0, but these are still deliberate
breaking changes that require release notes and a versioned migration notice.

## Approval scope

Approval authorizes AC-F021-001 through AC-F021-009, the removal boundary, the
Node 24 LTS and Bun support policy, conversion of unchanged component tests, and
the declared breaking changes. It does not authorize publication or a live
deployment.

## Governance record

> Historical verification note: Deno commands, runtime names, and platform
> artifacts appearing below this boundary belong to the pre-Node/Bun
> implementation or migration record. They are retained for audit history only;
> current behavior and verification use the Node.js/Bun package workflow.

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: pending.
- Approver: human-project-owner.
- Approved at: pending.
- Approved criteria: pending.
- Governed-content digest: pending.
- Decision source: pending exact-content review.

### Criterion mapping

- Status: pending approval and mapped tests.

### Red-state evidence

- Status: pending approval and baseline test formulation.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable. No publication or deployment is authorized by this
  requirement.

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: AC-F021-001 through AC-F021-009.
- Governed-content digest:
  `sha256:f1e9fdcf64011e1899ebe6aa97152f64e70d12e28e1acc1467ad020dbfaf1e74`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.

### Red-state evidence, platform migration baseline

- Status: failed as expected before implementation.
- Observed at: 2026-08-19T13:52:03Z.
- Command: `node --test tests/platform-migration-baseline.test.mjs`.
- Result: AC-F021-001 failed because the root has no `package.json` or npm
  lockfile; it remains a Deno project. Three tests failed and the independently
  authored changelog test passed.
