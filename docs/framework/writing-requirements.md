# Writing requirements

`hollow check` refuses to certify a route unless an approved requirement
authorizes it and a test maps to one of its acceptance criteria. This guide is
how you produce that requirement by hand.

If you work through the [official skill](getting-started.md#use-with-an-agent),
it writes these files for you and asks for your approval at each checkpoint. The
format is the same either way, and the verifier cannot tell which of you wrote
it.

## Where a requirement lives

Placement follows ownership, and the verifier reads it from the path:

| File | Owns |
| ---- | ---- |
| `requirements/application.req.md` | Application-wide intent, shared architecture, cross-cutting criteria |
| `api/<route>/<endpoint>.req.md` | One endpoint's behavior, beside the route it governs |
| `<component>/<feature>.req.md` | One subsystem's behavior, beside its code |

`requirements/application.req.md` owns application-wide behavior. Everything
else uses a meaningful named `*.req.md` file next to the behavior it describes,
so one directory may contain several independently governed features and moving
code moves its governing intent with it.

## The file

A requirement is UTF-8 Markdown with one YAML frontmatter block:

```markdown
---
schema: sgad-component/v0.2
id: EP-BOOKMARKS-CREATE
title: Create a bookmark
status: draft
risk: standard
depends_on: []
owners:
  - your-team
---

# Create a bookmark

## Purpose

Accept a URL from an authenticated reader and store it as a bookmark they own.

## Acceptance criteria

- AC-EP-001: Given a request with no `url`, then the response is 422 and no
  bookmark is written.
- AC-EP-002: Given a valid `url`, then the response is 201 and the bookmark is
  readable by its owner.

## Governance record
```

`status` is a lifecycle projection — `draft`, `approved`, `verified`. It is for
routing and human readability. It is never evidence, and promoting it by hand
grants no authority.

## Acceptance criteria

Criteria are the unit of authority. A criterion is what gets approved, what a
test maps to, and what verification reports on.

Write each one so a test can fail it. `AC-EP-001` above names a condition, an
observable result, and a prohibited side effect. "The endpoint validates input"
names none of those and cannot be verified.

Criterion IDs are globally unique across the repository, in the form
`AC-<SCOPE>-<NNN>`. The scope segment is yours to choose; the three-digit
suffix is required.

## The governance record

`## Governance record` is a reserved heading. It appears exactly once, as the
last level-two heading in the file, and everything before it is the governed
content — the bytes your approval binds.

Beneath it you record approval, the criterion-to-test mapping, red-state
evidence, and verification. Append to it; never rewrite an old entry to make
stale evidence look current.

Approval is bound to a SHA-256 digest of the governed content. The canonical
algorithm has one definition, in the repository's root `repository.req.md`, and
[Verification](verification.md) explains why editing an approved requirement
detaches its approval. Do not reimplement the digest from either description —
`deno task check:governance` computes it.

## Mapping a test to a criterion

A test counts toward verification only when it declares the criterion it
exercises:

```ts
import { criterionTest } from "@sleepy-hollow/framework/testing";

criterionTest({
  id: "T-BOOKMARKS-001",
  requirementId: "EP-BOOKMARKS-CREATE",
  criteria: ["AC-EP-001"],
  name: "rejects a bookmark with no URL",
  sourcePath: "api/bookmarks/route_test.ts",
  fn: async () => {/* ... */},
}, { requirements });
```

The mapping is checked in both directions. An approved criterion with no test
fails verification, and a test naming a criterion that does not exist fails too.

## The order that works

1. Write the requirement with its criteria. Leave `status: draft`.
2. Get it approved and record the approval and digest.
3. Write the mapped tests and **watch them fail**. A test that has never failed
   is not evidence that it can.
4. Implement until they pass.
5. Run `deno task test`, then `hollow check`.

Step 3 is not ceremony. Verification proves your tests exercised the handler; it
cannot prove a test would have caught the failure it claims to cover.

## Related

- [Verification](verification.md) — what `hollow check` reads and refuses
- [Getting started](getting-started.md) — the loop these requirements feed
- [SGAD methodology](../sgad/README.md) — where this model comes from
