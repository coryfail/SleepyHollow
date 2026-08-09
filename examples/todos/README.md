# Todos example

A complete CRUD API built the way a user builds one: generated with
`hollow create`, then endpoints added under `api/`.

## What it shows

- File-based routing, including a `[id]` parameter directory
- Zod request and response schemas on every method
- Typed Deno KV access with a declared `owner` index and bounded queries
- Optimistic concurrency through versionstamp checks
- Ownership checks returning RFC 9457 `403` and `404`
- Tests that exercise every operation against isolated KV

## Running it

```bash
deno task test     # 5 passing tests
deno task verify   # fmt, lint, check, test, scaffold verification
```

## The one difference from a real project

`deno.json` maps `@sleepy-hollow/framework/*` to this repository rather than the
published package, because the package is not published yet:

```json
"imports": {
  "@sleepy-hollow/framework/routing": "../../core/routing/mod.ts"
}
```

Every source file uses the same specifiers a real project uses, so after
publication the only change is that import map:

```json
"imports": {
  "@sleepy-hollow/framework": "jsr:@sleepy-hollow/framework@^0.1.0"
}
```

## Why `hollow check` fails here

It fails on purpose, and the reason is the whole point of the framework:

```
ERROR SH_CHECK_ROUTE_DRIFT: POST /todos has no owning approved requirement
  correction: Add and approve the owning endpoint requirement or remove the
  implementation-only route.
```

These endpoints were written **without governed requirements**. Sleepy Hollow's
first rule is that an endpoint is not implemented before its requirement is
approved, and this example breaks that rule deliberately so you can see what the
framework does about it: it refuses to certify routes that no approved
requirement owns.

To make this project pass, each endpoint directory needs a `requirements.md`
with approved acceptance criteria, and the tests need to map to those criteria
through `criterionTest`. That is the workflow the official skill automates.

A second gap this example exposed, since fixed: the CLI was reporting this
failure with no diagnostics at all, because it read the wrong output stream on
failure.
