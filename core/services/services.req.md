---
schema: sgad-component/v0.2
id: SH-F014
title: Optional multi-service projects
status: draft
risk: standard
source_sections:
  - "9"
  - "15.1"
depends_on:
  - SH-F001
  - SH-F005
  - SH-F010
  - SH-F012
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Optional multi-service projects

## Purpose

Allow justified applications to use independently deployable services without
making microservices the default or turning Sleepy Hollow into an orchestration
platform.

## In scope

- A governed architecture manifest for one API, extraction-ready boundaries, or
  independently deployed services.
- Collision-safe service workspace scaffolding from an approved manifest.
- Separate requirements, runtime configuration, API, tests, generated contract,
  deployment configuration, and Deno KV ownership per service.
- Static import/source checks and runtime capabilities that enforce service data
  ownership within the supported framework path.
- Cross-service access through SH-F010 generated clients and project-approved
  authentication.
- Request deadlines, cancellation, request-ID propagation, and explicit partial
  failure contracts.

## Requirements

### Architecture manifest and defaults

Planning shall emit one deterministic, typed `ServiceArchitecture` manifest
with exactly one of these choices:

- `single-service`: one application root and no distributed runtime behavior;
- `extraction-ready`: one deployed application whose approved feature or data
  boundaries are recorded without network calls or separate databases; or
- `multi-service`: two or more independently deployed service workspaces.

`single-service` is the default. `extraction-ready` or `multi-service` requires a
non-empty rationale tied to at least one independently reviewed ownership,
scaling, deployment, isolation, regulatory, or lifecycle need. Fashion,
hypothetical future scale, and code organization alone are insufficient.

Every service entry shall have a stable lowercase service ID, relative workspace
root, owning application-requirement path, configuration path, API root, test
root, generated-contract root, deployment-configuration path, and unique Deno KV
binding ID. Multi-service entries shall also declare their outbound service
dependencies. Absolute paths, overlapping roots, duplicate IDs or KV bindings,
path traversal, undeclared dependencies, circular dependencies without an
approved rationale, and an architecture choice inconsistent with its service
count shall fail normalization with actionable diagnostics. Normalization shall
sort services and dependencies and shall contain no timestamp, host path, or
ambient environment value.

An extraction-ready manifest records logical ownership boundaries inside the one
service. It shall not create network calls, service authentication, additional
databases, deployment units, or operational requirements. A single-service
project shall continue to work without defining a service manifest or activating
this module.

### Service workspaces

Given an approved normalized multi-service manifest and approved application
requirement content for each service, the framework scaffolder shall stage and
atomically create each service beneath its declared root. Each workspace shall
contain its own `requirements/application.req.md`, `sleepyhollow.config.ts`, `api/`,
`tests/`, `generated/`, and deployment configuration. Its config shall bind only
its declared KV database and shall identify its generated and deployment roots.
The scaffolder shall not invent endpoint behavior or approval, overwrite an
existing path, partially create a service set, copy credentials, or share a
generated directory, KV binding, or mutable configuration file between services.

The scaffold result shall use one versioned shape for human and structured
consumers and list every created service and path in deterministic order. A
failure shall retain all pre-existing files and remove the complete staged set.
Running the service's documented verification or SH-F010 generation command
shall require only that service's files and configured test doubles; unrelated
services shall not need to start unless an approved integration-test criterion
explicitly names them.

### Data ownership boundary

A service shall never import another service's implementation, open another
service's KV binding, or receive another service's repository or raw-KV
capability. The boundary verifier shall inspect the normalized service roots and
the complete local TypeScript source/import inventory. It shall fail on
cross-root implementation imports, another service's generated persistence
adapter, direct `Deno.openKv` use inside any service workspace, or a repository/KV
capability whose declared owner differs from the requesting service. Diagnostics
shall name both services, the source, the forbidden target or binding, and the
generated-client correction.

The runtime service-KV capability shall bind an immutable service ID and KV
binding before the database opener is invoked. Owner/requester mismatch shall
fail closed without opening a database. This guard and the static verifier cover
the supported framework path; they do not claim to sandbox arbitrary Deno code.
SH-F004 remains the only persistence API inside an owning service.

### Cross-service calls and failures

Cross-service access shall use only the owning service's SH-F010 generated
client, an explicitly configured base URL, and a project-approved neutral
authentication hook. Sleepy Hollow shall not discover services, exchange user
tokens, store credentials, select an identity provider, or expose a persistence
object through a service client. The caller shall declare the dependency in the
architecture manifest before constructing its client.

The service-call transport shall accept the incoming request ID, a positive
bounded timeout, an optional parent cancellation signal, an injected compatible
fetch implementation, and the approved authentication hook. It shall set the
canonical request-ID header without allowing arbitrary headers to replace it,
combine the parent signal with the timeout, clear timer resources on completion,
and preserve SH-F010's operation-aware authentication context. Platform timers
are the default; an injectable deadline scheduler shall make expiry and cleanup
deterministic in tests without changing production semantics. The transport shall
distinguish deadline expiry, parent cancellation, unavailable transport,
declared remote `ApiError`, and remote response-contract failure without leaking
credentials or response internals.

Each declared outbound dependency shall point to caller-owned approved
requirements and acceptance criteria for timeout, unavailability, every relied-on
non-success response, and partial completion. It shall declare compensation,
retry, reconciliation, or explicit accepted inconsistency as application
behavior; it shall never claim a shared atomic commit. Framework tests shall be
able to inject generated-client transports and deterministic clocks/signals to
exercise these paths without starting the target service.

### Scope restraint

The module shall add no mandatory service registry, proxy, sidecar, token
exchange, message broker, orchestrator, distributed transaction, saga engine,
circuit breaker, or tracing backend. Architecture validation and service helpers
shall be inert in an ordinary single-service project. Multi-service deployment
coordination remains out of scope; each deployment is independently governed by
SH-F013 when that component is approved.

## Acceptance criteria

- AC-F014-001: Planning records one of the three supported architecture choices
  and the evidence justifying any multi-service choice.
- AC-F014-002: Scaffolding two approved services gives each separate application
  requirements, configuration, API structure, tests, contract output, deployment
  configuration, and Deno KV database.
- AC-F014-003: Static and runtime verification prevent or flag one service's
  direct access to another service's Deno KV database.
- AC-F014-004: A service calls another through its generated typed client using
  the authentication mechanism approved in project requirements.
- AC-F014-005: An outbound service request propagates the request ID and applies
  an explicit deadline and cancellation signal.
- AC-F014-006: Timeout, unavailable dependency, and non-success response behavior
  are documented in requirements and covered by acceptance tests for the caller.
- AC-F014-007: Cross-service operations do not claim atomic commit, and tests
  demonstrate the approved partial-failure behavior.
- AC-F014-008: Each service can run its tests and generate its contract without
  starting unrelated services unless an approved integration test requires them.
- AC-F014-009: A single-service project incurs no required discovery, token
  exchange, orchestration, or distributed infrastructure.

## Out of scope

- Service discovery and coordinated deployment.
- Token exchange or a central identity service.
- Circuit breakers, sagas, event infrastructure, distributed transactions, and
  distributed tracing infrastructure.
- A security sandbox for arbitrary Deno programs that bypass the supported
  framework source, verification, and capability paths.

## Dependencies and assumptions

SH-F001 supplies collision-safe project creation; SH-F005 supplies neutral
authentication and request security; SH-F010 supplies generated HTTP-only
clients; SH-F012 supplies request IDs, configuration, and safe diagnostics.
Planning approval supplies exact service requirement content and rationale. The
initial release supports service-shaped projects and generated clients, not a
microservice platform.

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
- Approved at: 2026-08-07T18:56:35Z.
- Approved criteria: AC-F014-001 through AC-F014-009.
- Governed-content digest:
  `sha256:43b5ede2142d00ecc92d9e5bf40b80d50a41df20738f254c151e220d9bbc93a0`.
- Decision source: owner review; direct response `Approve` after review
  of the requirement path, bounded criteria, standard-risk classification,
  verified SH-F001, SH-F005, SH-F010, and SH-F012 dependencies, supported
  architecture modes, service ownership boundary, generated-client transport,
  and exact governed-content digest.

### Criterion mapping

- Status: mapped to executable tests before implementation.
- AC-F014-001 through AC-F014-009 map one-to-one to the correspondingly named
  tests in `core/services/services_test.ts`.
- Governed test digest:
  `sha256:cb26a0c5fc8d30978d69784a6e1ffcee3124abc675cc39d040271a13b6d6084d`.

### Red-state evidence

- Status: credible red state captured.
- Captured at: 2026-08-07T18:59:21Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F014 requirement, mapped service-kernel tests, Deno task configuration,
  and the previously verified working tree.
- Test digest:
  `sha256:cb26a0c5fc8d30978d69784a6e1ffcee3124abc675cc39d040271a13b6d6084d`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- `deno task check:services` passed.
- `deno task test:services` executed all nine mapped tests; all nine failed only
  at the explicit `SH_SERVICES_NOT_IMPLEMENTED` boundary in
  `core/services/mod.ts`, with no fixture, compilation, permission, dependency,
  or unrelated infrastructure failure.

### Verification

- Status: passed.
- Verified at: 2026-08-07T19:03:56Z.
- Requirement digest:
  `sha256:43b5ede2142d00ecc92d9e5bf40b80d50a41df20738f254c151e220d9bbc93a0`.
- Implementation manifest digest:
  `sha256:d58c8eac91c272b74d12f9b109e5183427fd6cbda7791726093163405d155474`.
- Test digest:
  `sha256:cb26a0c5fc8d30978d69784a6e1ffcee3124abc675cc39d040271a13b6d6084d`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Verifier: Deno `2.9.5` format, lint, type, test, generated-client, and
  filesystem tasks plus the canonical repository and cross-browser website
  verifier on macOS arm64.
- Results: optional services passed 9/9; the complete framework passed 77/77
  with fifteen nested steps; planning passed 10/10; project creation passed
  9/9; repository governance passed 9/9; website structure passed 16/16; links
  passed 1/1; React passed 8/8; TypeScript and production build passed;
  Playwright and Axe passed 66/66 across Chromium, Firefox, and WebKit;
  `git diff --check` passed.
- Residual risks: source-boundary inspection is a supported-path verification
  control rather than a sandbox for arbitrary Deno programs; multi-service
  deployments remain independently governed by unimplemented SH-F013, and
  application-owned requirements remain responsible for concrete recovery
  behavior after classified partial failures.

### Delivery

- Status: not applicable; no commit, push, publication, deployment, or external
  mutation was authorized or attempted.
