import assert from "node:assert/strict";
import { z } from "zod";

import {
  createKvRepository,
  defineKvResource,
  KvDataError,
  openKvTestContext,
  rawKv,
} from "./mod.ts";

const Bookmark = z.strictObject({
  id: z.string(),
  collectionId: z.string(),
  url: z.url(),
  title: z.string().min(1),
});

const bookmarks = defineKvResource({
  name: "bookmarks",
  id: z.string(),
  value: Bookmark,
  indexes: {
    byCollection: {
      kind: "belongsTo",
      value: (bookmark) => bookmark.collectionId,
    },
    byUrl: {
      kind: "unique",
      value: (bookmark) => bookmark.url,
    },
  },
});

const value = (
  id: string,
  collectionId = "fiction",
  url = `https://example.test/${id}`,
) => ({ id, collectionId, url, title: `Bookmark ${id}` });

const repositoryFor = (kv: Deno.Kv) => createKvRepository(kv, bookmarks);
type BookmarkRepository = ReturnType<typeof repositoryFor>;

async function withRepository<T>(
  callback: (
    repository: BookmarkRepository,
    kv: Deno.Kv,
  ) => T | Promise<T>,
): Promise<T> {
  const context = await openKvTestContext();
  try {
    return await callback(repositoryFor(context.kv), context.kv);
  } finally {
    context.close();
  }
}

Deno.test("AC-F004-001 · typed resources validate writes and stored values", async () => {
  await withRepository(async (repository, kv) => {
    const created = await repository.create("b1", value("b1"));
    assert.equal(created.ok, true);
    const entry = await repository.get("b1");
    assert.deepEqual(entry?.value, value("b1"));
    assert.equal(typeof entry?.versionstamp, "string");

    await assert.rejects(
      () => repository.create("bad", { ...value("bad"), title: "" }),
      (error: unknown) => error instanceof z.ZodError,
    );
    assert.equal(await repository.get("bad"), null);

    await kv.set(
      ["sh", "bookmarks", "primary", "corrupt"],
      { id: "corrupt", collectionId: "fiction", title: "missing URL" },
    );
    await assert.rejects(
      () => repository.get("corrupt"),
      (error: unknown) =>
        error instanceof KvDataError && error.code === "SH_KV_SCHEMA_INVALID",
    );
  });
});

Deno.test("AC-F004-002 · declared indexes are deterministic and bounded", async () => {
  await withRepository(async (repository) => {
    for (const id of ["c", "a", "b"]) {
      assert.equal((await repository.create(id, value(id))).ok, true);
    }
    assert.equal(
      (await repository.create("other", value("other", "history"))).ok,
      true,
    );

    const page = await repository.list({
      index: "byCollection",
      value: "fiction",
      limit: 100,
    });
    assert.deepEqual(page.items.map((entry) => entry.id), ["a", "b", "c"]);
    assert.equal(page.cursor, null);

    await assert.rejects(
      () =>
        repository.list({
          index: "byCollection",
          value: "fiction",
          limit: 0,
        }),
      RangeError,
    );
    await assert.rejects(
      () =>
        repository.list({
          index: "byCollection",
          value: "fiction",
          limit: 101,
        }),
      RangeError,
    );
    await assert.rejects(
      () =>
        repository.list({
          index: "missing" as "byCollection",
          value: "fiction",
          limit: 10,
        }),
      KvDataError,
    );
  });
});

Deno.test("AC-F004-003 · native cursors continue unchanged bounded queries", async () => {
  await withRepository(async (repository) => {
    for (const id of ["a", "b", "c", "d", "e"]) {
      await repository.create(id, value(id));
    }

    const first = await repository.list({
      index: "byCollection",
      value: "fiction",
      limit: 2,
    });
    assert.deepEqual(first.items.map((entry) => entry.id), ["a", "b"]);
    assert.equal(typeof first.cursor, "string");

    const second = await repository.list({
      index: "byCollection",
      value: "fiction",
      limit: 2,
      cursor: first.cursor!,
    });
    const third = await repository.list({
      index: "byCollection",
      value: "fiction",
      limit: 2,
      cursor: second.cursor!,
    });
    assert.deepEqual(
      [...first.items, ...second.items, ...third.items].map((entry) =>
        entry.id
      ),
      ["a", "b", "c", "d", "e"],
    );
    assert.equal(third.cursor, null);

    const descending = await repository.list({
      index: "byCollection",
      value: "fiction",
      limit: 2,
      direction: "desc",
    });
    assert.deepEqual(descending.items.map((entry) => entry.id), ["e", "d"]);
  });
});

Deno.test("AC-F004-004 · concurrent unique claims have one owner", async () => {
  await withRepository(async (repository) => {
    const url = "https://example.test/shared";
    const results = await Promise.all([
      repository.create("first", value("first", "fiction", url)),
      repository.create("second", value("second", "fiction", url)),
    ]);
    assert.equal(results.filter((result) => result.ok).length, 1);
    const winner = await repository.lookupUnique("byUrl", url);
    assert.ok(winner?.id === "first" || winner?.id === "second");
  });
});

Deno.test("AC-F004-005 · writes atomically maintain indexes and expose conflicts", async () => {
  await withRepository(async (repository) => {
    assert.equal((await repository.create("b1", value("b1"))).ok, true);
    const before = await repository.get("b1");
    assert.ok(before);

    assert.deepEqual(
      await repository.update("b1", value("b1", "history"), "stale"),
      { ok: false, reason: "conflict" },
    );
    const updatedValue = value(
      "b1",
      "history",
      "https://example.test/updated",
    );
    const updated = await repository.update(
      "b1",
      updatedValue,
      before.versionstamp,
    );
    assert.equal(updated.ok, true);
    assert.equal(
      (await repository.list({
        index: "byCollection",
        value: "fiction",
        limit: 10,
      })).items.length,
      0,
    );
    assert.equal(
      await repository.lookupUnique("byUrl", value("b1").url),
      null,
    );
    assert.equal(
      (await repository.lookupUnique("byUrl", updatedValue.url))?.id,
      "b1",
    );

    assert.deepEqual(
      await repository.delete("b1", "stale"),
      { ok: false, reason: "conflict" },
    );
    const current = await repository.get("b1");
    assert.ok(current);
    assert.equal(
      (await repository.delete("b1", current.versionstamp)).ok,
      true,
    );
    assert.equal(await repository.get("b1"), null);
    assert.equal(
      await repository.lookupUnique("byUrl", updatedValue.url),
      null,
    );
  });
});

Deno.test("AC-F004-006 · in-memory test contexts are isolated", async () => {
  const first = await openKvTestContext();
  const second = await openKvTestContext();
  try {
    const firstRepository = createKvRepository(first.kv, bookmarks);
    const secondRepository = createKvRepository(second.kv, bookmarks);
    await firstRepository.create("same", value("same", "first"));
    await secondRepository.create("same", value("same", "second"));
    assert.equal(
      (await firstRepository.get("same"))?.value.collectionId,
      "first",
    );
    assert.equal(
      (await secondRepository.get("same"))?.value.collectionId,
      "second",
    );
    first.close();
    assert.equal(
      (await secondRepository.get("same"))?.value.collectionId,
      "second",
    );
  } finally {
    first.close();
    second.close();
  }
});

Deno.test("AC-F004-007 · references and belongsTo use primary and index access", async () => {
  await withRepository(async (repository) => {
    await repository.create("b1", value("b1"));
    const reference = repository.reference("b1");
    assert.deepEqual(reference, { resource: "bookmarks", id: "b1" });
    assert.equal((await repository.resolve(reference))?.id, "b1");
    assert.deepEqual(
      (await repository.list({
        index: "byCollection",
        value: "fiction",
        limit: 10,
      })).items.map((entry) => entry.id),
      ["b1"],
    );
  });
});

Deno.test("AC-F004-008 · metadata distinguishes canonical and justified raw access", async () => {
  await withRepository((repository, kv) => {
    assert.equal(Object.isFrozen(repository.metadata), true);
    assert.deepEqual(repository.metadata, {
      access: "canonical",
      resource: "bookmarks",
      primaryKey: ["sh", "bookmarks", "primary", "<id>"],
      indexes: { byCollection: "belongsTo", byUrl: "unique" },
      maxPageSize: 100,
      operations: [
        "get",
        "create",
        "update",
        "delete",
        "lookupUnique",
        "list",
        "reference",
        "resolve",
      ],
    });
    assert.throws(
      () => rawKv(kv, { requirementId: "", reason: "" }),
      KvDataError,
    );
    const raw = rawKv(kv, {
      requirementId: "AC-APP-042",
      reason: "Use a purpose-specific KV queue",
    });
    assert.equal(raw.kv, kv);
    assert.deepEqual(raw.metadata, {
      access: "raw",
      requirementId: "AC-APP-042",
      reason: "Use a purpose-specific KV queue",
    });
    assert.equal(Object.isFrozen(raw.metadata), true);
  });
});

Deno.test("AC-F004-009 · canonical repositories expose no relational claims", async () => {
  await withRepository((repository) => {
    const surface = repository as unknown as Record<string, unknown>;
    assert.equal(surface.join, undefined);
    assert.equal(surface.cascade, undefined);
    assert.equal(surface.distributedTransaction, undefined);
    assert.doesNotMatch(
      repository.metadata.operations.join(" "),
      /join|cascade|distributed/i,
    );
  });
});
