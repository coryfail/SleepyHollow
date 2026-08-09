import { defineRoute } from "../../../../../mod.ts";

export default defineRoute({
  GET: {
    schemas: { params: { id: "string" }, responses: { 200: "text/plain" } },
    security: { authentication: "none" },
    contract: { summary: "Find user by ID" },
    handler: ({ params }) => new Response(params.id),
  },
});
