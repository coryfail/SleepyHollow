---
schema: sleepy-hollow-application/v0.1
title: authentication
status: approved
---

# Authentication example

## Purpose and user goals

Show the smallest complete Sleepy Hollow application whose route requires an
authenticated caller. The `todos` example records authentication as an explicit
`none`, so nothing in the repository demonstrates how a project declares a
provider or what a protected route does with an anonymous request. This example
exists to be that demonstration, and to keep it honest by running.

## Actors and API consumers

One actor: a caller presenting a bearer credential. One consumer: whoever is
reading this example. There is no registration, no session, and no second actor.

## In scope and out of scope

In scope: one greeting route that requires authentication, one security module
declaring one provider, and the project configuration naming that module.

Out of scope: issuing credentials, expiring them, revoking them, storing them,
hashing them, refreshing them, authorization beyond authentication, and every
other identity concern. This example demonstrates the framework's integration
point, not an identity product.

## Resource and data model

None. The greeting is computed from the caller's principal and nothing is
stored, so the example demonstrates security composition without also
demonstrating data access.

## Proposed endpoints and methods

`GET /hello` returns a greeting naming the authenticated caller.

## Relationships and indexes

None. No resource is persisted.

## Request and response conventions

JSON responses. A success carries a `greeting` string.

## Error behavior

RFC 9457 problem details for every failure. `401` when no valid identity is
established, carrying the provider's declared `WWW-Authenticate` challenge.

## Authentication and authorization

Authentication: **required**, by explicit application decision, through a
project-defined provider named `project-auth` and declared in one module the
project names through `securityModule`.

The provider compares a bearer token against a fixed demonstration value held in
source. That is stated plainly rather than disguised, because a reader copying
this example must not mistake it for a credential system. It has no store, no
expiry, no revocation, no rotation, and no protection against a stolen token. A
real application replaces the provider body and keeps the shape.

Authorization: none. Any authenticated caller may read the greeting. The route
declares no authorization guard, so no `403` contract exists.

## Security constraints

The handler runs only after authentication succeeds. A rejected request reveals
nothing beyond the challenge, and no credential value reaches a response, a log,
or a diagnostic.

## Deployment model

One deployable API on Deno Deploy. This example is not intended for deployment;
it exists to be read, run locally, and verified.

## Service architecture

One API. Nothing here justifies independent deployment.

## Cross-cutting acceptance criteria

- AC-APP-001: Every failure response uses RFC 9457 problem details.
- AC-APP-002: The project names its security module explicitly in its
  configuration, and the runtime composes that module rather than discovering it
  by scanning.

## Endpoint inventory and dependencies

`EP-HELLO` owns `/hello` and depends on no other endpoint.

## Open questions, assumptions, and risks

- The demonstration provider is a deliberate simplification and the primary risk
  in this example is that a reader copies it. The application requirement, the
  endpoint requirement, and the module's own source each say so.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T12:23:21Z.
- Approved criteria: AC-APP-001 and AC-APP-002.
- Governed-content digest:
  `sha256:3ed0acee5ce1a5cee6c2160528577c1e2abce1dc76a7e10aeed2b6614de2fe2a`.
- Decision source: Claude conversation; direct response `approve` after review
  of the purpose, the explicit required-authentication decision, the stated
  hazard that the demonstration provider could be copied, the absent data model,
  and the exact governed-content digest.

### Criterion mapping

- AC-APP-001 -> `hello_test.ts` anonymous-refusal test, which asserts the
  rejection through the framework's RFC 9457 problem-details helper.
- AC-APP-002 -> `hello_test.ts` composes the application from the declared
  `securityModule`; the served evidence recorded in `api/hello/requirements.md`
  exercises the same composition through the real development worker.

### Red-state evidence

- Status: inherited from `EP-HELLO`, recorded in `api/hello/requirements.md`.
  Both application criteria are observable only through that endpoint, because
  it is the only endpoint in this application.

### Verification

- Status: passed.
- Verified at: 2026-08-09T16:03:29Z.
- Approved requirement digest:
  `sha256:3ed0acee5ce1a5cee6c2160528577c1e2abce1dc76a7e10aeed2b6614de2fe2a`.
- Command: `deno task verify` from `examples/authentication`.
- Result: 5/5 passed. Every failure response observed was RFC 9457 problem
  details, and the runtime composed the named security module rather than
  discovering it, which the framework proves by failing startup when that module
  cannot be resolved.

### Delivery

- Status: not applicable; this example is not deployed.
