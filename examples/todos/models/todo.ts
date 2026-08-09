import { defineKvResource } from "@sleepy-hollow/framework/kv";
import { z } from "@sleepy-hollow/framework/validation";

export const todoValue = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean(),
  ownerId: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const todos = defineKvResource({
  name: "todos",
  id: z.string().uuid(),
  value: todoValue,
  indexes: {
    owner: { kind: "index", value: (todo) => todo.ownerId },
  },
});
