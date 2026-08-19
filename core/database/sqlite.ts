import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { DatabaseConfigurationError } from "./errors.ts";
import type { EmbeddedSqliteDatabase, EmbeddedSqliteOptions } from "./types.ts";

const DEFAULT_BUSY_TIMEOUT_MS = 5_000;

/**
 * Opens the self-contained database profile. The caller chooses the path so
 * production storage can be mounted explicitly by the selected host.
 */
export function openEmbeddedSqlite(options: EmbeddedSqliteOptions): EmbeddedSqliteDatabase {
  const filename = options.filename.trim();
  if (filename.length === 0) {
    throw new DatabaseConfigurationError("Embedded SQLite requires an explicit database filename.");
  }
  if (options.production && filename === ":memory:") {
    throw new DatabaseConfigurationError("Production SQLite requires a durable database path, not :memory:.");
  }

  const client = new BetterSqlite3(filename);
  client.pragma("foreign_keys = ON");
  client.pragma(`busy_timeout = ${options.busyTimeoutMs ?? DEFAULT_BUSY_TIMEOUT_MS}`);
  if (filename !== ":memory:") client.pragma("journal_mode = WAL");

  return {
    profile: "sqlite",
    client,
    orm: drizzle(client),
    close: () => client.close()
  };
}
