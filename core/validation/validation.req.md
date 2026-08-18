---
schema: sgad-component/v0.2
id: SH-F003
title: Schemas, validation, and errors
status: verified
risk: standard
source_sections:
  - "6.2"
  - "6.5"
  - "8"
depends_on:
  - SH-F002
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Schemas, validation, and errors

## Purpose

Make route boundaries explicit and safe by using the same schema definitions for
runtime validation, verification, and generated contracts.

## In scope

- Path, query, header, and body input validation.
- Declared response-body validation.
- Unknown-field rejection and request-body limits.
- RFC 9457 Problem Details errors.
- Actionable, machine-readable validation diagnostics.

## Requirements

OPEN-002 is resolved with Zod 4, pinned to `4.4.3` for this implementation
slice. Route authors shall use Zod schemas directly, and Sleepy Hollow shall
derive both runtime parsing and JSON Schema/OpenAPI-compatible contract metadata
from those same objects. A schema that Zod cannot represent as JSON Schema shall
fail route normalization rather than silently weakening the contract.

The canonical operation shape shall be:

```ts
POST: {
  schemas: {
    params: z.strictObject({ collectionId: z.string() }),
    query: z.strictObject({ notify: z.stringbool().optional() }),
    headers: z.object({ "idempotency-key": z.string().min(1) }),
    body: {
      schema: z.strictObject({ url: z.url(), title: z.string() }),
      maxBytes: 64 * 1024,
    },
    responses: {
      201: z.strictObject({ id: z.string(), url: z.url(), title: z.string() }),
    },
  },
  // security, contract, and handler remain present
}
```

Path, query, and JSON object-body schemas shall reject unknown application
fields by using strict object semantics. Query values shall remain strings, or
arrays for repeated keys, unless the route schema explicitly transforms or
coerces them. Header names shall be normalized to lowercase. Only headers named
by the route's header schema shall become application input, so ambient
transport headers are not mistaken for undeclared application fields.

Every declared request location shall be parsed before handler side effects. The
handler context shall expose the schema output types as `params`, `query`,
`headers`, and `body`. An omitted location shall expose an empty read-only
object for params, query, and headers, and `undefined` for body.

A route accepting a JSON body shall declare a positive integer `maxBytes` next
to its body schema. The runtime shall reject a declared oversized
`Content-Length` before reading, enforce the same limit while streaming when the
header is absent or inaccurate, cancel the body reader after overflow, and
return `413`. A declared body with a non-JSON media type shall return `415`; an
empty or malformed required JSON body shall return `400`.

Every handler response status shall have a corresponding declared response
schema. A `null` response schema shall mean that no response body is allowed.
For a non-null schema, the runtime shall parse the response as JSON and validate
it before returning it to the caller. An undeclared status, malformed JSON,
unexpected body, or schema mismatch shall become a safe `500` response and an
internal diagnostic rather than a successful production response.

Errors exposed to clients shall use RFC 9457 and shall not disclose stack
traces, secrets, internal KV keys, or implementation details in production.
Schema issues may expose location, field path, stable issue code, and safe
explanatory text, but never echo rejected values. Internal diagnostics shall use
stable codes and include route, source file, schema location, issue paths, and a
safe correction. Schema definitions shall normalize into one representation
holding the original Zod runtime schema and its derived JSON Schema so runtime
and contract tooling cannot drift through separate authoring.

## Acceptance criteria

- AC-F003-001: Valid path, query, header, and body values reach the handler in
  their schema-defined typed representation.
- AC-F003-002: Invalid input is rejected before handler side effects and returns
  an RFC 9457 response identifying the invalid location and field.
- AC-F003-003: An undeclared input field is rejected by default with an
  actionable client error.
- AC-F003-004: A body exceeding the route's configured limit is rejected before
  full application processing.
- AC-F003-005: A handler response that violates its declared schema is detected
  and is not returned as a successful production response.
- AC-F003-006: Production Problem Details responses omit stack traces, secrets,
  authorization values, internal KV keys, and implementation-only messages.
- AC-F003-007: Human and JSON diagnostics identify the route, schema location,
  violated rule, and safe correction path.
- AC-F003-008: Runtime validation and contract generation consume the same
  normalized schema definition in a consistency test.

## Out of scope

- Business-rule validation that belongs in an application handler.
- A proprietary schema language without TypeScript inference.
- Multipart forms, streaming application payloads, and arbitrary binary bodies.
- Automatically coercing query, header, or path strings without a route schema
  that explicitly requests the transformation.

## Dependencies and assumptions

Zod `4.4.3` is the first-release schema dependency. Its schema output type is
the handler-facing type. Request contract generation uses the schema input view;
response contract generation uses the schema output view. Unsupported or
unrepresentable transformations fail normalization with an actionable
diagnostic. A future schema adapter is a separately governed compatibility
feature rather than an implicit part of this slice.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading
after omitting the single top-level frontmatter `status:` line and its line
ending. The status field is a lifecycle projection for routing and human
readability; no other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T13:55:31Z.
- Approved criteria: AC-F003-001 through AC-F003-008.
- Governed-content digest:
  `sha256:19ec47355a971203e0b6e85c256eb9df52fb8a17feaf37a13f94975ebef90652`.
- Decision source: owner review; direct response `Approve` after the
  formatting-only invalidation and both current exact digests were presented.
- Supersedes: the 2026-08-07T13:40:08Z approval recorded below. This entry is
  the governing record and its digest binds the current governed content.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T13:40:08Z.
- Approved criteria: AC-F003-001 through AC-F003-008.
- Governed-content digest:
  `sha256:88a39d3ada150d3c5c6396d71cc52b489b256e20a2e1b87e675c9f8b953e8e30`.
- Decision source: owner review; direct response `Approve` after review of
  the requirement path, bounded criteria, schema choice, and exact digest.
- Invalidation: at 2026-08-07T13:52:19Z, an overbroad Deno formatting command
  changed governed Markdown bytes after approval. No behavioral change was
  intended, but the exact-content approval and red-state evidence no longer bind
  the current digest. Historical evidence remains preserved below. Superseded by
  the 2026-08-07T13:55:31Z approval above; this entry binds content that no
  longer exists and asserts no authority.

### Criterion mapping

- AC-F003-001 -> `validation_test.ts` typed params, query, header, and body
  test.
- AC-F003-001 -> `type_test.ts` compile-time Zod output-inference assertions.
- AC-F003-002 -> `validation_test.ts` field-specific pre-handler rejection test.
- AC-F003-003 -> `validation_test.ts` strict unknown-field test.
- AC-F003-004 -> `validation_test.ts` declared-length and streamed-overflow
  steps.
- AC-F003-005 -> `validation_test.ts` invalid handler-response test.
- AC-F003-006 -> `validation_test.ts` production exception-redaction test.
- AC-F003-007 -> `validation_test.ts` human and structured diagnostic test.
- AC-F003-008 -> `validation_test.ts` shared normalized-inventory and
  unrepresentable-schema tests.

### Red-state evidence

- Status: failed as expected.
- Observed at: 2026-08-07T13:43:03Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F003 requirement, mapped tests, pinned dependency lock, Deno configuration,
  and explicit nonfunctional validation seam in the working tree.
- Commands: `deno task check:validation`, `deno task test:routing`, and
  `deno task test:validation` using Deno `2.9.5` on macOS arm64.
- Test digest:
  `sha256:39dcace341d475d770f4850d0d0eb399f0a2cba99b8aef5d1f1b39a3cae85547`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Result: validation type checking passed, the verified routing control passed
  9/9 tests with two nested steps, and validation passed 0/9 tests.
- Expected failure: every validation criterion reached the healthy Deno runner
  and failed because `createValidatedRouter` exposed the deliberate
  `SH_VALIDATION_NOT_IMPLEMENTED` seam; the unrepresentable-schema test observed
  the same missing behavior instead of its required normalization diagnostic.
- Before the final typed-context implementation and before the formatting
  invalidation at 2026-08-07T13:52:19Z, the added `type_test.ts` assertion also
  produced the expected compile-time red state: query, header, and body outputs
  were absent from the route handler context. The final type test digest is
  `sha256:22610eb4e1a463ad7a25779af76904f4f63857405d6972b0a8021074a0cd2dda`.
- Evidence qualification: the historical runtime red test digest predates a
  deterministic Web Streams fixture correction and the compile-time test. The
  fixture correction changed no approved expectation and was required because
  the platform eagerly prefetched the synthetic stream; the current verifier
  binds the corrected tests below. Historical evidence is retained rather than
  rewritten.
- Security regression red state: after adding the approved-scope AC-F003-006
  assertion and before changing the implementation, `deno task test:validation`
  passed 9 tests and failed only `schema-authored messages cannot reflect
  rejected secrets`. The response exposed the fixture secret through a custom
  Zod issue message, exactly demonstrating the missing redaction behavior. The
  test digest was
  `sha256:86d20a56434121052705993ddc0fdd440173f6c008f6c2012ee05159966e395c`;
  the run occurred after the 2026-08-07T13:58:24Z verification and before the
  implementation revalidation below.

### Verification

- Status: passed.
- Verified at: 2026-08-07T13:58:24Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the declared
  working tree.
- Current approved requirement digest:
  `sha256:19ec47355a971203e0b6e85c256eb9df52fb8a17feaf37a13f94975ebef90652`.
- Framework implementation manifest:
  `working-tree:sha256:32709be4cd2166038aee2086cde4309950b85b892b9d76f49d945fd1186f02c5`
  across 28 sorted framework source, fixture, test, configuration, dependency-
  lock, repository-control, and CI files. Each record is
  `<relative-path>\0<file-sha256>\n` before hashing the sorted record stream.
- Validation runtime-test digest:
  `sha256:95e25914b0e5b6747e8c8b4532fb249d5859db3f2e3bb52ffd251e1052d6154a`.
- Validation compile-time-test digest:
  `sha256:22610eb4e1a463ad7a25779af76904f4f63857405d6972b0a8021074a0cd2dda`.
- Dependency-lock digest:
  `sha256:8405839670a88a985b955e1bacd52b08588cf437a854094deddd2612b42355e7`.
- Framework verifier: `deno task verify:framework` using Deno `2.9.5`;
  validation formatting 9/9, linting 9/9, type checking including handler Zod
  output inference, and 9/9 runtime tests with two nested body-limit steps
  passed. The routing dependency suite passed 9/9 with two nested steps.
- Independent repository verifier: `npm run verify` from `website/`; structural
  16/16, links 1/1, repository consistency 9/9, React 8/8, TypeScript and
  production build, and Playwright/Axe 66/66 across Chromium, Firefox, and
  WebKit passed.
- Repository consistency control digest:
  `sha256:a909a928e37ea21a2f7af88604948f97fc9afbf162d4eef24c73929fa96215d6`.
- CI control: the Pages verification job watches `core/**`, `deno.json`, and
  `deno.lock`, installs Deno `2.9.5`, and runs `deno task verify:framework`
  before website verification.
- Residual risks: CI has not run against this uncommitted branch; response
  buffering is intentionally limited to declared JSON response validation; no
  multipart or arbitrary binary request support is in scope; no delivery was
  attempted.
- Approved-scope security revalidation: passed at 2026-08-07T14:01:35Z. Client
  and internal schema issues now use stable issue-code text rather than
  schema-authored messages, preventing rejected values or secrets from being
  reflected through custom validation messages.
- Current framework implementation manifest:
  `working-tree:sha256:941fd4b35f0c4b78b46e2e447381e6572c5547f60a11cab4db784666faf0443f`
  across the same 28 sorted files.
- Current validation runtime-test digest:
  `sha256:86d20a56434121052705993ddc0fdd440173f6c008f6c2012ee05159966e395c`.
- Revalidation result: `deno task verify:framework` passed routing 9/9 and
  validation 10/10, each with two nested steps, plus all formatting, linting,
  compile-time inference, and type checks.
- Final independent current-tree rerun completed by 2026-08-07T14:03:02Z:
  `npm run verify` passed structural 16/16, links 1/1, repository consistency
  9/9, React 8/8, TypeScript/build, and Playwright/Axe 66/66 across Chromium,
  Firefox, and WebKit.
- KV-dependent revalidation passed at 2026-08-07T14:19:24Z. Validation remained
  green at 10/10 with two nested steps and compile-time inference checks. The
  current 37-file framework manifest is
  `working-tree:sha256:f7e1e76626c370eefd6b6dd602e4140e6d7bbde16d130e464097a4e9dcedc30f`.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
