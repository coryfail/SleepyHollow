import { defineResource } from "@sleepy-hollow/framework/database";

/** The portable relational shape behind the Todo example. */
export const todos = defineResource({
  name: "todos",
  primaryKey: "id",
  fields: {
    id: { kind: "uuid" },
    title: { kind: "text" },
    done: { kind: "boolean" },
    created_at: { kind: "timestamp" },
    version: { kind: "integer" },
  },
});
