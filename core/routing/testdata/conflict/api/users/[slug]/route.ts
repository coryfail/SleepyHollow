import { defineRoute } from "../../../../../mod.ts";

export default defineRoute({
  GET: {
    schemas: { params: { slug: "string" }, responses: { 200: "text/plain" } },
    security: { authentication: { mode: "none" } },
    contract: { summary: "Find user by slug" },
    handler: ({ params }) => new Response(params.slug),
  },
});
