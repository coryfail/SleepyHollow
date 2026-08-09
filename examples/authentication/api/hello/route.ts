import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

const greeting = z.object({ greeting: z.string() }).strict();

const problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  instance: z.string(),
}).strict();

export default defineRoute({
  GET: {
    schemas: { responses: { 200: greeting, 401: problem } },
    security: {
      authentication: {
        mode: "required",
        provider: "project-auth",
        requirementId: "AC-HELLO-002",
      },
    },
    contract: { summary: "Greet the authenticated caller" },
    // The runtime guarantees a principal here, because the route declares a
    // required authentication mode and an anonymous request is refused before
    // the handler is reached. The assertion is a known gap in the types rather
    // than a check the runtime needs; see docs/framework/routing.md.
    handler: ({ principal }) =>
      Response.json({ greeting: `Hello, ${principal!.id}` }),
  },
});
