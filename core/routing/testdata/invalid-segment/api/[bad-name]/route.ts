import { defineRoute } from "../../../../mod.ts";

export default defineRoute({
  GET: {
    schemas: { responses: { 200: "text/plain" } },
    security: { authentication: "none" },
    contract: { summary: "Invalid fixture" },
    handler: () => new Response("invalid"),
  },
});
