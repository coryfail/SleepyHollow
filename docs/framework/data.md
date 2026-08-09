# Data

Persistence is Deno KV, reached through typed resource definitions rather than
raw key manipulation.

## Defining a resource

```ts
import { defineKvResource } from "@sleepy-hollow/framework/kv";
import { z } from "@sleepy-hollow/framework/validation";

export const bookmarks = defineKvResource({
  name: "bookmarks",
  id: z.string().uuid(),
  value: z.object({
    url: z.string().url(),
    ownerId: z.string(),
    createdAt: z.string().datetime(),
  }),
  indexes: {
    owner: { kind: "index", value: (bookmark) => bookmark.ownerId },
    url: { kind: "unique", value: (bookmark) => bookmark.url },
  },
});
```

Three index kinds:

- **`index`** — many records per value; the basis for bounded queries
- **`unique`** — at most one record per value, enforced atomically
- **`belongsTo`** — a reference to another resource

## Using a repository

```ts
import { createKvRepository } from "@sleepy-hollow/framework/kv";

const kv = await Deno.openKv();
const repository = createKvRepository(kv, bookmarks);

await repository.create(id, { url, ownerId, createdAt });
const entry = await repository.get(id);
const page = await repository.list({
  index: "owner",
  value: ownerId,
  limit: 25,
});
```

Keys are native tuples under a stable prefix. Never build key strings yourself —
encoding is the framework's responsibility, and hand-built keys are how index
compatibility silently breaks.

## Queries are bounded

Every list query declares an index and a positive limit. Both are enforced:

```ts
// fails hollow check: SH_CHECK_QUERY_UNBOUNDED
await repository.list({ index: "owner", value: ownerId });

// fails hollow check: SH_CHECK_INDEX_INCOMPATIBLE
await repository.list({ index: "undeclared", value: x, limit: 25 });
```

The maximum page size is 100. Pagination uses native opaque cursors — do not
construct or parse one.

## Concurrency

Mutations return a discriminated result rather than throwing on conflict:

```ts
const result = await repository.update(id, value, entry.versionstamp);
if (!result.ok) {
  // result.reason === "conflict" — someone else wrote first
}
```

Read-modify-write uses versionstamp checks so a concurrent write cannot be
silently lost. Unique indexes are enforced atomically: two concurrent creates
competing for the same unique value produce exactly one winner.

Handle the conflict explicitly. Retrying blindly is how you lose the write you
were trying to protect.

## The raw escape hatch

```ts
import { rawKv } from "@sleepy-hollow/framework/kv";

const raw = rawKv(kv, {
  justification: "bulk migration outside the declared primitives",
});
```

Raw access requires a recorded justification, and the justification appears in
verification output. It exists for genuine gaps in the primitives — not for
skipping index declarations.

## Testing against KV

```ts
import { openKvTestContext } from "@sleepy-hollow/framework/kv";

const context = await openKvTestContext();
// isolated KV per test; closed automatically
```

Each test gets isolated state, so tests cannot leak data into one another.

## What verification observes

Every operation your tests exercise is recorded with its resource, kind, index,
limit, versionstamp check, and atomicity. That observed record — not a
declaration you wrote — is what `hollow check` evaluates. See
[Verification](verification.md).

## Related

- [Routing](routing.md)
- [Verification](verification.md)
