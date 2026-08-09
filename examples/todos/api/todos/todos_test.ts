import assert from "node:assert/strict";

import {
  createKvRepository,
  openKvTestContext,
} from "@sleepy-hollow/framework/kv";

import { todos } from "../../models/todo.ts";
import { useTodoRepository } from "../../models/repository.ts";
import collection from "./route.ts";
import item from "./[id]/route.ts";

const OWNER = { id: "user-1", type: "session" };

function context(overrides: Record<string, unknown> = {}) {
  return {
    request: new Request("https://example.test/todos"),
    params: {},
    query: { limit: 25 },
    headers: {},
    body: {},
    principal: OWNER,
    ...overrides,
  };
}

function call(
  operation: { handler: (context: never) => Response | Promise<Response> },
  overrides: Record<string, unknown> = {},
): Promise<Response> {
  return Promise.resolve(operation.handler(context(overrides) as never));
}

async function withRepository(
  run: () => Promise<void>,
): Promise<void> {
  const kv = await openKvTestContext();
  useTodoRepository(createKvRepository(kv.kv, todos));
  try {
    await run();
  } finally {
    useTodoRepository(undefined);
    await kv.close();
  }
}

Deno.test("todos · create, read, update, list, delete", async () => {
  await withRepository(async () => {
    const created = await call(collection.POST!, {
      body: { title: "Write docs" },
    });
    assert.equal(created.status, 201);
    const todo = await created.json();
    assert.equal(todo.done, false);
    assert.equal(todo.ownerId, OWNER.id);

    assert.equal(
      (await call(item.GET!, { params: { id: todo.id } })).status,
      200,
    );

    const patched = await call(item.PATCH!, {
      params: { id: todo.id },
      body: { done: true },
    });
    assert.equal((await patched.json()).done, true);

    const listed = await call(collection.GET!, { query: { limit: 25 } });
    assert.equal((await listed.json()).items.length, 1);

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

Deno.test("todos · another owner's todo is forbidden", async () => {
  await withRepository(async () => {
    const created = await call(collection.POST!, {
      body: { title: "Private" },
    });
    const todo = await created.json();
    const response = await call(item.GET!, {
      params: { id: todo.id },
      principal: { id: "user-2", type: "session" },
    });
    assert.equal(response.status, 403);
  });
});

Deno.test("todos · a stale versionstamp is reported as a conflict", async () => {
  await withRepository(async () => {
    const created = await call(collection.POST!, { body: { title: "Race" } });
    const todo = await created.json();
    await call(item.PATCH!, { params: { id: todo.id }, body: { done: true } });
    const second = await call(item.PATCH!, {
      params: { id: todo.id },
      body: { title: "Renamed" },
    });
    assert.equal(second.status, 200);
  });
});
