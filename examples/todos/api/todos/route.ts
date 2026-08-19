import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

import { todoRepository } from "../../models/repository.ts";

const todoShape = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.string(),
}).strict();

const problemShape = z.object({ title: z.string(), status: z.number() })
  .strict();

const createBody = z.object({ title: z.string().min(1).max(200) }).strict();

const listQuery = z.object({
  done: z.enum(["true", "false"]).default("false").transform((v) =>
    v === "true"
  ),
  limit: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export default defineRoute({
  POST: {
    schemas: {
      body: { schema: createBody, maxBytes: 4096 },
      responses: { 201: todoShape, 422: problemShape },
    },
    security: { authentication: { mode: "none" } },
    contract: { summary: "Create one todo" },
    handler: async ({ body }) => {
      const repository = await todoRepository();
      const id = crypto.randomUUID();
      const value = {
        title: body.title,
        done: false,
        createdAt: new Date().toISOString(),
      };
      await repository.create(id, value);
      return Response.json({ id, ...value }, { status: 201 });
    },
  },

  GET: {
    schemas: {
      query: listQuery,
      responses: {
        200: z.object({
          items: z.array(todoShape),
          cursor: z.string().nullable(),
        }).strict(),
      },
    },
    security: { authentication: { mode: "none" } },
    contract: { summary: "List todos by done state" },
    handler: async ({ query }) => {
      const repository = await todoRepository();
      const page = await repository.list({ done: query.done, limit: query.limit });
      return Response.json({
        items: page.items.map((entry) => ({ id: entry.id, ...entry.value })),
        cursor: page.cursor,
      });
    },
  },
});
