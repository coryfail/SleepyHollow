/**
 * Relational storage for Sleepy Hollow applications. SQLite is embedded by
 * default; PostgreSQL is an explicit external profile for scaled deployments.
 */
export { DatabaseConfigurationError } from "./errors.ts";
export { openPostgres } from "./postgres.ts";
export { defineResource } from "./resource.ts";
export { openEmbeddedSqlite } from "./sqlite.ts";
export { sql } from "drizzle-orm";
export type {
  DatabaseProfile,
  EmbeddedSqliteDatabase,
  EmbeddedSqliteOptions,
  PostgresDatabase,
  PostgresOptions,
  ResourceDefinition,
  ResourceField,
  ResourceRepository
} from "./types.ts";
