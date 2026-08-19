import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DatabaseConfigurationError } from "./errors.ts";
import type { PostgresDatabase, PostgresOptions } from "./types.ts";

const DEFAULT_MAX_CONNECTIONS = 10;

/** Opens the optional externally managed PostgreSQL profile. */
export function openPostgres(options: PostgresOptions): PostgresDatabase {
  const databaseUrl = options.databaseUrl.trim();
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new DatabaseConfigurationError("PostgreSQL requires a postgresql:// DATABASE_URL.");
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    max: options.maxConnections ?? DEFAULT_MAX_CONNECTIONS,
    ssl: options.tls === false ? undefined : { rejectUnauthorized: true }
  });
  return {
    profile: "postgres",
    pool,
    orm: drizzle(pool),
    close: () => pool.end()
  };
}
