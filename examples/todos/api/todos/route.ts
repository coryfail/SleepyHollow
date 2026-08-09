import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

import { todoRepository } from "../../models/repository.ts";

const createBody = z.object({ title: z.string().min(1).max(200) });
const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export default defineRoute({
  POST: {
    schemas: {
      body: { schema: createBody },
      responses: { 201: "application/json", 409: "application/problem+json" },
    },
    security: { authentication: { mode: "required" } },
    contract: { summary: "Create one todo" },
    handler: async ({ body, principal }) => {
      const repository = await todoRepository();
      const id = crypto.randomUUID();
      const value = {
        title: body.title,
        done: false,
        ownerId: principal!.id,
        createdAt: new Date().toISOString(),
      };
      const created = await repository.create(id, value);
      if (!created.ok) {
        return Response.json({
          title: "Conflict",
          status: 409,
          detail: "That todo already exists",
        }, { status: 409 });
      }
      return Response.json({ id, ...value }, { status: 201 });
    },
  },

  GET: {
    schemas: { query: listQuery, responses: { 200: "application/json" } },
    security: { authentication: { mode: "required" } },
    contract: { summary: "List the caller's todos" },
    handler: async ({ query, principal }) => {
      const repository = await todoRepository();
      const page = await repository.list({
        index: "owner",
        value: principal!.id,
        limit: query.limit,
      });
      return Response.json({
        items: page.items.map((entry) => ({ id: entry.id, ...entry.value })),
        cursor: page.cursor,
      });
    },
  },
});
