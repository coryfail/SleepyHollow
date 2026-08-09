# Getting started

## Requirements

Deno 2.x. Sleepy Hollow uses Deno KV, Deno runtime APIs, and Deno Deploy, and
does not run on Node or Bun.

## Create a project

```bash
hollow create my-api
cd my-api
```

You get a project that is valid before any endpoint exists:

```
api/                    your routes live here
generated/              OpenAPI, client, and evidence artifacts
models/                 shared schemas
requirements/           application.md, the plan of record
tests/                  capture setup and your tests
sleepyhollow.config.ts  declared project locations
```

Run its own verifier to confirm the scaffold is intact:

```bash
deno task verify
```

## The loop

Three commands, in this order:

```bash
deno task test   # run tests, record what they exercised
hollow check     # verify the recorded evidence independently
hollow deploy    # deliver a verified revision
```

`hollow check` reads the evidence your test run produced. Running it without a
current test run fails — deliberately, because verification with no evidence is
not verification.

On a new project with no endpoints, both pass and say so plainly:

```
Test run passed.
Independent verification passed.
```

## Your first endpoint

Create the directory, and the path follows from it. `api/bookmarks/route.ts`
serves `/bookmarks`.

```ts
import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

export default defineRoute({
  POST: {
    schemas: {
      body: { schema: z.object({ url: z.string().url() }) },
      responses: { 201: "application/json", 422: "application/problem+json" },
    },
    security: { authentication: "none" },
    contract: { summary: "Create a bookmark" },
    handler: ({ body }) => Response.json({ url: body.url }, { status: 201 }),
  },
});
```

Three things are mandatory and none of them have a silent default:

- **Schemas** for every request location the handler reads
- **Response schemas** for every status the route can return, including failures
- **`authentication`**, explicitly `"none"` or `"required"`

## Writing a test that counts

A test only counts toward verification if it maps to an approved acceptance
criterion:

```ts
import { criterionTest } from "@sleepy-hollow/framework/testing";

criterionTest({
  id: "T-BOOKMARKS-001",
  requirementId: "EP-BOOKMARKS-CREATE",
  criteria: ["AC-EP-001"],
  name: "rejects a bookmark with no URL",
  sourcePath: "api/bookmarks/route_test.ts",
  fn: async () => { /* ... */ },
}, { requirements });
```

Tests that do not map to a criterion still run. They simply do not produce
evidence that any approved behavior was exercised.

## What happens if you skip a step

| You did | You get |
|---|---|
| Added a route, no test | `hollow check` fails: the route was never observed |
| Wrote a test that never calls the handler | Same failure — capture saw nothing |
| Edited an approved requirement | Its approval is no longer bound; verification fails |
| Ran `hollow check` without testing first | Fails: the evidence artifact is missing |
| Changed code after testing | Fails: the artifact is stale for this revision |

Each of these is a real failure with a named diagnostic and a correction, not a
warning you can scroll past.

## Next

- [Routing](routing.md)
- [Data](data.md)
- [Verification](verification.md)
- [Deployment](deployment.md)
