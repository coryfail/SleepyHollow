---
schema: sgad-component/v0.2
id: SH-F012
title: Configuration and observability
status: verified
risk: standard
source_sections:
  - "8"
  - "13"
depends_on:
  - SH-F002
  - SH-F003
  - SH-F005
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Configuration and observability

## Purpose

Make application configuration explicit at startup and produce safe operational
signals that work locally, in tests, and in hosted environments.

## In scope

- Typed environment configuration and startup validation.
- Development, test, preview, and production modes.
- Local environment-file support.
- Structured JSON logs and request IDs.
- Health and conditional readiness endpoints.
- Secret and sensitive-data redaction.

## Requirements

Configuration shall be defined once with Zod 4 schemas for the four explicit
runtime modes `development`, `test`, `preview`, and `production`:

```ts
const definition = defineConfiguration({
  modes: {
    development: z.strictObject({ LOG_LEVEL: logLevel.default("debug") }),
    test: z.strictObject({ LOG_LEVEL: logLevel.default("error") }),
    preview: z.strictObject({
      LOG_LEVEL: logLevel.default("info"),
      DATABASE_URL: z.string().min(1),
    }),
    production: z.strictObject({
      LOG_LEVEL: logLevel.default("info"),
      DATABASE_URL: z.string().min(1),
    }),
  },
  sensitiveKeys: ["DATABASE_URL"],
  localEnvFiles: {
    development: ".env.local",
    test: ".env.test",
  },
});
```

`resolveConfiguration(definition, options)` shall require a mode rather than
infer one from ambient state. It shall select only keys declared by that mode's
schema from an injected environment record, optionally load the one declared
local file in `development` or `test`, apply environment values over file
values, and return the selected Zod output type. A declared local file shall be
required when configured. The loader shall accept comments, blank lines,
`KEY=VALUE`, and single- or double-quoted values without executing shell syntax,
performing variable expansion, or accepting duplicate keys. `preview` and
`production` shall reject local-file configuration and shall never implicitly
read `.env` files. Tests shall be able to inject both the environment record and
file reader without mutating global process state.

Invalid mode, schema, sensitive-key, environment-file, missing-key, coercion, or
cross-mode configuration shall stop startup through `ConfigurationError` with
stable diagnostics. A diagnostic shall contain a code, mode, key when
applicable, expected safe form, and correction, but never the rejected value or
another configuration value. `ResolvedConfiguration.metadata` shall expose the
mode and, for each declared key, only its name, source (`environment`,
`env-file`, `default`, or `absent`), presence, and sensitivity. It shall never
contain resolved values. Security and verification consumers shall use this
metadata instead of reading the configuration value object.

`createJsonLogger({ mode, sink, clock, sensitiveFields })` shall emit exactly one
JSON object per record to its injected sink. It shall support `debug`, `info`,
`warn`, and `error`, require a stable event name, and reserve `level`,
`timestamp`, `event`, `mode`, and optional `requestId` so caller context cannot
replace them. Timestamps shall be UTC ISO 8601 values from the injected clock.
`logger.withRequest(requestId)` shall bind the validated SH-F005 request ID for
request-scoped records. Logging a `Request`, `Headers`, `Response`, or `Error`
shall retain only safe structural context; request bodies and complete headers
shall not be serialized. Redaction shall reuse SH-F005 credential rules and
also redact every exact configured sensitive field recursively and cycle-safely.
A sink failure may propagate to the application; logging shall not silently
pretend delivery succeeded.

`createOperationalRoutes(options)` shall return normalized, schema-declared
routes that compose with the existing routing, validation, and security
inventory. The health route shall use explicit authentication mode `none` and
return `200 { status: "healthy" }` while the injected process-health predicate
is true, or a safe `503 { status: "unhealthy" }` otherwise. No configuration
value shall be returned. A readiness route shall exist only when required
external checks are declared. Each check shall have a unique safe name, a
positive timeout, and an async `check(signal)` function. Checks shall run
concurrently with abort signals, produce deterministic name-sorted safe status
entries, return `200` only when all are ready, and otherwise return `503`
without exception messages or dependency credentials. Route paths shall be
explicit and shall fail startup if duplicated or malformed. Request IDs and
secure response defaults remain owned by SH-F005 and shall apply when these
routes are composed through `createSecurityRouter`.

## Acceptance criteria

- AC-F012-001: A valid typed configuration starts in each documented runtime mode
  and exposes the resolved non-secret mode metadata.
- AC-F012-002: Missing, malformed, or mode-incompatible required configuration
  stops startup with a diagnostic naming the configuration key and expected form.
- AC-F012-003: A documented local environment file is loaded in allowed local
  modes and is not implicitly loaded in production.
- AC-F012-004: Each handled request has a request ID; a valid incoming ID is
  preserved when safe, otherwise a new ID is generated.
- AC-F012-005: Runtime log records are valid structured JSON and include level,
  timestamp, event, mode, and request ID when request-scoped.
- AC-F012-006: Logs redact secrets, authorization headers, session material, raw
  credentials, and configured sensitive fields by default.
- AC-F012-007: The health endpoint distinguishes a running process from an
  unavailable process without exposing sensitive configuration.
- AC-F012-008: When external readiness dependencies are declared, the readiness
  endpoint reports not-ready until each required dependency is available.
- AC-F012-009: Security and verification diagnostics can consume normalized
  configuration metadata without reading secret values.

## Out of scope

- A hosted log aggregation product.
- Distributed tracing infrastructure.
- Metrics collection, sampling, log shipping, or persistence.
- Secret storage, rotation, or environment provisioning.
- Shell-compatible environment-file evaluation or variable expansion.
- Returning secrets through diagnostics or health endpoints.

## Dependencies and assumptions

The runtime has permission to read the selected environment source and an
explicitly declared local file when applicable. A deployed process that cannot
be reached has no endpoint response; health probes distinguish that transport
failure from the declared healthy and unhealthy responses. Service-to-service
request-ID propagation is refined by SH-F014. Hosted environment provisioning
and deployment-time validation are refined by SH-F013.

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

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T15:04:00Z.
- Approved criteria: AC-F012-001 through AC-F012-009.
- Governed-content digest:
  `sha256:0a2408dd0c34e4b35bc5feb00d2ea8cf53a8fdcf269d9912ced09eb9cd471e28`.
- Decision source: owner review; direct response `Approved` after review
  of the requirement path, bounded criteria, standard-risk classification,
  dependencies, mode-specific Zod configuration, logging, operational-route
  design, and exact governed-content digest.

### Criterion mapping

- AC-F012-001 -> `config_test.ts` four-mode typed-resolution and metadata test;
  `type_test.ts` compile-time selected-mode output assertions.
- AC-F012-002 -> `config_test.ts` missing, malformed, schema, sensitive-key,
  and cross-mode startup diagnostic test.
- AC-F012-003 -> `config_test.ts` local-file grammar, precedence, duplicate,
  injected-reader, and production-isolation test.
- AC-F012-004 -> `config_test.ts` operational-route and SH-F005 request-ID
  composition test.
- AC-F012-005 -> `config_test.ts` deterministic structured logger and reserved-
  field test.
- AC-F012-006 -> `config_test.ts` recursive standard and configured-field
  redaction test.
- AC-F012-007 -> `config_test.ts` healthy and unhealthy route test.
- AC-F012-008 -> `config_test.ts` conditional, concurrent, sorted, timeout,
  abort, ready, and not-ready route test.
- AC-F012-009 -> `config_test.ts` value-free normalized metadata test.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T15:07:24Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F012 requirement, mapped configuration tests, typed nonfunctional seams,
  pinned dependency lock, Deno task configuration, and previously verified
  framework working tree.
- Commands: `deno task check:config`, the four existing component test tasks,
  and `deno task test:config` using Deno `2.9.5` on macOS arm64.
- Runtime-test digest:
  `sha256:2f5c57a0ccd48f9a79caf97b2e1f8adb9d012ce0a5c7ee8aa083e1aaa49462cc`.
- Compile-time-test digest:
  `sha256:415ee0907cfcb4c2ca4f28cf7fe6254f1a385d78cbe80fa66b9eb99b416867fe`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Result: configuration type checking passed; routing passed 9/9 with two
  nested steps, validation passed 10/10 with two nested steps, KV passed 9/9,
  security passed 11/11 with six nested steps, and configuration passed 0/9
  with three nested startup-diagnostic steps.
- Expected failure: every configuration criterion reached the healthy Deno
  runner and failed only through the explicit `SH_CONFIG_NOT_IMPLEMENTED`
  seams in configuration resolution, logging, or operational-route creation;
  no dependency, permission, assertion-runner, or unrelated regression failure
  obscured the missing approved behavior.

### Verification

- Status: passed.
- Verified at: 2026-08-07T15:11:17Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the declared
  working tree.
- Approved requirement digest:
  `sha256:0a2408dd0c34e4b35bc5feb00d2ea8cf53a8fdcf269d9912ced09eb9cd471e28`.
- Framework implementation manifest:
  `working-tree:sha256:1c06425c13ac1a3e320487f8244afab496f1b427b3804bd3728db763fd84a53d`
  across 52 sorted routing, validation, KV, security, and configuration source,
  fixture, test, configuration, dependency-lock, repository-control, and CI
  files. Each record is `<relative-path>\0<file-sha256>\n` before hashing the
  sorted stream.
- Current runtime-test digest:
  `sha256:2f5c57a0ccd48f9a79caf97b2e1f8adb9d012ce0a5c7ee8aa083e1aaa49462cc`.
- Current compile-time-test digest:
  `sha256:415ee0907cfcb4c2ca4f28cf7fe6254f1a385d78cbe80fa66b9eb99b416867fe`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Commands: `deno task verify:config`, `deno task verify:framework`,
  `git diff --check`, and the canonical `npm run verify` from `website/`.
- Framework results: formatting, linting, and type checking passed; routing
  passed 9/9 with two nested steps, validation passed 10/10 with two nested
  steps, KV passed 9/9, security passed 11/11 with six nested steps, and
  configuration passed 9/9 with three nested steps.
- Independent repository results: structural 16/16, links 1/1, repository
  consistency 9/9, React 8/8, TypeScript/build, and Playwright/Axe 66/66 across
  Chromium, Firefox, and WebKit passed. The unchanged repository-consistency
  test digest is
  `sha256:a909a928e37ea21a2f7af88604948f97fc9afbf162d4eef24c73929fa96215d6`.
- Verified behavior includes mode-specific typed configuration, injected and
  local-only environment loading, safe startup diagnostics and metadata,
  deterministic structured logs, recursive configured and standard redaction,
  SH-F005 request-ID composition, health state, and conditional concurrent
  timeout-bounded readiness checks.
- Residual boundaries are the approved exclusions: no secret provisioning or
  rotation, hosted logging, metrics, tracing infrastructure, log shipping,
  persistence, or shell-compatible environment evaluation is supplied. No
  commit, push, deployment, or other delivery was performed.
- Shared-CI revalidation: at 2026-08-07T15:17:48Z, the workflow gained the
  verified SH-F001 project-creation gate. The configuration and full framework
  verifiers passed unchanged, followed by the complete canonical repository
  verifier. This strengthens CI coverage without changing SH-F012 behavior.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
