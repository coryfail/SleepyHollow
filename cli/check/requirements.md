---
schema: sgad-component/v0.2
id: SH-F008
title: Independent verification
status: verified
risk: standard
source_sections:
  - "3.6"
  - "8"
  - "10"
  - "11.2"
  - "11.3"
depends_on:
  - SH-F002
  - SH-F019
  - SH-F003
  - SH-F004
  - SH-F005
  - SH-F006
  - SH-F007
open_decisions:
  - OPEN-006
owners:
  - Sleepy Hollow maintainers
---

# Independent verification

## Purpose

Make `hollow check` an independent trust boundary that verifies agent and human
work from repository evidence rather than accepting an implementation process's
claim of completion.

## In scope

- Deterministic whole-project and safely targeted verification through
  `hollow check`.
- Bounded type checking and native Deno test execution.
- Exact approval, red-state, implementation, and requirements-to-test evidence.
- Route, method, schema, security, index, query-bound, and concurrency checks.
- OpenAPI, documentation, generated-client, and manifest consistency.
- Pending data decisions and supported breaking-contract change checks.
- Human-readable and versioned structured results from one normalized outcome.

## Requirements

### Command and trust boundary

The supported command surface shall be:

```text
hollow check [--full | --requirement <id> | --route <METHOD> <path>] [--json]
```

No scope flag means `--full`. Scope flags are mutually exclusive. Unknown flags,
missing values, an unsafe project root, or an unresolved requirement or route
shall return usage status `2` without running partial verification. A completed
verification returns `0` only when every required check passes and `1` when any
verification or bounded runner check fails.

`hollow check` shall be independent of the official skill and of endpoint source
claims. It shall derive one normalized `VerificationInventory` from the current
project's requirement bytes and embedded governance records, discovered and
normalized routes and schemas, normalized security/configuration/KV/service
metadata, test manifest and execution results, red-state evidence, generated
artifacts, previous reviewed contracts and data-change records, and fixed
repository policy. Agent prose, source comments, endpoint completion metadata,
editable `status`, and a producer-supplied `passed` boolean are not check inputs.

The verifier shall never write requirements, change lifecycle status, rewrite
tests or generated artifacts, accept a contract/data change, or repair source.
It reports whether the current evidence is eligible for a separate governance
transition. Check mode shall not modify project files; temporary runner output
shall be isolated and removed.

### Scope and impact analysis

OPEN-006 is resolved by SH-F007's deterministic bidirectional dependency closure.
`--requirement` shall select the named requirement plus the transitive
requirements and tests that depend on it or that it depends on. `--route` shall
resolve all implemented operations at that normalized path to their owning
requirements and apply the same closure. Ownership ambiguity, an incomplete or
cyclic graph, shared configuration/security/data/generated-artifact changes, a
removed route, or a check that cannot be partitioned safely shall escalate to
the complete applicable project check.

Escalation is a successful scoping decision, not a bypass. Human and JSON results
shall identify `requestedScope`, `effectiveScope`, selected requirement and test
IDs, and stable `SH_CHECK_SCOPE_ESCALATED` reasons. No selected dependency may be
silently omitted, and an endpoint-local pass shall not make an unselected
application claim.

### Fixed verification pipeline

The built-in registry shall execute these phases in stable order and shall not
allow project metadata to disable, replace, reorder, or mark them successful:

1. repository and governance structure, including exact current approval
   digests, bounded approved criteria, dependency resolution, credible red-state
   evidence, and status honesty;
2. type-check runner and native Deno criterion-test runner health;
3. bidirectional SH-F007 traceability, unchanged governed test mappings, and all
   selected mapped test results;
4. approved endpoint path/method inventory against SH-F002 discovery, with no
   requirements-only or implementation-only operation;
5. SH-F003 request-location, response-status, media-type, and normalized schema
   coverage for every operation;
6. SH-F005 authentication, authorization-requirement ID, rate-limit, CORS, and
   production-safety consistency with approved endpoint/application decisions;
7. SH-F004 data-operation metadata, requiring a declared compatible index and
   positive bound for collection access, versionstamp/atomic semantics for
   read-modify-write, approved justification for raw access, and no SH-F014
   foreign-service KV capability;
8. SH-F012 configuration and operational metadata without resolving or exposing
   secret values;
9. SH-F010 regeneration in no-write check mode plus supported breaking-change
   analysis against the last reviewed OpenAPI contract; and
10. pending data/contract decisions and verification-eligibility synthesis.

A phase may consume only normalized metadata exposed by its owning verified
component or explicitly versioned evidence defined here. It shall not infer a
pass from arbitrary implementation text. Where framework escape-hatch source
cannot supply required normalized safety metadata, verification fails with the
missing evidence rather than guessing. Additive contract findings may be
reported without failure; every SH-F010 breaking finding fails until its exact
change is present in a reviewed change record bound to the prior and current
contract digests. Pending, mismatched, or value-bearing data-change records fail.

Route/method drift, schema gaps, missing criterion coverage, skipped or failing
mapped tests, removed/changed/weakened governed tests, incompatible or unbounded
data access, unsafe read-modify-write, missing required authorization, invalid
production security/configuration, stale generated artifacts, unresolved
service ownership, and unreviewed breaking changes are always errors. A
requirement is eligible only if its approval and red evidence are current, all
selected criteria and integration checks pass, and no applicable error remains.

### Runners and resource safety

The CLI shall launch the pinned Deno executable directly without a shell, using
sorted explicit source/test paths discovered under canonical project roots,
frozen lockfile behavior, and cached dependencies only. It shall not execute an
arbitrary task or command string from project source. Tests run from the project
root with no network permission by default and only the bounded read, write, run,
environment-key-name, hostname, and unstable-KV capabilities explicitly declared
by typed verification configuration. Broad environment access, an unrestricted
network flag, and permission values outside the project root shall fail before
process launch. Command, timeout, permission, startup, nonzero exit, malformed
structured event, and output-limit failures are verification errors rather than
skipped evidence.

Each runner shall have a configurable project timeout bounded to at most ten
minutes, terminate its child on expiry or caller cancellation, and cap retained
stdout and stderr to one MiB per stream. Diagnostics shall recursively apply
SH-F005/SH-F012 redaction and shall not include environment values, credentials,
request bodies, arbitrary stack traces, or unbounded child output. Deterministic
unit tests may inject a runner; production verification uses the direct Deno
runner.

### Result and diagnostics contract

Human and JSON rendering shall derive from one immutable result. JSON shall have
schema `sleepy-hollow-check-result/v1` and stable top-level fields: `ok`,
`command`, `projectRoot` as a safe project-relative display value,
`requestedScope`, `effectiveScope`, `selectedRequirements`, `selectedTests`,
`checks`, `diagnostics`, and `summary`. Each check shall name its stable ID,
phase, status (`passed`, `failed`, or `skipped` only when inapplicable), duration,
and evidence references without secret values.

Every diagnostic shall include a stable code, `error` or `warning` severity,
phase, summary, at least one safe location or evidence reference, and correction
guidance. Locations may identify a project-relative file, normalized route,
requirement ID, criterion ID, schema field, index/data operation, or configuration
key. Diagnostics, selected IDs, checks, and evidence references shall be
deterministically sorted so repeated checks of unchanged inputs produce the same
semantic result; durations are observational and excluded from equality or
eligibility decisions.

### Observed-coverage verification

Verification shall treat a route that carries approved acceptance criteria but
that runtime capture never observed as a failure. A criterion mapped to a
passing test asserts that the test covers that behavior; capture showing the
route was never reached proves the mapping is false, and reporting it as a
warning would let a test that never exercises its handler read as verification.

A criterion mapped to a passing test that produced no route observation shall
not fail on that basis alone, because a criterion may legitimately be verified
below the transport boundary. Only a route with approved criteria and no
observation at all fails.

An uncaptured route may be accepted only with a recorded justification, which
shall appear in the verification result so the exception is visible rather than
silent.

A capture artifact that is missing, stale, or unreadable shall fail
verification rather than being treated as an absence of findings.

## Acceptance criteria

- AC-F008-001: `hollow check` returns success for a conforming project and a
  nonzero status when any required check fails.
- AC-F008-002: Human output summarizes failures and names their affected files,
  routes, requirements, criteria, or configuration keys.
- AC-F008-003: `hollow check --json` emits a versioned structure with stable
  diagnostic codes, severity, location, evidence, and safe correction guidance.
- AC-F008-004: A route or method that differs from its approved requirement
  causes verification to fail.
- AC-F008-005: Missing request or response schema coverage causes verification to
  fail and identifies the uncovered boundary.
- AC-F008-006: Missing criterion mapping or a failing mapped test prevents
  `verified` status.
- AC-F008-007: An unbounded query, incompatible index, or unsafe read-modify-write
  pattern is detected with the affected data operation.
- AC-F008-008: A protected requirement without its declared authorization guard
  causes verification to fail.
- AC-F008-009: Stale OpenAPI or client output and supported breaking contract
  changes are detected before release.
- AC-F008-010: Endpoint-local verification includes affected shared dependencies
  or clearly escalates to the full check when safe impact analysis is impossible.
- AC-F008-011: The verifier cannot mark its own failing checks successful through
  endpoint source metadata or an agent-authored completion message.
- AC-F008-012: A route carrying approved acceptance criteria that capture never
  observed fails verification and names the unobserved route.
- AC-F008-013: A criterion mapped to a passing test with no route observation
  does not fail on that basis alone.
- AC-F008-014: An uncaptured route accompanied by a recorded justification
  passes, and the justification appears in the verification result.
- AC-F008-015: A missing, stale, or unreadable capture artifact fails
  verification rather than reporting no findings.

## Out of scope

- Proving unspecified product behavior.
- Silently applying destructive data or contract changes.
- Treating a passing check result as approval authority or editing a requirement
  to `verified`.
- Executing a shell, downloading dependencies, granting undeclared network
  access, or accepting arbitrary project-defined verifier plugins.
- General-purpose TypeScript theorem proving or sandboxing arbitrary code that
  bypasses the supported framework metadata paths.

## Dependencies and assumptions

SH-F002 through SH-F007 expose normalized route, schema, data, security,
planning, test, red-state, and dependency evidence. SH-F010 provides deterministic
artifact check and breaking-change analysis; SH-F012 supplies safe configuration
and redaction; SH-F014 supplies optional service ownership checks. OPEN-006 is
resolved by fail-closed bidirectional dependency closure with full-check
escalation when ownership or partition safety is uncertain.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T17:34:18Z.
- Approved criteria: AC-F008-001 through AC-F008-015.
- Governed-content digest:
  `sha256:4a47c5ea70b224e24502cc74dfb868a4853c395428489879f53a885953b26a62`.
- Decision source: Claude conversation; direct response `Approve` after review
  of fail-closed verification of observed coverage with a recorded-justification exception, and the exact governed-content digest.

### Superseded approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T19:07:43Z.
- Approved criteria: AC-F008-001 through AC-F008-011.
- Governed-content digest:
  `sha256:f1940f8e137a319adfc66d7e8b2341fba0f3748c6387ff3d24354c72fce606a8`.
- Decision source: Codex conversation; direct response `Approve` after review
  of the requirement path, bounded criteria, standard-risk classification,
  verified SH-F002 through SH-F007 dependencies, fixed independent check
  registry, fail-closed targeted scope, deterministic result contract, bounded
  runner behavior, and exact governed-content digest.

### Criterion mapping

- Status: mapped to executable tests before implementation.
- AC-F008-001 through AC-F008-011 map one-to-one to the correspondingly named
  tests in `cli/check/check_test.ts`.
- Governed test digest:
  `sha256:4d24521cbaa147007573346986aef72ae31a30a111a14865ea17fcd47393e58d`.

### Red-state evidence

- Status: credible red state captured.
- Captured at: 2026-08-07T19:10:21Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F008 requirement, mapped verifier tests, Deno task configuration, and the
  previously verified working tree.
- Test digest:
  `sha256:4d24521cbaa147007573346986aef72ae31a30a111a14865ea17fcd47393e58d`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- `deno task check:check` passed.
- `deno task test:check` executed all eleven mapped tests; all eleven failed
  only at the explicit `SH_CHECK_NOT_IMPLEMENTED` boundary in
  `cli/check/mod.ts`, with no fixture, compilation, permission, dependency, or
  unrelated infrastructure failure.

### Verification, observed-coverage amendment

- Status: passed for all fifteen approved criteria.
- Verified at: 2026-08-08T17:43:33Z.
- Command: `deno task verify:check`.
- Result: `15 passed | 0 failed`.
- Criterion mapping: AC-F008-012 -> unobserved route failure test;
  AC-F008-013 -> observed-route non-regression guard; AC-F008-014 -> recorded
  justification acceptance test; AC-F008-015 -> missing, stale, and unreadable
  capture failure test.
- Red state: `12 passed | 3 failed` against a healthy typed baseline. AC-F008-013
  passed before implementation because it asserts that an observed route does
  not fail, which no rule could violate while no rule existed. It is a guard
  against an over-broad rule rather than a demonstration of missing behavior,
  and it becomes falsifiable once the rule exists.
- An unobserved route accepted by a recorded justification is reported as a
  warning carrying that justification, so the exception is visible in the result
  rather than silent.

### Verification, superseded

- Status: superseded. The verification recorded below predates the observed-coverage amendment approved at 2026-08-08T17:34:18Z and no
  longer covers the approved criteria. It must be re-run before this component
  is treated as verified again.

### Verification

- Status: passed.
- Verified at: 2026-08-07T19:21:05Z.
- Requirement digest:
  `sha256:f1940f8e137a319adfc66d7e8b2341fba0f3748c6387ff3d24354c72fce606a8`.
- Implementation manifest digest:
  `sha256:3e659058bfe2945130198105ef4937d801411947e787ae4d244f5326504bddee`.
- Test digest:
  `sha256:4d24521cbaa147007573346986aef72ae31a30a111a14865ea17fcd47393e58d`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Verifier: Deno `2.9.5` format, lint, type, test, frozen subprocess-runner,
  framework, creation, and planning tasks plus the canonical repository and
  cross-browser website verifier on macOS arm64.
- Results: independent checking passed 11/11; the complete framework passed
  77/77 with fifteen nested steps; planning passed 10/10; project creation
  passed 9/9; repository governance passed 9/9; website structure passed
  16/16; links passed 1/1; React passed 8/8; TypeScript and production build
  passed; Playwright and Axe passed 66/66 across Chromium, Firefox, and WebKit;
  `git diff --check` passed.
- Residual risks: the shared top-level CLI dispatcher remains owned by
  unimplemented SH-F011; SH-F008 exposes its complete command boundary for that
  integration. Source-boundary inspection consumes normalized, versioned
  inventory and supported metadata; it is a verification control rather than a
  sandbox for arbitrary Deno programs.

### Known defect, evidence collection is stubbed upstream

- Status: open. Recorded rather than repaired. Owned by SH-F018 and recorded in
  full at `cli/evidence/requirements.md`.
- Symptom here: `hollow check` cannot pass for any project that declares an
  acceptance criterion, because the SH-F018 loader supplies an empty test
  manifest. This component's criterion-mapping and red-state diagnostics are
  therefore reporting on evidence that was never gathered.
- Observed at: 2026-08-09T16:45Z against `examples/authentication` and
  `examples/todos`.

### Delivery

- Status: not applicable; no commit, push, publication, deployment, or external
  mutation was authorized or attempted.
