import { KvDataError, type RawKvAccess } from "./types.ts";

export function rawKv(
  kv: Deno.Kv,
  justification: { readonly requirementId: string; readonly reason: string },
): RawKvAccess {
  const requirementId = justification.requirementId.trim();
  const reason = justification.reason.trim();
  if (!requirementId || !reason) {
    throw new KvDataError(
      "SH_KV_RAW_UNJUSTIFIED",
      "raw",
      "Raw KV access requires a requirement ID and non-empty reason",
    );
  }
  const metadata = Object.freeze({
    access: "raw" as const,
    requirementId,
    reason,
  });
  return Object.freeze({ kv, metadata });
}
