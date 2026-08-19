# Data

SQLite is Sleepy Hollow's default database profile. It is embedded with the
service, so a single-node application can ship its database file on a mounted
volume without a separate database connection.

## Embedded SQLite

```ts
import { defineResource, openEmbeddedSqlite } from "@sleepy-hollow/framework/database";

const database = openEmbeddedSqlite({ filename: "/data/application.sqlite", production: true });
const bookmarks = defineResource({
  name: "bookmarks",
  primaryKey: "id",
  fields: { id: { kind: "uuid" }, url: { kind: "text" }, created_at: { kind: "timestamp" } },
});
```

The underlying ORM is Drizzle. Use its typed schema/query API through the
opened database's `orm` property when your application needs queries beyond a
framework repository.

## Optional PostgreSQL

For an externally managed relational service, opt into PostgreSQL:

```ts
import { openPostgres } from "@sleepy-hollow/framework/database";

const database = openPostgres({ databaseUrl: process.env.DATABASE_URL! });
```

Keep SQLite paths durable in production; `:memory:` is intentionally limited to
tests. The portable resource definition keeps the data model independent of
the selected SQL profile.
