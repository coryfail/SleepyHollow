import { KvDataError, type RawKvAccess } from "./types.ts";

/**
 * Opens unmediated KV access, on the record.
 *
 * Bypassing a repository gives up schema validation and index maintenance, so
 * the escape hatch demands a requirement identifier and a reason and refuses
 * to open without them. Prefer {@linkcode createKvRepository}.
 *
 * @param kv The store to expose.
 * @param justification Which requirement needs raw access, and why.
 * @returns The store, carrying the justification as metadata.
 * @throws {KvDataError} When either part of the justification is empty.
 */
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
