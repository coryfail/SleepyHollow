---
id: EP-HELLO
path: /hello
status: approved
methods:
  - GET
depends_on: []
service: api
---

# Greeting

## Purpose

Return a greeting naming the authenticated caller, so a reader can see a
protected route succeed with a credential and fail without one.

## Source application sections

- Proposed endpoints and methods
- Authentication and authorization

## GET

Return a greeting for the authenticated caller.

## Inputs

No path parameters, no query, and no body. The only input that affects behavior
is the `Authorization` header, which the declared provider reads.

## Success responses

`200` with a JSON object carrying a `greeting` string that names the caller's
principal identifier.

## Errors

`401` with RFC 9457 problem details and the provider's declared
`WWW-Authenticate` challenge when no valid identity is established, whether the
credential is absent, malformed, or unrecognized.

## Security

Authentication: required, through the project-defined `project-auth` provider
declared in the module the project names through `securityModule`. Governed by
AC-APP-002.

Authorization: none. Any authenticated caller may read the greeting, so the
route declares no guard and no `403` contract.

The route declares a `401` response schema, which route normalization requires
of any route declaring required authentication.

## Data access and indexes

None. The handler reads no resource and performs no query.

## Side effects

None. The handler is a pure function of the caller's principal.

## Abuse considerations

No rate-limit policy is declared, because the route has no cost to protect and
this example is not deployed. A rejected request returns the challenge and
nothing else; it does not indicate whether the presented credential resembled a
valid one.

## Dependencies and assumptions

Assumes the framework resolves the declared security module at composition and
fails startup when it cannot, so a request never reaches this route with
authentication unapplied.

## Acceptance criteria

- AC-HELLO-001: A request carrying the recognized credential returns `200` and a
  greeting naming the authenticated caller.
- AC-HELLO-002: A request carrying no credential returns the declared `401`
  problem details with the provider's `WWW-Authenticate` challenge, and the
  handler does not run.
- AC-HELLO-003: A request carrying an unrecognized credential is rejected
  identically to one carrying none, revealing nothing about why it failed.

## Governance record

> Historical verification note: Deno commands in the archived entries below
> describe the pre-Node/Bun example. They are retained as audit history only;
> use the example's Node/Vitest package scripts and framework 0.3.5 CLI for
> current reproduction.

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T12:23:21Z.
- Approved criteria: AC-HELLO-001, AC-HELLO-002, AC-HELLO-003.
- Notation correction, 2026-08-09: this entry originally read
  `AC-HELLO-001 through AC-HELLO-003`. SH-F006 requires an approval to name
  the bounded criteria it approves, and a range names only its endpoints, so
  `hollow check` correctly reported the approval as not covering
  AC-HELLO-002. The approved decision, its scope, and the governed-content
  digest are unchanged; only the expression of the same three criteria is.
- Governed-content digest:
  `sha256:379cc80c8f1fc8e1d2d9a2665783e0fc5fca724c5eaeebd55a4d8d16f51187f6`.
- Decision source: owner review; direct response `approve` after review
  of the required authentication mode, the declared 401 contract and challenge,
  the absence of an authorization guard, the indistinguishable rejection of an
  absent and an unrecognized credential, and the exact governed-content digest.

### Criterion mapping

- AC-HELLO-001 -> `hello_test.ts` recognized-credential greeting test.
- AC-HELLO-002 -> `hello_test.ts` anonymous-refusal test.
- AC-HELLO-003 -> `hello_test.ts` unrecognized-credential parity test.
- Each test builds the application from real route discovery and composed
  security rather than calling the handler, because the handler is precisely the
  code that must not run for an unauthenticated caller. The discovered handler
  is wrapped in a counter so "the handler does not run" is observed rather than
  inferred from the response body.
- Governed test digest:
  `sha256:15df4722ba4176b2d35eda054907f10eae945981760362dde6cc79f9f49b5652`.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-09T15:58Z.
- Base revision: `af1a724` plus the approved requirements, the scaffold produced
  by `hollow create authentication`, and the three mapped tests.
- Commands: `deno check .` and `deno task test` using Deno `2.9.5` on macOS
  arm64, from `examples/authentication`.
- Result: type checking passed and the project's own suite passed 2/5. All three
  criterion tests failed; the two scaffold tests continued to pass.
- Expected failure: every criterion reached the healthy runner and failed at
  `SH_SECURITY_MODULE_UNRESOLVED`, because the approved `security.ts` did not
  exist yet. No compilation, permission, dependency, or unrelated failure
  obscured the missing approved behavior.
- Broken-baseline note: an earlier attempt failed `deno check` because the test's
  handler wrapper mistyped its context parameter. That is a broken baseline, not
  red evidence, so it was repaired and the run above was captured afterward.

### Verification

- Status: passed.
- Verified at: 2026-08-09T16:03:29Z.
- Approved requirement digest:
  `sha256:379cc80c8f1fc8e1d2d9a2665783e0fc5fca724c5eaeebd55a4d8d16f51187f6`.
- Current test digest:
  `sha256:15df4722ba4176b2d35eda054907f10eae945981760362dde6cc79f9f49b5652`.
- Command: `deno task verify` from `examples/authentication`, covering
  formatting, linting, type checking, the project's own tests, and the scaffold
  structure verifier.
- Result: 5/5 passed, including all three criteria. No prior behavior regressed.
- Served evidence beyond the mapped tests: the real development worker served
  this project on loopback. `GET /hello` with no credential returned `401` with
  `WWW-Authenticate: Bearer realm="authentication-example"` and an RFC 9457 body;
  an unrecognized credential returned the same `401`; the recognized credential
  returned `200` with `{"greeting":"Hello, demo-caller"}`. A deliberately
  distinctive wrong token appeared nowhere in the rejected response.
- Residual risk: the provider is a demonstration and is labeled as one in the
  application requirement, this requirement, `security.ts`, and the README. That
  labeling is the only control against a reader copying it.

### Delivery

- Status: not applicable; this example is not deployed.
