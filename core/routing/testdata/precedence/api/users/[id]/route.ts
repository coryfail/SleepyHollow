import { defineRoute } from "../../../../../mod.ts";

export default defineRoute({
  POST: {
    schemas: { params: { id: "string" }, responses: { 200: "text/plain" } },
    security: { authentication: "none" },
    contract: { summary: "Update a user by ID" },
    handler: ({ params }) => new Response(params.id),
  },
});
