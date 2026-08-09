import type { z } from "zod";

import { KvDataError } from "./types.ts";
import type {
  KvIndexDefinitions,
  KvResourceDefinition,
  StorageKeyPart,
} from "./types.ts";

const identifier = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 * Declares a stored resource: its name, its schemas, and its indexes.
 *
 * The declaration is validated eagerly, so a malformed resource name or index
 * stops the process at startup rather than on the first write that uses it.
 *
 * ```ts
 * import { defineKvResource } from "@sleepy-hollow/framework/kv";
 * import { z } from "@sleepy-hollow/framework/validation";
 *
 * const bookmarks = defineKvResource({
 *   name: "bookmark",
 *   id: z.string(),
 *   value: z.object({ url: z.string(), ownerId: z.string() }).strict(),
 *   indexes: {
 *     byOwner: { kind: "index", value: (b) => b.ownerId },
 *     byUrl: { kind: "unique", value: (b) => b.url },
 *   },
 * });
 * ```
 *
 * @param definition The resource's name, schemas, and indexes.
 * @returns The validated definition, for {@linkcode createKvRepository}.
 * @throws {KvDataError} When the name or an index declaration is malformed.
 */
export function defineKvResource<
  const Name extends string,
  IdSchema extends z.ZodType<StorageKeyPart>,
  ValueSchema extends z.ZodType,
  const Indexes extends KvIndexDefinitions<z.output<ValueSchema>>,
>(definition: {
  readonly name: Name;
  readonly id: IdSchema;
  readonly value: ValueSchema;
  readonly indexes: Indexes;
}): KvResourceDefinition<Name, IdSchema, ValueSchema, Indexes> {
  if (!identifier.test(definition.name)) {
    throw new KvDataError(
      "SH_KV_RESOURCE_INVALID",
      "resource.name",
      "Use a non-empty stable resource identifier",
    );
  }

  const indexes = Object.fromEntries(
    Object.entries(definition.indexes).sort(([left], [right]) =>
      left.localeCompare(right)
    ).map(([name, index]) => {
      if (!identifier.test(name)) {
        throw new KvDataError(
          "SH_KV_INDEX_INVALID",
          `indexes.${name}`,
          "Use a non-empty stable index identifier",
        );
      }
      if (
        !["index", "unique", "belongsTo"].includes(index.kind) ||
        typeof index.value !== "function"
      ) {
        throw new KvDataError(
          "SH_KV_INDEX_INVALID",
          `indexes.${name}`,
          "Declare a supported pointer index kind and value function",
        );
      }
      return [name, Object.freeze({ ...index })];
    }),
  ) as Indexes;

  return Object.freeze({ ...definition, indexes: Object.freeze(indexes) });
}
