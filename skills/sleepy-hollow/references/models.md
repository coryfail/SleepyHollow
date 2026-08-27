# Model architecture

A model is the sole owner of one durable domain concept. Split each model into a
governed requirement, Drizzle schema, repository, and public types:

```text
models/
  bookmark/
    bookmark.req.md
    schema.ts
    repository.ts
    types.ts
```

Do not place TypeScript files directly under `models/`, combine unrelated domain
concepts into a generic data module, or introduce a model without its requirement.

## Ownership

- `<model>.req.md` owns purpose, fields, defaults, relationships, constraints,
  indexes, access paths, retention and deletion, sensitive fields, authorization
  implications, and migration behavior.
- `schema.ts` owns Drizzle tables, columns, relations, keys, constraints, and
  indexes. It does not contain request or response behavior.
- `repository.ts` owns bounded reads, writes, transactions, concurrency control,
  and mapping database records to public model values.
- `types.ts` owns the public model and repository input/result types. Do not
  expose driver-specific records through this boundary.

Route handlers validate transport input, call a repository, and form a response.
They must not import Drizzle, PostgreSQL or SQLite drivers, raw database clients,
or framework database capabilities. Shared business policy belongs in its own
governed model or policy component rather than being duplicated across routes.

## Queries and migrations

Every collection read is bounded and uses an index named in the model requirement.
Every read-modify-write path is transactional and uses the approved concurrency
strategy. Raw SQL requires a human-approved, parameterized, tested exception in
the model requirement.

Every schema change produces a reviewed Drizzle migration. Applied migrations
are immutable. Destructive or backfill changes require compatibility, rollout,
recovery, and production verification plans before approval.

## Tests and dependencies

Map every model acceptance criterion to repository or migration tests. Cover
constraints, relationships, index-backed access, bounded results, transactions,
deletion/retention, and expected database failures. Dependent endpoint
requirements cite the model requirement ID and retain endpoint-level tests for
authorization, validation, error mapping, and observable API behavior.

Only an explicit human decision may waive Drizzle, split layout, repository
ownership, or a source-quality rule. Record the exact exception, reason, scope,
approver, and decision source in the owning requirement before implementation.

For a Drizzle exception, use `persistence: alternative` with a
`persistence_exception` mapping containing non-empty `technology`, `reason`,
`approver`, and `decision_source` values. The exception becomes valid only when
the normal governance record binds exact-content human approval to those bytes.
It waives Drizzle-specific dependency, configuration, and schema-import checks;
it does not waive the model directory, requirement, repository, types, tests, or
readability rules.
