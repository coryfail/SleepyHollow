import { defineRoute } from "../../../../../mod.ts";

export default defineRoute({
  GET: {
    schemas: { params: { id: "string" }, responses: { 200: "text/plain" } },
    security: { authentication: "none" },
    contract: { summary: "Return one bookmark identifier" },
    handler: ({ params }) => new Response(params.id),
  },
});
