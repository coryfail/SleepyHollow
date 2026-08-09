# Routing

The filesystem is the only source of paths. There is no route table to keep in
sync and no registration step to forget.

## Files to paths

| File                          | Path             |
| ----------------------------- | ---------------- |
| `api/health/route.ts`         | `/health`        |
| `api/bookmarks/route.ts`      | `/bookmarks`     |
| `api/bookmarks/[id]/route.ts` | `/bookmarks/:id` |
| `api/users/me/route.ts`       | `/users/me`      |

A directory named `[id]` is a parameter. A literal segment always wins over a
parameter at the same position, so `/users/me` resolves to `users/me` rather
than `users/[id]`.

Two parameters at the same position with different names is a conflict and fails
discovery — `[id]` and `[slug]` as siblings is ambiguous, and the framework
refuses to guess.

## Defining a route

One default export per file, one entry per method:

```ts
import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

const params = z.object({ id: z.string() }).strict();
const bookmark = z.object({ id: z.string(), url: z.string() }).strict();
const problem = z.object({ title: z.string(), status: z.number() }).strict();

export default defineRoute({
  GET: {
    schemas: { params, responses: { 200: bookmark, 404: problem } },
    security: { authentication: "none" },
    contract: { summary: "Return one bookmark" },
    handler: ({ params }) =>
      Response.json({ id: params.id, url: "https://example.com" }),
  },

  DELETE: {
    schemas: { params, responses: { 204: null, 404: problem } },
    security: { authentication: "none" },
    contract: { summary: "Delete one bookmark" },
    handler: () => new Response(null, { status: 204 }),
  },
});
```

Note `204: null`. A status that returns no body is declared as literal `null`,
not `z.null()`. Declaring a schema there makes the runtime try to parse an empty
body and fail the response.

Each method declares four things:

- **`schemas`** — the request locations this method reads and the statuses it
  can return
- **`security`** — explicitly `"none"` or `"required"`; there is no default
- **`contract`** — metadata for OpenAPI, plus anything a consumer needs
- **`handler`** — a function from context to `Response`

## The handler context

The handler receives validated values, not raw input:

```ts
handler: ((
  { request, params, query, headers, body, principal },
) => {/* ... */});
```

`params`, `query`, `headers`, and `body` are typed from the schemas you
declared. A location without a declared schema is not validated, and reading one
is reported by `hollow check` as missing coverage.

Note the shapes differ: `params`, `query`, and `headers` take a schema directly,
while `body` wraps it and must declare `maxBytes`.

```ts
schemas: {
  query: z.object({ limit: z.coerce.number() }).strict(),      // direct
  body: {                                                       // wrapped
    schema: z.object({ title: z.string() }).strict(),
    maxBytes: 4096,
  },
}
```

Every object schema must be `.strict()`. A schema that strips or permits unknown
fields is rejected when the runtime starts.

### Coercing query values

Query values arrive as strings, so booleans need care:

```ts
// wrong: Boolean("false") is true, so ?done=false queries done=true
done: z.coerce.boolean();

// right
done: z.enum(["true", "false"]).default("false").transform((v) => v === "true");
```

This one type-checks and passes handler-level tests. Only a real request through
the router exposes it.

`principal` is the neutral request principal your project's authentication
provider produced — `{ id, type, claims? }`. The framework does not impose an
identity model.

**Known defect:** `principal` is currently typed as possibly `null` even on a
route declaring `authentication: { mode: "required" }`, so you need a null check
or non-null assertion the runtime does not require. The narrowing is intended
and the type does not yet deliver it.

## Responses

Return a standard `Response`. Failures use RFC 9457 problem details:

```json
{
  "type": "https://sleepyhollow.io/problems/validation",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "body.url must be a valid URL"
}
```

Validation failures produce this shape automatically. Declare the status in
`responses` so it appears in the generated contract.

## Escape hatch

`contract` is an open metadata slot. The router passes it through untouched;
OpenAPI generation reads the keys it understands and ignores the rest. Use it
for anything a consumer needs that the framework does not model.

## Related

- [Getting started](getting-started.md)
- [Data](data.md)
- [Verification](verification.md)
