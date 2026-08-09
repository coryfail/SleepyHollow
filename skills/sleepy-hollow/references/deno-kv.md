# Data access with Deno KV

Data access goes through typed resource definitions, not raw KV calls.

## Resource definitions

Define the resource once with its identifier schema, value schema, and indexes:

```ts
const bookmarks = defineResource({
  name: "bookmarks",
  id: z.string().uuid(),
  value: bookmarkSchema,
  indexes: {
    owner: { kind: "index", value: (bookmark) => bookmark.ownerId },
    url: { kind: "unique", value: (bookmark) => bookmark.url },
  },
});
```

Keys are native tuples under a stable prefix. Do not build key strings by
concatenation; encoding is the framework's responsibility.

## Bounded queries

Every list query declares an index and a bounded page size. Unbounded scans and
queries against an undeclared index fail verification, because both degrade
without warning as data grows.

Pagination uses native opaque cursors. Do not construct or parse a cursor.

## Concurrency

Read-modify-write uses versionstamp checks so a concurrent write cannot be
silently lost. A mutation returns either a versionstamp or a conflict; handle
the conflict explicitly rather than retrying blindly.

Unique indexes are enforced atomically. Two concurrent creates competing for the
same unique value produce exactly one winner.

## Ownership

A resource belongs to one service. Cross-service reads go through that service's
declared transport, not by reaching into another service's keyspace.

## The escape hatch

Raw KV access exists and requires a recorded justification. It is for genuine
gaps in the primitives, not for skipping index declarations. Raw operations
still appear in verification, with their justification attached.
