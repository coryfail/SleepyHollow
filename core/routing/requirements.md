---
schema: sgad-component/v0.2
id: SH-F002
title: File-based routing runtime
status: verified
risk: standard
source_sections:
  - "6.1"
  - "6.6"
  - "12"
depends_on: []
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# File-based routing runtime

## Purpose

Provide a small, explicit HTTP runtime whose file layout and route behavior are
predictable to humans, agents, and contract tooling.

## In scope

- Static and dynamic file-based routes.
- HTTP method dispatch.
- Explicit route modules and custom handlers.
- Normalized route metadata for downstream tooling.
- Startup-time route discovery and collision diagnostics.

## Requirements

Directory segments below an application's `api/` directory shall map to URL
segments, and dynamic directories such as `[id]` shall map to named path
parameters. Each endpoint directory shall expose one `route.ts` module whose
default export is created with this canonical shape:

```ts
export default defineRoute({
  GET: {
    schemas: { params, query, headers, body, responses },
    security: { authentication: "none" },
    contract: { summary: "Return one bookmark" },
    handler: async (context) => new Response(context.params.id),
  },
});
```

The keys passed to `defineRoute` shall be supported uppercase HTTP methods. Each
method operation shall explicitly provide a handler plus schema, security, and
contract metadata. The framework shall preserve this metadata in the normalized
route inventory without interpreting validation or authorization rules owned by
later components.

The file location shall own the URL path; a route module shall not redeclare a
second path string that can drift from the filesystem. A handler context shall
include the original `Request`, decoded path parameters, and an abort signal.
Later validation, security, and application-context components may add typed
fields without changing route discovery or method dispatch.

Unsupported methods, invalid route-module exports, invalid dynamic segment
names, ambiguous dynamic siblings, and duplicate normalized method/path pairs
shall be detected deterministically before the route inventory can serve
requests. Static siblings shall take precedence over a dynamic sibling at the
same depth.

Unknown paths and unsupported methods shall return RFC 9457 Problem Details as
`application/problem+json`. A method-not-allowed response shall also expose a
deterministically ordered `Allow` header.

The canonical module API shall remain narrow and shall allow purpose-specific
handlers without forcing generated CRUD. Route discovery and dispatch shall not
depend on implicit package scanning or hidden activation.

## Acceptance criteria

- AC-F002-001: A static route module is discovered and invoked for its matching
  path and declared HTTP method.
- AC-F002-002: A dynamic directory segment supplies the decoded path value under
  the declared parameter name.
- AC-F002-003: A request for an unknown route returns the framework's normalized
  not-found response.
- AC-F002-004: A known path with an unsupported method returns the normalized
  method-not-allowed response and advertises allowed methods.
- AC-F002-005: Conflicting route definitions fail startup or validation with a
  diagnostic naming every conflicting file and route.
- AC-F002-006: A custom handler can return behavior not expressible as CRUD while
  retaining schema, security, and contract metadata.
- AC-F002-007: Route discovery produces one deterministic normalized route
  inventory for runtime, verification, and contract generation.
- AC-F002-008: A malformed route module or invalid dynamic segment fails
  discovery with an actionable diagnostic naming the source file and defect.

## Out of scope

- A general-purpose middleware ecosystem.
- Automatic CRUD generation.
- Service discovery or distributed routing.

## Dependencies and assumptions

OPEN-001 is resolved by the `defineRoute` method-map API above. The design keeps
the filesystem as the single path source, makes supported methods visible in one
place, passes schema and security declarations through as metadata for their
owning components, and leaves custom behavior in an explicit handler.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T13:55:31Z.
- Approved criteria: AC-F002-001 through AC-F002-008.
- Governed-content digest:
  `sha256:c6ad75a20d7cac55e53ac59334e15072674147fbc340e0da9658470b5abfb0a6`.
- Decision source: owner review; direct response `Approve` after the
  formatting-only invalidation and both current exact digests were presented.
- Supersedes: the 2026-08-07T12:54:43Z approval recorded below. This entry is
  the governing record and its digest binds the current governed content.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T12:54:43Z.
- Approved criteria: AC-F002-001 through AC-F002-008.
- Governed-content digest:
  `sha256:829cbed532cfb386097f48605344ffe7c30df5df313ab823272da50fde03d104`.
- Decision source: owner review; direct response `Approve` after review of
  the requirement path, bounded criteria, and exact governed-content digest.
- Invalidation: at 2026-08-07T13:52:19Z, an overbroad Deno formatting command
  changed governed Markdown bytes after approval. No behavioral change was
  intended, but the exact-content approval and downstream verification no longer
  bind the current digest. Historical evidence remains preserved below.
  Superseded by the 2026-08-07T13:55:31Z approval above; this entry binds
  content that no longer exists and asserts no authority.

### Criterion mapping

- AC-F002-001 -> `route_test.ts` static discovery and dispatch test.
- AC-F002-001 and AC-F002-004 -> `route_test.ts` static-over-dynamic precedence
  test.
- AC-F002-002 -> `route_test.ts` decoded dynamic-parameter test.
- AC-F002-003 -> `route_test.ts` unknown-path Problem Details test.
- AC-F002-004 -> `route_test.ts` unsupported-method and `Allow` test.
- AC-F002-005 -> `route_test.ts` ambiguous dynamic-route diagnostic test.
- AC-F002-006 -> `route_test.ts` custom behavior and metadata test.
- AC-F002-007 -> `route_test.ts` repeated normalized-inventory test.
- AC-F002-008 -> `route_test.ts` malformed-module and invalid-segment steps.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T13:09:46Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  requirement, mapped tests, fixtures, Deno configuration, and explicit
  nonfunctional routing seam in the working tree.
- Command: `deno task test:routing` using Deno `2.9.5` on macOS arm64.
- Test digest:
  `sha256:35cae292007e1f692cea2ee91ed781f948f99a03d2caa14facb182315fb0be71`.
- Result: 0 passed and 8 failed, including both AC-F002-008 test steps.
- Expected failure: all tests reached the healthy Deno test runner and failed
  because `discoverRoutes` exposed the deliberate `SH_ROUTING_NOT_IMPLEMENTED`
  seam. Conflict and malformed-input assertions consequently observed the same
  missing-behavior error instead of their required diagnostics.
- The test file was subsequently formatted without semantic change. A new
  static-precedence assertion was then added at current test digest
  `sha256:1b437a99bd08c466174b84488ad4fd36577bdf7efa236aa05554a2eae5f0517d`. Its
  focused pre-fix run passed the original eight tests and failed only the new
  assertion because dynamic `POST /users/:id` incorrectly handled
  `POST /users/me` with status `200` instead of the static route's `405`.

### Verification

- Status: passed.
- Verified at: 2026-08-07T13:19:04Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the declared
  working tree.
- Approved requirement digest:
  `sha256:829cbed532cfb386097f48605344ffe7c30df5df313ab823272da50fde03d104`.
- Implementation manifest:
  `working-tree:sha256:2a730817ca9d73a190ee4edc0805490961e8fe7d2e86315a886b3cee06e882b4`
  across `deno.json`, the routing source, tests and fixtures, the repository
  consistency control, and the CI workflow that invokes routing verification.
- Routing verifier: `deno task verify:routing` using Deno `2.9.5`; formatting
  15/15, linting 15/15, type checking, and 9/9 tests with two nested malformed-
  input steps passed.
- Repository verifier: `npm run verify` from `website/`; structural 16/16, links
  1/1, repository consistency 9/9, React 8/8, TypeScript, production build, and
  Playwright/Axe 66/66 across Chromium, Firefox, and WebKit passed.
- CI control: the Pages verification job now installs pinned Deno `2.9.5` and
  runs `deno task verify:routing` before website verification for changes to the
  routing tree or `deno.json`.
- Residual risks: CI has not yet run against this uncommitted branch; dynamic
  import cache invalidation remains owned by the later `hollow dev` component;
  schema interpretation, authorization, and response validation remain owned by
  their approved future components.
- Current status: invalidated by the governed-content byte change recorded
  above; reapproval and revalidation are required.
- Reapproval status: current approval is restored at digest
  `sha256:c6ad75a20d7cac55e53ac59334e15072674147fbc340e0da9658470b5abfb0a6`;
  verification remains pending revalidation.
- Revalidation status: passed.
- Revalidated at: 2026-08-07T13:58:24Z.
- Current approved requirement digest:
  `sha256:c6ad75a20d7cac55e53ac59334e15072674147fbc340e0da9658470b5abfb0a6`.
- Current framework implementation manifest:
  `working-tree:sha256:32709be4cd2166038aee2086cde4309950b85b892b9d76f49d945fd1186f02c5`
  across 28 sorted framework source, fixture, test, configuration, dependency-
  lock, repository-control, and CI files.
- Current routing test digest:
  `sha256:1b437a99bd08c466174b84488ad4fd36577bdf7efa236aa05554a2eae5f0517d`.
- Current verifier: `deno task verify:framework` using Deno `2.9.5`; routing
  formatting 15/15, linting 15/15, type checking, and 9/9 tests with two nested
  malformed-input steps passed. The validation dependency suite also passed.
- Independent repository verifier: `npm run verify` from `website/`; structural
  16/16, links 1/1, repository consistency 9/9, React 8/8, TypeScript and
  production build, and Playwright/Axe 66/66 across Chromium, Firefox, and
  WebKit passed.
- CI control: the Pages verification job installs Deno `2.9.5`, keys its cache
  with `deno.json` and `deno.lock`, and runs `deno task verify:framework` before
  website verification.
- Residual risks: CI has not run against this uncommitted branch; no delivery was
  attempted.
- Shared-manifest revalidation: the approved-scope AC-F003-006 redaction
  hardening changed only validation source and tests after the manifest above.
  Routing remained green at 2026-08-07T14:01:35Z with the same routing test
  digest. The current 28-file framework manifest is
  `working-tree:sha256:941fd4b35f0c4b78b46e2e447381e6572c5547f60a11cab4db784666faf0443f`.
- Final independent current-tree rerun completed by 2026-08-07T14:03:02Z with
  the complete repository verifier results unchanged: 16/16 structural, 1/1
  links, 9/9 repository consistency, 8/8 React, TypeScript/build, and 66/66
  cross-browser accessibility checks passed.
- KV dependency revalidation passed at 2026-08-07T14:19:24Z. Routing remained
  green at 9/9 with two nested steps and the current 37-file framework manifest
  is
  `working-tree:sha256:f7e1e76626c370eefd6b6dd602e4140e6d7bbde16d130e464097a4e9dcedc30f`.

### Known defect, principal narrowing

- Status: open. Recorded rather than repaired.
- Observed at: 2026-08-09T01:33:10Z.
- Symptom: a route handler's `principal` is typed `RoutePrincipal | null`
  regardless of the declared authentication mode. Neither
  `authentication: { mode: "required" }` nor `{ mode: "none" }` narrows it.
  Every authenticated handler therefore needs a null check or assertion that the
  runtime does not require.
- Approved intent is unaffected: SH-F005 already requires a required mode to
  expose its neutral principal and AC-F005-001 requires `principal: null` for an
  explicit `none` decision. Runtime behavior matches that intent. The defect is
  in the type surface only.
- Cause: `SecurityPrincipal<Security>` in `core/routing/types.ts` is written with
  both branches, but `defineRoute` cannot infer its `Security` generic. The
  generic appears only in indexed-access positions, `Security[Method]`, under a
  mapped-type constraint over `keyof Schemas`. Inference falls back to the
  constraint, so neither conditional branch matches. `Schemas` infers correctly
  because its constraint is a plain `MethodMap`, which is why `body` and `query`
  narrow while `principal` does not.
- Repair attempts, all reverted: constraining `Security` to a security-shaped
  map, replacing its constraint with `MethodMap` plus guarded indexed access,
  and restructuring the signature to infer one `Route` generic with a mapped
  parameter type. The third is the most promising direction but needs the
  optional-method handling worked out properly rather than under time pressure.
- Classification: bounded implementation defect within already-approved intent.
  Repairing it requires no amendment and no new approval. It is left open
  deliberately, with the caveat documented in
  `docs/framework/routing.md`, rather than shipped as a partial type change.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
