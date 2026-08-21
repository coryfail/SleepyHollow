import { defineRoute } from "../../../../mod.ts";

export default defineRoute({
  GET: {
    schemas: { responses: { 200: "text/plain" } },
    security: { authentication: { mode: "none" } },
    contract: { summary: "Report process health" },
    handler: () => new Response("healthy"),
  },
});
