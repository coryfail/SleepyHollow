import { describe, expect, it } from "vitest";
import { DatabaseConfigurationError, defineResource, openEmbeddedSqlite } from "./mod.ts";

describe("embedded SQLite", () => {
  it("enables relational safety settings for an explicit test database", () => {
    const database = openEmbeddedSqlite({ filename: ":memory:" });
    try {
      expect(database.profile).toBe("sqlite");
      expect(database.client.pragma("foreign_keys", { simple: true })).toBe(1);
    } finally {
      database.close();
    }
  });

  it("refuses an in-memory production database", () => {
    expect(() => openEmbeddedSqlite({ filename: ":memory:", production: true }))
      .toThrow(DatabaseConfigurationError);
  });
});

describe("resource definitions", () => {
  it("accepts the portable relational field subset", () => {
    expect(defineResource({
      name: "todo",
      primaryKey: "id",
      fields: { id: { kind: "uuid" }, title: { kind: "text" }, version: { kind: "integer" } }
    }).name).toBe("todo");
  });
});
