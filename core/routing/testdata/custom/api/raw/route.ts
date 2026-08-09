import { defineRoute } from "../../../../mod.ts";

export default defineRoute({
  GET: {
    schemas: { responses: { 202: "text/plain" } },
    security: { authentication: "none" },
    contract: { summary: "Stream custom text" },
    handler: () => new Response("custom", { status: 202 }),
  },
});
