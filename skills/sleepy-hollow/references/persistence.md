# Durable persistence

## Default

For application-owned relational data that must survive a request or process
restart, use Drizzle. Select the Sleepy Hollow SQLite or PostgreSQL profile,
define typed table schemas, and create reviewed migrations. Keep data access in
repositories or focused data modules; route handlers should not embed SQL or
database-client setup.

Every persistent model uses this layout:

```text
models/<model>/
  <model>.req.md
  schema.ts
  repository.ts
  types.ts
```

The model requirement must be approved before any of the three source files are
implemented. Endpoint requirements depend on the model requirement IDs they use.

Use Drizzle's typed query and relation APIs for normal reads and writes. A raw
statement is permitted only for a narrow, approved database-specific need; keep
it isolated, parameterized, tested, and documented in the owning requirement.

## Human-approved exception

Do not infer an alternative ORM, raw SQL, a hosted data API, or an in-memory
store from the project shape. An exception requires the human to explicitly name
the alternative and confirm it in the current review or conversation. Before
implementation, add all of the following to the application requirement:

- the alternative and its scope;
- the technical reason Drizzle is not appropriate;
- the person who confirmed the exception; and
- the decision source, such as the review record or conversation message.

An existing dependency or an agent-authored note is not confirmation. If the
application has no durable data, record that decision explicitly rather than
silently omitting a persistence design.

Record a model-specific exception in the owning model requirement:

```yaml
persistence: alternative
persistence_exception:
  technology: managed document API
  reason: The approved service is the system of record.
  approver: human-project-owner
  decision_source: Current application architecture review.
```

All four exception fields must be non-empty. The normal governance verifier must
also find a current exact-content human approval for the requirement; metadata
alone never proves approval. The split model layout, repository boundary, model
requirement, tests, and source-quality standards still apply to an alternative.

## Required design and tests

For every durable resource, define its primary key, foreign keys, constraints,
indexes that support declared access paths, ownership, retention, and migration
strategy. Test migrations and repository behavior, including constraint failures
and each declared indexed query. Keep collection queries bounded and rely on the
approved index; do not compensate for an unplanned access path by scanning a
table in application code.

Keep `drizzle.config.ts` at the project root and generated migrations in the
configured migration directory. Never edit an applied migration. A destructive
or backfill migration records compatibility, rollout, recovery, and verification
steps in the model requirement before approval.
