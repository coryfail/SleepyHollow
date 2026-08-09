import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

import { todoRepository } from "../../../models/repository.ts";

const patchBody = z.object({
  title: z.string().min(1).max(200).optional(),
  done: z.boolean().optional(),
});

const problem = (title: string, status: number) =>
  Response.json({ title, status }, { status });

export default defineRoute({
  GET: {
    schemas: {
      params: { id: "string" },
      responses: {
        200: "application/json",
        403: "application/problem+json",
        404: "application/problem+json",
      },
    },
    security: { authentication: { mode: "required" } },
    contract: { summary: "Read one todo" },
    handler: async ({ params, principal }) => {
      const repository = await todoRepository();
      const entry = await repository.get(params.id);
      if (!entry) return problem("Not Found", 404);
      if (entry.value.ownerId !== principal!.id) {
        return problem("Forbidden", 403);
      }
      return Response.json({ id: entry.id, ...entry.value });
    },
  },

  PATCH: {
    schemas: {
      params: { id: "string" },
      body: { schema: patchBody },
      responses: {
        200: "application/json",
        403: "application/problem+json",
        404: "application/problem+json",
        409: "application/problem+json",
      },
    },
    security: { authentication: { mode: "required" } },
    contract: { summary: "Update one todo" },
    handler: async ({ params, body, principal }) => {
      const repository = await todoRepository();
      const entry = await repository.get(params.id);
      if (!entry) return problem("Not Found", 404);
      if (entry.value.ownerId !== principal!.id) {
        return problem("Forbidden", 403);
      }
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
    schemas: {
      params: { id: "string" },
      responses: {
        204: "application/json",
        403: "application/problem+json",
        404: "application/problem+json",
      },
    },
    security: { authentication: { mode: "required" } },
    contract: { summary: "Delete one todo" },
    handler: async ({ params, principal }) => {
      const repository = await todoRepository();
      const entry = await repository.get(params.id);
      if (!entry) return problem("Not Found", 404);
      if (entry.value.ownerId !== principal!.id) {
        return problem("Forbidden", 403);
      }
      await repository.delete(params.id, entry.versionstamp);
      return new Response(null, { status: 204 });
    },
  },
});
