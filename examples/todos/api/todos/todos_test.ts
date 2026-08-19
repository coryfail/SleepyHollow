import assert from "assert/strict";

import { openEmbeddedSqlite } from "@sleepy-hollow/framework/database";

import { createTodoRepository, useTodoRepository } from "../../models/repository.ts";
import collection from "./route.ts";
import item from "./[id]/route.ts";

function call(
  operation: { handler: (context: never) => Response | Promise<Response> },
  overrides: Record<string, unknown> = {},
): Promise<Response> {
  return Promise.resolve(operation.handler({
    request: new Request("https://example.test/todos"),
    params: {},
    query: { limit: 25 },
    headers: {},
    body: {},
    ...overrides,
  } as never));
}

async function withRepository(run: () => Promise<void>): Promise<void> {
  const database = openEmbeddedSqlite({ filename: ":memory:" });
  useTodoRepository(createTodoRepository(database));
  try {
    await run();
  } finally {
    useTodoRepository(undefined);
    database.close();
  }
}

async function create(title: string): Promise<Record<string, string>> {
  const response = await call(collection.POST!, { body: { title } });
  assert.equal(response.status, 201);
  return await response.json();
}

test("AC-TODOS-001 · a valid create returns the stored todo, not done", async () => {
  await withRepository(async () => {
    const todo = await create("Write docs");
    assert.equal(todo.title, "Write docs");
    assert.equal(todo.done as unknown, false);
    assert.ok(todo.id);
  });
});

test("AC-TODOS-002 · listing returns only todos matching the done state", async () => {
  await withRepository(async () => {
    const open = await create("Open item");
    await call(item.PATCH!, { params: { id: open.id }, body: { done: true } });
    await create("Still open");

    const done =
      await (await call(collection.GET!, { query: { done: true, limit: 25 } }))
        .json();
    assert.deepEqual(done.items.map((t: { title: string }) => t.title), [
      "Open item",
    ]);

    const pending =
      await (await call(collection.GET!, { query: { done: false, limit: 25 } }))
        .json();
    assert.deepEqual(pending.items.map((t: { title: string }) => t.title), [
      "Still open",
    ]);
  });
});

test("AC-TODOS-003 · listing uses the declared done index with a bounded limit", async () => {
  await withRepository(async () => {
    await create("One");
    await create("Two");
    const body =
      await (await call(collection.GET!, { query: { done: false, limit: 1 } }))
        .json();
    assert.equal(body.items.length, 1);
    assert.ok("cursor" in body);
  });
});

test("AC-TODOS-004 · an unknown identifier returns 404", async () => {
  await withRepository(async () => {
    const response = await call(item.GET!, {
      params: { id: crypto.randomUUID() },
    });
    assert.equal(response.status, 404);
  });
});

test("AC-TODOS-005 · an update replaces only the supplied fields", async () => {
  await withRepository(async () => {
    const todo = await create("Before");
    const updated = await (await call(item.PATCH!, {
      params: { id: todo.id },
      body: { done: true },
    })).json();
    assert.equal(updated.done, true);
    assert.equal(updated.title, "Before");
  });
});

test("AC-TODOS-006 · a delete removes the todo and later reads return 404", async () => {
  await withRepository(async () => {
    const todo = await create("Temporary");
    assert.equal(
      (await call(item.DELETE!, { params: { id: todo.id } })).status,
      204,
    );
    assert.equal(
      (await call(item.GET!, { params: { id: todo.id } })).status,
      404,
    );
  });
});
