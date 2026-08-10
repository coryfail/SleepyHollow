import { defineRoute } from "../routing/mod.ts";
import { z } from "./mod.ts";

const inferredRoute = defineRoute({
  POST: {
    schemas: {
      params: z.strictObject({ collectionId: z.string() }),
      query: z.strictObject({ notify: z.stringbool() }),
      headers: z.object({ "idempotency-key": z.string() }),
      body: {
        schema: z.strictObject({ title: z.string(), priority: z.int() }),
        maxBytes: 1024,
      },
      responses: { 201: z.strictObject({ id: z.string() }) },
    },
    security: { authentication: "none" },
    contract: { summary: "Create a bookmark" },
    handler: ({ params, query, headers, body }) => {
      const collectionId: string = params.collectionId;
      const notify: boolean = query.notify;
      const idempotencyKey: string = headers["idempotency-key"];
      const title: string = body.title;
      const priority: number = body.priority;

      // @ts-expect-error Zod output inference must not widen collectionId.
      const invalidCollectionId: number = params.collectionId;

      return Response.json({
        collectionId,
        notify,
        idempotencyKey,
        title,
        priority,
        invalidCollectionId,
      }, { status: 201 });
    },
  },
});

inferredRoute satisfies object;
