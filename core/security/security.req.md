---
schema: sgad-component/v0.2
id: SH-F005
title: Security and authorization boundaries
status: approved
risk: high
source_sections:
  - "7"
  - "8"
depends_on:
  - SH-F002
  - SH-F003
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Security and authorization boundaries

## Purpose

Provide broadly safe HTTP defaults and neutral integration points without
turning Sleepy Hollow into an identity product or imposing authentication on
public applications.

## In scope

- Neutral `AuthProvider` and `Principal` compatibility boundaries.
- Explicit per-route authentication and authorization declarations.
- Secure headers, production CORS, request limits, and configurable rate limits.
- Secret and credential redaction.
- Verification metadata for required guards and protections.

## Requirements

Applications may explicitly choose no authentication, project-defined user
authentication, an external identity provider, API keys, signed bearer tokens,
service credentials, or another reviewed mechanism. The framework shall not ship
a mandatory built-in identity model in the first release.

OPEN-007 is resolved with this neutral compatibility boundary:

```ts
interface Principal {
  readonly id: string;
  readonly type: string;
  readonly claims?: Readonly<Record<string, unknown>>;
}

interface AuthProvider {
  readonly challenge: string;
  authenticate(request: Request): Promise<Principal | null>;
}
```

A provider returning `null` shall mean that no valid identity was established. A
principal shall require non-empty `id` and `type` values. Provider exceptions
and malformed principals shall become safe internal failures and diagnostics;
they shall not be misreported as attacker-controlled authentication failures or
expose provider details.

Each route shall declare exactly one authentication mode:

```ts
type RouteSecurity = {
  readonly authentication:
    | { mode: "none" }
    | {
      mode: "required";
      provider: "project-auth";
      requirementId: "AC-APP-014";
    };
  readonly authorization?: {
    name: "can-read-bookmark";
    requirementId: "AC-APP-015";
    guard: ({ principal, request, params }) => boolean | Promise<boolean>;
  };
  readonly rateLimit?: "standard-api";
};
```

An authentication mode of `none` shall not invoke a provider and shall expose a
`null` principal. A required mode shall resolve the named provider and expose
its neutral principal to the authorization guard and handler without changing
business-logic parameters. Missing or invalid identity shall return safe RFC
9457 `401` Problem Details plus the provider's declared `WWW-Authenticate`
challenge. A denied guard shall return safe RFC 9457 `403` Problem Details.
Authentication, then authorization, shall complete before protected handler side
effects. A required route shall declare a `401` response schema, and a route
with an authorization guard shall declare a `403` response schema. A
rate-limited route shall declare `429` and fail-closed `503` response schemas.
Route normalization shall fail with actionable diagnostics when a required
security response contract is absent.

`createSecurityRouter(routes, options)` shall validate security configuration at
startup, preserve normalized route metadata, and provide the request runtime.
Its mode shall be explicit as `development`, `test`, or `production`. A named
provider, guard, or rate-limit policy referenced by a route shall be present and
well formed before serving begins. Normalized security metadata shall identify
the route, source file, authentication mode and provider, guard name, governing
requirement IDs, rate-limit policy, CORS mode, and enabled defaults so the later
independent verifier can compare implementation with approved requirements.

Production CORS shall be an explicit closed decision, either `{ mode: "deny" }`
or an allow configuration with exact origins or the non-credentialed `*`
wildcard, allowed methods, allowed headers, and a credentials decision. A
credentialed wildcard shall fail startup. Allowlisted responses shall echo only
an exact approved origin and include `Vary: Origin`; disallowed origins shall
receive no access-control grant. Preflight shall be answered only for a known
path and allowed requested method. Missing production CORS configuration,
malformed origins, or unresolved security policy shall fail startup with human
and machine-readable diagnostics.

Every response, including framework errors, shall receive
`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, a restrictive
API `Content-Security-Policy` of `default-src 'none'; frame-ancestors 'none'`,
and an `X-Request-Id`. A caller-supplied request ID shall be accepted only when
it matches `[A-Za-z0-9._:-]{1,128}`; otherwise the runtime shall generate a
UUID. The selected request ID shall be exposed to the handler and returned on
the response. Problem responses for `401`, `403`, and `429` shall use
`Cache-Control: no-store`.

OPEN-008 is resolved through a pluggable fixed-window boundary. A route names a
policy whose positive integer `limit` and `windowMs`, key function, and
`RateLimiter` are supplied at startup. A produced key shall match
`[A-Za-z0-9._:-]{1,256}` and shall not contain raw credentials.
`createMemoryRateLimiter({ maxKeys, clock })` shall provide deterministic
development and test behavior with bounded key cardinality and
`scope: "process"`. It shall evict expired windows before admitting a new key
and fail closed when the active-key bound is exhausted. Production shall reject
a declared route policy backed by a process-scoped limiter when the deployment
plan permits multiple application instances. A production adapter must
declare `scope: "shared"`; the framework shall not pretend that process memory
is a global quota.

Rate limiting shall run before authentication and handler side effects. An
allowed decision shall continue and expose remaining/reset metadata internally.
A rejected decision shall return RFC 9457 `429` Problem Details, `Retry-After`
as an integer number of seconds, and `Cache-Control: no-store`. The framework
shall not emit the evolving IETF `RateLimit` fields as stable contract fields in
this release. A declared limiter failure shall fail closed with safe RFC 9457
`503` Problem Details, no-store behavior, and an internal diagnostic rather than
silently disabling the policy. Rate limiting is an application quota control,
not a denial-of-service guarantee.

`redactSecurityData(value)` shall recursively replace values whose field names
identify authorization, cookies, tokens, secrets, passwords, sessions, API keys,
or credentials. It shall be cycle-safe, shall not serialize request bodies or
complete request headers by default, and shall preserve safe structural context
for diagnostics. Framework-generated authentication, authorization, rate-limit,
CORS, and provider diagnostics shall use stable codes and safe corrections
without raw credentials or rejected secret values.

Body limits remain owned by SH-F003, and bounded/index-compatible data access
remains owned by SH-F004. This component shall expose those protections in
verification metadata rather than reimplementing them.

### Project security declaration

A project shall declare its authentication providers, rate-limit policies, and
CORS configuration in one module whose default export is produced by
`defineSecurity`, and shall name that module explicitly through a
`securityModule` value in its SH-F001 project configuration.

Discovery is explicit rather than conventional. The application specification
rejects hiding application behavior in implicit scanning or magic activation,
and whether an API is protected must not depend on a file silently appearing or
disappearing. Routes are discovered from the filesystem because the filesystem
is the routing table; security wiring has no such justification.

A project that names no `securityModule` declares no providers. A project that
names one which cannot be resolved fails composition rather than continuing
without it. That is a valid state for an application whose routes all declare
`authentication: "none"`, and it is a failure for any route declaring a required
mode, because a required route without a resolvable provider cannot authenticate
anyone. The failure shall be reported when the runtime is composed rather than
on the first request.

`defineSecurity` shall freeze and return its declaration so a caller cannot
mutate provider wiring after composition.

## Acceptance criteria

- AC-F005-001: An application with an explicit `none` authentication decision
  runs without an authentication provider or fabricated principal and exposes
  `principal: null` to its handler.
- AC-F005-002: A project-defined provider can authenticate a request into the
  validated neutral principal shape without changing route business logic.
- AC-F005-003: A protected route rejects a missing or invalid identity with its
  declared RFC 9457 `401` behavior and `WWW-Authenticate` challenge.
- AC-F005-004: An authenticated principal lacking permission receives the
  route's declared RFC 9457 `403` behavior.
- AC-F005-005: A declared authorization guard runs before protected handler side
  effects.
- AC-F005-006: Production startup fails with an actionable diagnostic when CORS
  is missing, credentials are combined with a wildcard, a process-local limiter
  protects a production route, or another required security setting is
  unresolved; exact-origin CORS and known preflight behavior succeed.
- AC-F005-007: Default logs and diagnostics redact secrets, authorization
  headers, cookies, session material, and raw credentials, including nested and
  cyclic diagnostic input.
- AC-F005-008: Configured rate limiting produces deterministic allow and reject
  behavior before handler side effects and returns safe RFC 9457 `429`, integer
  `Retry-After`, and no-store behavior without presenting process-local state as
  a production-global quota.
- AC-F005-009: Route metadata lets independent verification detect when approved
  requirements demand protection but no corresponding authentication provider,
  authorization guard, response contract, or rate-limit policy is configured.
- AC-F005-010: No framework API requires email/password, sessions, JWTs, OIDC,
  API keys, or another single authentication model for every project.
- AC-F005-011: Successful and rejected responses carry secure API headers and a
  validated or generated request ID without reflecting secret request material.
- AC-F005-012: A module named by `securityModule` whose default export is
  produced by `defineSecurity` supplies the providers, rate limits, and CORS
  used to compose the runtime, and the returned declaration is frozen.
- AC-F005-013: A project naming no `securityModule` composes successfully when
  every route declares `authentication: "none"`, and a named module that cannot
  be resolved fails composition with the named path.
- AC-F005-014: A route declaring a required authentication mode with no
  resolvable provider fails when the runtime is composed, naming the route and
  the missing provider, rather than failing on the first request.

## Out of scope

- Built-in email/password, passwordless, social-login, or OIDC products.
- Custom cryptographic protocols or credential stores.
- Centralized identity and token exchange for services.
- Distributed denial-of-service prevention or a built-in globally shared
  production rate-limit store.
- CSRF protection for a project-selected cookie/session mechanism; affected
  applications must specify and test it with their authentication design.

## Dependencies and assumptions

Authentication, credential lifecycle, CSRF, and permission semantics remain
application requirements. The framework trusts an injected provider only at its
boundary and validates the returned neutral shape. The process-local limiter is
appropriate only for deterministic tests, local development, and explicitly
single-process environments. A shared limiter's correctness and availability
remain the adapter owner's responsibility. Multi-instance deployments use
isolated process memory, so process memory is not a production-global
security boundary.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T02:14:08Z.
- Approved criteria: AC-F005-001 through AC-F005-014.
- Governed-content digest:
  `sha256:0150867cffe2398f2b598c71874ab5efc325a332ce54da1e87fe6a3352f6fd90`.
- Decision source: owner review; direct response `Approved` after review
  of the project security declaration, the explicit `securityModule` naming that
  replaces convention-based discovery, composition-time failure for a required
  route with no resolvable provider, the three amended criteria, and the exact
  governed-content digest.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T14:40:15Z.
- Approved criteria: AC-F005-001 through AC-F005-011.
- Governed-content digest:
  `sha256:4eb04f57e6fdc65d3ed42b96f790286b069644daf1fdb4038bca9c5ea22fd017`.
- Decision source: owner review; direct response `Approved` after review
  of the requirement path, bounded criteria, high-risk classification,
  dependencies, resolved OPEN-007 and OPEN-008 designs, and exact governed-
  content digest.

### Criterion mapping

- AC-F005-001 -> `security_test.ts` explicit unauthenticated-route test;
  `type_test.ts` compile-time null-principal assertion.
- AC-F005-002 -> `security_test.ts` neutral project-provider integration test;
  `type_test.ts` compile-time authenticated-principal assertion.
- AC-F005-003 -> `security_test.ts` missing-identity Problem Details and
  challenge test.
- AC-F005-004 -> `security_test.ts` denied-authorization Problem Details test.
- AC-F005-005 -> `security_test.ts` rate-limit, authentication, authorization,
  and handler ordering test.
- AC-F005-006 -> `security_test.ts` production startup and exact-origin CORS
  test.
- AC-F005-007 -> `security_test.ts` nested, cyclic, request, and diagnostic
  redaction test.
- AC-F005-008 -> `security_test.ts` deterministic fixed-window, bounded-key,
  fail-closed, and production-scope test.
- AC-F005-009 -> `security_test.ts` startup contract diagnostics and normalized
  protection-metadata test.
- AC-F005-010 -> `security_test.ts` neutral public API surface test.
- AC-F005-011 -> `security_test.ts` successful and rejected secure-header and
  request-ID test.
- AC-F005-012 -> `security_test.ts` declared security module composition and
  frozen declaration test.
- AC-F005-013 -> `security_test.ts` absent and unresolvable module test.
- AC-F005-014 -> `security_test.ts` composition-time unresolved provider test.

### Red-state evidence, security composition amendment

- Status: failed as expected.
- Observed at: 2026-08-09T02:19:00Z.
- Base revision: `acf8dce4f89517ac22fecbda637199899ff5cbad` plus the approved
  SH-F005 amendment, the three mapped tests, and the typed
  `defineSecurity`/`composeProjectSecurity` seam in
  `core/security/declaration.ts`.
- Commands: `deno task check:security` and `deno task test:security` using Deno
  `2.9.5` on macOS arm64.
- Runtime-test digest:
  `sha256:3ff24e0075eed47ef4be020d4da809ae3e712b0007ba60de7b0ae297e52c2c65`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Result: type checking passed; security passed 11/14 with six nested steps.
  AC-F005-012, AC-F005-013, and AC-F005-014 failed and the eleven previously
  verified criteria continued to pass.
- Expected failure: each new criterion reached the healthy Deno runner and
  failed only through the explicit `SH_SECURITY_NOT_IMPLEMENTED` seam.
  AC-F005-012 and AC-F005-013 failed at the seam itself; AC-F005-014 reached the
  seam's error and failed its content assertion because the seam names no route
  or provider. No compilation, dependency, permission, or unrelated regression
  failure obscured the missing approved behavior.

### Verification, security composition amendment

- Status: passed.
- Verified at: 2026-08-09T11:07:55Z.
- Approved requirement digest:
  `sha256:0150867cffe2398f2b598c71874ab5efc325a332ce54da1e87fe6a3352f6fd90`.
- Current runtime-test digest:
  `sha256:3ff24e0075eed47ef4be020d4da809ae3e712b0007ba60de7b0ae297e52c2c65`.
- Command: `deno task verify:security` using Deno `2.9.5` on macOS arm64.
- Result: formatting, linting, and type checking passed; security passed 14/14
  with six nested steps. No prior criterion regressed.
- Verified behavior adds `defineSecurity`, which freezes the declaration and its
  provider and rate-limit records, and `composeProjectSecurity`, which resolves
  a project-relative `securityModule`, rejects an absolute or escaping path,
  reports an unresolvable module by the name the project declared, validates the
  default export's provider, rate-limit, and CORS shapes, and delegates to
  `createSecurityRouter` so a required route with no resolvable provider fails
  at composition rather than on the first request.
- Residual boundary: the module is resolved by dynamic import through an
  injectable loader. Whether a project's security module itself is well designed
  remains an application concern, unchanged by this amendment.
- Independent verifier state: the canonical `npm run verify` from `website/`
  passed in full at 2026-08-09T11:36:00Z on top of commit `8a12f01`: structural
  16/16, links 1/1, repository consistency 9/9, React 8/8, TypeScript and
  production build, and Playwright/Axe 66/66 across Chromium, Firefox, and
  WebKit. The AC-REPO-001 endpoint-kind defect that previously withheld this
  projection is repaired, so the status is now `verified`.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T14:45:45Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F005 requirement, mapped security tests, typed nonfunctional seam, pinned
  dependency lock, Deno configuration, and previously verified framework working
  tree.
- Commands: `deno task check:security`, `deno task test:routing`,
  `deno task test:validation`, and `deno task test:security` using Deno `2.9.5`
  on macOS arm64.
- Runtime-test digest:
  `sha256:0df62a199688b80712be0f5b75d324085422c5f92da2595656f137d8d3007260`.
- Compile-time-test digest:
  `sha256:d785f046b648dde3964245e21baaaea79cc1333ab114c82e8c08a42c14a1c176`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Result: security type checking passed, verified routing passed 9/9 with two
  nested steps, verified validation passed 10/10 with two nested steps, and
  security passed 0/11 with three nested CORS steps.
- Expected failure: every security criterion reached the healthy Deno runner and
  failed only through the explicit `SH_SECURITY_NOT_IMPLEMENTED` seams in
  `createSecurityRouter`, `createMemoryRateLimiter`, or `redactSecurityData`; no
  dependency, assertion-runner, permission, or unrelated regression failure
  obscured the missing approved behavior.
- Test-evolution note: the runtime suite was strengthened before final
  verification with process-scope production, fail-closed adapter, raw API-key,
  malformed runtime configuration, malformed principal, and request-ID generator
  checks. At 2026-08-07T14:52:15Z, the strengthened suite digest
  `sha256:b0d0db98fc0ec88b020e7b9cbe244321eec8625c52d81e77b0aa42ef8cd80e7c`
  produced a focused adversarial red state: 8/11 criteria passed, while
  AC-F005-006, AC-F005-008, and AC-F005-011 failed on four missing protections.
  The failures were an unvalidated explicit mode, a non-actionable malformed
  CORS exception, acceptance of a raw `x-api-key` as a quota key, and an
  uncaught request-ID generator exception. This evidence occurred before the
  corresponding implementation corrections and is preserved rather than
  rewriting the original all-seam red run.
- A final CORS contract audit at 2026-08-07T14:56:02Z added rejected-preflight
  assertions to the current runtime-test digest recorded below. The suite then
  passed 10/11 criteria and failed AC-F005-006 because an unknown-path or
  disallowed-method preflight inherited a normal-response CORS grant. That
  focused red state preceded the correction that suppresses access-control
  headers for every preflight not accepted by the known-route policy.

### Verification

- Status: passed.
- Verified at: 2026-08-07T14:56:52Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the declared
  working tree.
- Approved requirement digest:
  `sha256:4eb04f57e6fdc65d3ed42b96f790286b069644daf1fdb4038bca9c5ea22fd017`.
- Framework implementation manifest:
  `working-tree:sha256:0831c0a1254252c07acc336837f0e8179e6ff7017d7d1b11d12c00f9977f1d53`
  across 45 sorted routing, validation, KV, and security source, fixture, test,
  configuration, dependency-lock, repository-control, and CI files. Each record
  is `<relative-path>\0<file-sha256>\n` before hashing the sorted stream.
- Current runtime-test digest:
  `sha256:15cf88ac4978e5124d70fea3000d16bcd6647864a05883c1fdd348fee5afae33`.
- Current compile-time-test digest:
  `sha256:d785f046b648dde3964245e21baaaea79cc1333ab114c82e8c08a42c14a1c176`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Commands: `deno task verify:security`, `deno task verify:framework`,
  `git diff --check`, and the canonical `npm run verify` from `website/`.
- Framework results: formatting, linting, and type checking passed; routing
  passed 9/9 with two nested steps, validation passed 10/10 with two nested
  steps, KV passed 9/9, and security passed 11/11 with six nested steps.
- Independent repository results: structural 16/16, links 1/1, repository
  consistency 9/9, React 8/8, TypeScript/build, and Playwright/Axe 66/66 across
  Chromium, Firefox, and WebKit passed. The unchanged repository-consistency
  test digest is
  `sha256:a909a928e37ea21a2f7af88604948f97fc9afbf162d4eef24c73929fa96215d6`.
- Verified behavior includes neutral required and none authentication modes,
  provider and guard ordering, declared 401/403 contracts, production CORS
  closure, secure headers and request IDs on success and error responses,
  recursive credential redaction, fixed-window bounds, 429 retry behavior,
  fail-closed 503 behavior, production shared-scope enforcement, and normalized
  protection metadata.
- Residual boundaries are explicit approved exclusions: the framework supplies
  no built-in identity product, credential store, cryptographic protocol,
  globally shared limiter implementation, DDoS guarantee, or generic CSRF
  mechanism. No commit, push, deployment, or other delivery was performed.

### Delivery

- Status: not applicable until delivery is authorized and attempted.

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: all acceptance criteria currently owned by SH-F005.
- Governed-content digest:
  `sha256:4f7fb4aacfcc68a24ae651d6c87da654e0f4d4e6a784a99288f0a582fd34770a`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.
