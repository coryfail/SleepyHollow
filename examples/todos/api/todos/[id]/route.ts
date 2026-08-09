import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

import { todoRepository } from "../../../models/repository.ts";

const todoShape = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
  createdAt: z.string(),
}).strict();

const problemShape = z.object({ title: z.string(), status: z.number() })
  .strict();

const params = z.object({ id: z.string() }).strict();

const patchBody = z.object({
  title: z.string().min(1).max(200).optional(),
  done: z.boolean().optional(),
}).strict();

const problem = (title: string, status: number) =>
  Response.json({ title, status }, { status });

export default defineRoute({
  GET: {
    schemas: { params, responses: { 200: todoShape, 404: problemShape } },
    security: { authentication: "none" },
    contract: { summary: "Read one todo" },
    handler: async ({ params }) => {
      const repository = await todoRepository();
      const entry = await repository.get(params.id);
      if (!entry) return problem("Not Found", 404);
      return Response.json({ id: entry.id, ...entry.value });
    },
  },

  PATCH: {
    schemas: {
      params,
      body: { schema: patchBody, maxBytes: 4096 },
      responses: { 200: todoShape, 404: problemShape, 409: problemShape },
    },
    security: { authentication: "none" },
    contract: { summary: "Update one todo" },
    handler: async ({ params, body }) => {
      const repository = await todoRepository();
      const entry = await repository.get(params.id);
      if (!entry) return problem("Not Found", 404);
      const next = {
        ...entry.value,
        ...(body.title === undefined ? {} : { title: body.title }),
        ...(body.done === undefined ? {} : { done: body.done }),
      };
      const updated = await repository.update(
        params.id,
        next,
        entry.versionstamp,
      );
      if (!updated.ok) return problem("Conflict", 409);
      return Response.json({ id: params.id, ...next });
    },
  },

  DELETE: {
    schemas: { params, responses: { 204: null, 404: problemShape } },
    security: { authentication: "none" },
    contract: { summary: "Delete one todo" },
    handler: async ({ params }) => {
      const repository = await todoRepository();
      const entry = await repository.get(params.id);
      if (!entry) return problem("Not Found", 404);
      await repository.delete(params.id, entry.versionstamp);
      return new Response(null, { status: 204 });
    },
  },
});
