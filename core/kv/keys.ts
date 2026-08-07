import { KvDataError, type StorageKeyPart } from "./types.ts";

export function storageKeyPart(
  value: unknown,
  location: string,
): StorageKeyPart {
  if (
    typeof value === "string" || typeof value === "number" ||
    typeof value === "bigint" || typeof value === "boolean" ||
    value instanceof Uint8Array
  ) {
    return value;
  }
  throw new KvDataError(
    "SH_KV_KEY_INVALID",
    location,
    "Expected a persistent Deno KV key part",
  );
}

export function primaryKey(
  resource: string,
  id: StorageKeyPart,
): Deno.KvKey {
  return ["sh", resource, "primary", id];
}

export function pointerIndexKey(
  resource: string,
  index: string,
  kind: "index" | "belongsTo" | "unique",
  value: StorageKeyPart,
  id: StorageKeyPart,
): Deno.KvKey {
  return kind === "unique"
    ? ["sh", resource, "unique", index, value]
    : ["sh", resource, "index", index, value, id];
}

function partEquals(left: Deno.KvKeyPart, right: Deno.KvKeyPart): boolean {
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return left.length === right.length &&
      left.every((value, index) => value === right[index]);
  }
  return Object.is(left, right);
}

export function keyEquals(left: Deno.KvKey, right: Deno.KvKey): boolean {
  return left.length === right.length &&
    left.every((part, index) => partEquals(part, right[index]));
}
