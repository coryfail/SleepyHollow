import type { z } from "zod";

import { KvDataError } from "./types.ts";
import type {
  KvIndexDefinitions,
  KvResourceDefinition,
  StorageKeyPart,
} from "./types.ts";

const identifier = /^[A-Za-z][A-Za-z0-9_-]*$/;

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
