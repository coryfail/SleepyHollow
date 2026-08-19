import type BetterSqlite3 from "better-sqlite3";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

export type DatabaseProfile = "sqlite" | "postgres";

export interface EmbeddedSqliteOptions {
  /** `:memory:` is intended only for tests. Production callers must pass a durable path. */
  readonly filename: string;
  readonly busyTimeoutMs?: number;
  readonly production?: boolean;
}

export interface PostgresOptions {
  readonly databaseUrl: string;
  readonly maxConnections?: number;
  readonly tls?: boolean;
}

export interface EmbeddedSqliteDatabase {
  readonly profile: "sqlite";
  readonly client: BetterSqlite3.Database;
  readonly orm: ReturnType<typeof import("drizzle-orm/better-sqlite3").drizzle>;
  close(): void;
}

export interface PostgresDatabase {
  readonly profile: "postgres";
  readonly pool: Pool;
  readonly orm: NodePgDatabase;
  close(): Promise<void>;
}

export interface ResourceField {
  readonly kind: "text" | "integer" | "boolean" | "uuid" | "timestamp" | "json" | "binary";
  readonly nullable?: boolean;
  readonly unique?: boolean;
}

export interface ResourceDefinition {
  readonly name: string;
  readonly primaryKey: string;
  readonly fields: Readonly<Record<string, ResourceField>>;
}

export interface ResourceRepository<Record extends object> {
  get(id: string): Promise<Record | undefined>;
  create(input: Record): Promise<Record>;
  update(id: string, expectedVersion: number, input: Partial<Record>): Promise<Record>;
  delete(id: string, expectedVersion: number): Promise<void>;
  list(options?: { readonly limit?: number; readonly cursor?: string }): Promise<{
    readonly items: readonly Record[];
    readonly cursor?: string;
  }>;
}
