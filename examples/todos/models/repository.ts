import { mkdir } from "fs/promises";
import { dirname } from "path";

import { openEmbeddedSqlite, type EmbeddedSqliteDatabase } from "@sleepy-hollow/framework/database";

export interface TodoValue {
  readonly title: string;
  readonly done: boolean;
  readonly createdAt: string;
}

export interface TodoEntry {
  readonly id: string;
  readonly value: TodoValue;
  readonly versionstamp: number;
}

export interface TodoRepository {
  get(id: string): Promise<TodoEntry | undefined>;
  create(id: string, value: TodoValue): Promise<TodoEntry>;
  update(id: string, value: TodoValue, expectedVersion: number): Promise<{ readonly ok: boolean }>;
  delete(id: string, expectedVersion: number): Promise<{ readonly ok: boolean }>;
  list(options: { readonly done: boolean; readonly limit: number }): Promise<{
    readonly items: readonly TodoEntry[];
    readonly cursor: string | null;
  }>;
  close(): void;
}

type TodoRow = {
  readonly id: string;
  readonly title: string;
  readonly done: number;
  readonly created_at: string;
  readonly version: number;
};

function entry(row: TodoRow): TodoEntry {
  return {
    id: row.id,
    value: { title: row.title, done: row.done === 1, createdAt: row.created_at },
    versionstamp: row.version,
  };
}

export function createTodoRepository(database: EmbeddedSqliteDatabase): TodoRepository {
  const { client } = database;
  client.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      done INTEGER NOT NULL CHECK (done IN (0, 1)),
      created_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS todos_done_id ON todos(done, id);
  `);

  return {
    async get(id) {
      const row = client.prepare("SELECT id, title, done, created_at, version FROM todos WHERE id = ?").get(id) as TodoRow | undefined;
      return row && entry(row);
    },
    async create(id, value) {
      client.prepare("INSERT INTO todos (id, title, done, created_at) VALUES (?, ?, ?, ?)")
        .run(id, value.title, Number(value.done), value.createdAt);
      return (await this.get(id))!;
    },
    async update(id, value, expectedVersion) {
      const result = client.prepare(
        "UPDATE todos SET title = ?, done = ?, created_at = ?, version = version + 1 WHERE id = ? AND version = ?",
      ).run(value.title, Number(value.done), value.createdAt, id, expectedVersion);
      return { ok: result.changes === 1 };
    },
    async delete(id, expectedVersion) {
      const result = client.prepare("DELETE FROM todos WHERE id = ? AND version = ?").run(id, expectedVersion);
      return { ok: result.changes === 1 };
    },
    async list({ done, limit }) {
      const rows = client.prepare(
        "SELECT id, title, done, created_at, version FROM todos WHERE done = ? ORDER BY id ASC LIMIT ?",
      ).all(Number(done), limit) as TodoRow[];
      return { items: rows.map(entry), cursor: null };
    },
    close: () => database.close(),
  };
}

let override: TodoRepository | undefined;
let defaultRepository: TodoRepository | undefined;

export function useTodoRepository(repository: TodoRepository | undefined): void {
  override = repository;
}

export async function todoRepository(): Promise<TodoRepository> {
  if (override) return override;
  if (defaultRepository) return defaultRepository;
  const filename = process.env.TODOS_DATABASE_PATH ?? ".sleepyhollow/todos.sqlite";
  await mkdir(dirname(filename), { recursive: true });
  defaultRepository = createTodoRepository(openEmbeddedSqlite({ filename, production: process.env.NODE_ENV === "production" }));
  return defaultRepository;
}
