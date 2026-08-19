import { createServer } from "http";
import { resolve } from "path";
import { pathToFileURL } from "url";

export type FetchHandler = (request: Request) => Response | Promise<Response>;

function nodeRequest(request: import("http").IncomingMessage): Request {
  const origin = `http://${request.headers.host ?? "localhost"}`;
  return new Request(new URL(request.url ?? "/", origin), {
    method: request.method,
    headers: request.headers as HeadersInit,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request,
    // Node requires this for streaming request bodies.
    duplex: "half",
  } as RequestInit);
}

/** Starts the Node HTTP adapter for a framework fetch handler. */
export function serve(handler: FetchHandler, options: { readonly port?: number; readonly hostname?: string } = {}) {
  const server = createServer(async (incoming, outgoing) => {
    try {
      const response = await handler(nodeRequest(incoming));
      outgoing.statusCode = response.status;
      response.headers.forEach((value, name) => outgoing.setHeader(name, value));
      const body = response.body ? Buffer.from(await response.arrayBuffer()) : undefined;
      outgoing.end(body);
    } catch {
      outgoing.statusCode = 500;
      outgoing.setHeader("content-type", "application/problem+json");
      outgoing.end(JSON.stringify({ type: "about:blank", title: "Internal Server Error", status: 500 }));
    }
  });
  server.listen(options.port ?? Number(process.env.PORT ?? 3000), options.hostname ?? "0.0.0.0");
  return server;
}

async function startConfiguredApplication(): Promise<void> {
  const entry = process.env.HOLLOW_APP_MODULE;
  if (!entry) throw new Error("HOLLOW_APP_MODULE must name the compiled application module.");
  const loaded = await import(pathToFileURL(resolve(entry)).href) as { fetch?: unknown; default?: unknown };
  const handler = typeof loaded.fetch === "function" ? loaded.fetch : loaded.default;
  if (typeof handler !== "function") throw new Error("The configured application module must export a fetch handler.");
  serve(handler as FetchHandler);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startConfiguredApplication();
}
