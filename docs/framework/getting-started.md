# Getting started

## Requirements

Deno 2.x. Sleepy Hollow uses Deno KV, Deno runtime APIs, and Deno Deploy, and
does not run on Node or Bun.

## Install the CLI

The framework and its CLI are one package,
[`@sleepy-hollow/framework`](https://jsr.io/@sleepy-hollow/framework) on JSR.
Install the CLI as `hollow`:

```bash
deno install -A --global --name hollow jsr:@sleepy-hollow/framework/cli
```

Every `hollow` command below can also be run without installing, by substituting
`deno run -A jsr:@sleepy-hollow/framework/cli` for `hollow`.

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

const created = z.object({ url: z.string() }).strict();
const problem = z.object({ title: z.string(), status: z.number() }).strict();

export default defineRoute({
  POST: {
    schemas: {
      body: {
        schema: z.object({ url: z.string().url() }).strict(),
        maxBytes: 4096,
      },
      responses: { 201: created, 422: problem },
    },
    security: { authentication: { mode: "none" } },
    contract: { summary: "Create a bookmark" },
    handler: ({ body }) => Response.json({ url: body.url }, { status: 201 }),
  },
});
```

Five things are mandatory and none of them have a silent default:

- **Zod schemas** for every request location the handler reads. A plain object
  such as `{ id: "string" }` is rejected at startup.
- **Object schemas must be `.strict()`**, so unknown fields are refused rather
  than silently stripped.
- **A body schema declares `maxBytes`**, the largest payload you accept.
- **Response schemas** for every status the route can return, including
  failures. A bodyless status is declared as literal `null`, as in
  `responses: { 204: null }`.
- **`authentication`**, explicitly `{ mode: "none" }`, or `{ mode: "required" }`
  with the `provider` name and governing `requirementId`.

These are enforced when the runtime starts, so a route that violates them fails
to boot rather than failing on a request.

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
  fn: async () => {/* ... */},
}, { requirements });
```

Tests that do not map to a criterion still run. They simply do not produce
evidence that any approved behavior was exercised.

## What happens if you skip a step

| You did                                   | You get                                             |
| ----------------------------------------- | --------------------------------------------------- |
| Added a route, no test                    | `hollow check` fails: the route was never observed  |
| Wrote a test that never calls the handler | Same failure — capture saw nothing                  |
| Edited an approved requirement            | Its approval is no longer bound; verification fails |
| Ran `hollow check` without testing first  | Fails: the evidence artifact is missing             |
| Changed code after testing                | Fails: the artifact is stale for this revision      |

Each of these is a real failure with a named diagnostic and a correction, not a
warning you can scroll past.

## Next

- [Routing](routing.md)
- [Data](data.md)
- [Verification](verification.md)
- [Deployment](deployment.md)
