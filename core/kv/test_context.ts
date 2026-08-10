import type { KvTestContext } from "./types.ts";

/**
 * Opens an in-memory KV store for one test.
 *
 * Each context is isolated, so tests sharing a resource do not share state.
 * Close it when the test ends; closing twice is safe.
 *
 * @returns The store, and the handle that disposes it.
 */
export async function openKvTestContext(): Promise<KvTestContext> {
  const kv = await Deno.openKv(":memory:");
  let closed = false;
  return Object.freeze({
    kv,
    close() {
      if (closed) return;
      closed = true;
      kv.close();
    },
  });
}
