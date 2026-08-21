import { createServer } from "http";
import { resolve } from "path";
import { pathToFileURL } from "url";

export type FetchHandler = (request: Request) => Response | Promise<Response>;

export interface ServerOptions {
  readonly port?: number;
  readonly hostname?: string;
  readonly signal?: AbortSignal;
  readonly onListen?: () => void | Promise<void>;
}

export interface HttpServer {
  /** Resolves only after the underlying Node listener emits `listening`. */
  readonly ready: Promise<void>;
  /** Resolves on a normal close and rejects on a post-bind server failure. */
  readonly finished: Promise<void>;
  /** Stops accepting connections and waits for the listener to close. */
  shutdown(): Promise<void>;
}

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
export function serve(handler: FetchHandler, options: ServerOptions = {}): HttpServer {
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

  let readySettled = false;
  let finishedSettled = false;
  let closing: Promise<void> | undefined;
  let closingRequested = false;
  let resolveReady!: () => void;
  let rejectReady!: (error: unknown) => void;
  let resolveFinished!: () => void;
  let rejectFinished!: (error: unknown) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  const closeNow = (): Promise<void> => new Promise((resolve, reject) => {
    server.close((error) => {
      if (error && (error as NodeJS.ErrnoException).code !== "ERR_SERVER_NOT_RUNNING") {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  const shutdown = (): Promise<void> => {
    closingRequested = true;
    if (closing !== undefined) return closing;
    if (!server.listening) {
      closing = Promise.resolve();
      return closing;
    }
    closing = closeNow();
    return closing;
  };

  const fail = (error: unknown): void => {
    if (!readySettled) {
      readySettled = true;
      rejectReady(error);
      return;
    }
    if (!finishedSettled) {
      finishedSettled = true;
      rejectFinished(error);
    }
  };

  server.on("error", fail);
  server.once("close", () => {
    if (!readySettled) {
      readySettled = true;
      rejectReady(new Error("The HTTP server closed before it became ready."));
    }
    if (!finishedSettled) {
      finishedSettled = true;
      resolveFinished();
    }
  });
  server.once("listening", async () => {
    try {
      await options.onListen?.();
      if (closingRequested) {
        await closeNow();
        return;
      }
      if (!readySettled) {
        readySettled = true;
        resolveReady();
      }
    } catch (error) {
      fail(error);
      await shutdown().catch(() => undefined);
    }
  });

  if (options.signal) {
    const onAbort = () => {
      void shutdown();
    };
    if (options.signal.aborted) onAbort();
    else options.signal.addEventListener("abort", onAbort, { once: true });
    server.once("close", () => options.signal?.removeEventListener("abort", onAbort));
  }

  try {
    server.listen(
      options.port ?? Number(process.env.PORT ?? 3000),
      options.hostname ?? "0.0.0.0",
    );
  } catch (error) {
    fail(error);
  }

  // A caller may intentionally use only `shutdown`; mark these promises as
  // handled while preserving their rejection for callers that await them.
  void ready.catch(() => undefined);
  void finished.catch(() => undefined);
  return { ready, finished, shutdown };
}

async function startConfiguredApplication(): Promise<void> {
  const entry = process.env.HOLLOW_APP_MODULE;
  if (!entry) throw new Error("HOLLOW_APP_MODULE must name the compiled application module.");
  const loaded = await import(pathToFileURL(resolve(entry)).href) as { fetch?: unknown; default?: unknown };
  const handler = typeof loaded.fetch === "function" ? loaded.fetch : loaded.default;
  if (typeof handler !== "function") throw new Error("The configured application module must export a fetch handler.");
  const server = serve(handler as FetchHandler);
  await server.ready;
  await server.finished;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startConfiguredApplication();
}
