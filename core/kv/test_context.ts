import type { KvTestContext } from "./types.ts";

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
