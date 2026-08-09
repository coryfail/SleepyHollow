import { createKvRepository } from "@sleepy-hollow/framework/kv";

import { todos } from "./todo.ts";

export type TodoRepository = ReturnType<typeof build>;

function build(kv: Deno.Kv) {
  return createKvRepository(kv, todos);
}

let override: TodoRepository | undefined;

export function useTodoRepository(
  repository: TodoRepository | undefined,
): void {
  override = repository;
}

export async function todoRepository(): Promise<TodoRepository> {
  return override ?? build(await Deno.openKv());
}
