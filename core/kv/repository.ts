import type { z } from "zod";

import {
  keyEquals,
  pointerIndexKey,
  primaryKey,
  storageKeyPart,
} from "./keys.ts";
import {
  KvDataError,
  type KvIndexDefinitions,
  type KvMutationResult,
  type KvPage,
  type KvRepository,
  type KvRepositoryMetadata,
  type KvResourceDefinition,
  type KvResourceEntry,
  type StorageKeyPart,
} from "./types.ts";

interface PreparedIndex {
  readonly name: string;
  readonly kind: "index" | "unique" | "belongsTo";
  readonly key: Deno.KvKey;
}

const conflict = (): KvMutationResult => ({ ok: false, reason: "conflict" });

function dataError(location: string, message: string): KvDataError {
  return new KvDataError("SH_KV_SCHEMA_INVALID", location, message);
}

export function createKvRepository<
  Name extends string,
  IdSchema extends z.ZodType<StorageKeyPart>,
  ValueSchema extends z.ZodType,
  Indexes extends KvIndexDefinitions<z.output<ValueSchema>>,
>(
  kv: Deno.Kv,
  definition: KvResourceDefinition<Name, IdSchema, ValueSchema, Indexes>,
): KvRepository<Name, z.output<IdSchema>, z.output<ValueSchema>, Indexes> {
  type Id = z.output<IdSchema>;
  type Value = z.output<ValueSchema>;

  const parseId = async (input: Id): Promise<Id & StorageKeyPart> =>
    storageKeyPart(
      await definition.id.parseAsync(input),
      `${definition.name}.id`,
    ) as Id & StorageKeyPart;

  const parseWriteValue = (input: Value): Promise<Value> =>
    definition.value.parseAsync(input);

  const parseStoredValue = async (
    input: unknown,
    location: string,
  ): Promise<Value> => {
    const result = await definition.value.safeParseAsync(input);
    if (!result.success) {
      throw dataError(location, "Stored resource does not match its schema");
    }
    return result.data;
  };

  const preparedIndexes = (value: Value, id: StorageKeyPart): PreparedIndex[] =>
    Object.entries(definition.indexes).map(([name, index]) => {
      let raw: unknown;
      try {
        raw = index.value(value);
      } catch {
        throw new KvDataError(
          "SH_KV_INDEX_INVALID",
          `${definition.name}.indexes.${name}`,
          "The index value function failed",
        );
      }
      const part = storageKeyPart(
        raw,
        `${definition.name}.indexes.${name}`,
      );
      return {
        name,
        kind: index.kind,
        key: pointerIndexKey(definition.name, name, index.kind, part, id),
      };
    });

  const readPrimary = async (
    id: Id & StorageKeyPart,
  ): Promise<KvResourceEntry<Id, Value> | null> => {
    const key = primaryKey(definition.name, id);
    const stored = await kv.get<unknown>(key);
    if (stored.value === null) return null;
    const value = await parseStoredValue(
      stored.value,
      `${definition.name}.primary`,
    );
    return { id, value, versionstamp: stored.versionstamp };
  };

  const idFromPointer = async (
    pointer: unknown,
  ): Promise<Id & StorageKeyPart> => {
    if (
      !Array.isArray(pointer) || pointer.length !== 4 || pointer[0] !== "sh" ||
      pointer[1] !== definition.name || pointer[2] !== "primary"
    ) {
      throw dataError(
        `${definition.name}.index`,
        "Stored index pointer is invalid",
      );
    }
    return await parseId(pointer[3] as Id);
  };

  const readPointer = async (
    pointer: unknown,
  ): Promise<KvResourceEntry<Id, Value>> => {
    const id = await idFromPointer(pointer);
    const entry = await readPrimary(id);
    if (!entry) {
      throw dataError(
        `${definition.name}.index`,
        "Stored index pointer has no primary resource",
      );
    }
    return entry;
  };

  const primaryShape: KvRepositoryMetadata["primaryKey"] = [
    "sh",
    definition.name,
    "primary",
    "<id>",
  ];
  const operations: KvRepositoryMetadata["operations"] = [
    "get",
    "create",
    "update",
    "delete",
    "lookupUnique",
    "list",
    "reference",
    "resolve",
  ];
  const metadata: KvRepositoryMetadata = Object.freeze({
    access: "canonical",
    resource: definition.name,
    primaryKey: Object.freeze(primaryShape),
    indexes: Object.freeze(Object.fromEntries(
      Object.entries(definition.indexes).map(([name, index]) => [
        name,
        index.kind,
      ]),
    )),
    maxPageSize: 100,
    operations: Object.freeze(operations),
  });

  const repository: KvRepository<Name, Id, Value, Indexes> = {
    metadata,

    async get(id) {
      return await readPrimary(await parseId(id));
    },

    async create(id, input) {
      const parsedId = await parseId(id);
      const value = await parseWriteValue(input);
      const key = primaryKey(definition.name, parsedId);
      const indexes = preparedIndexes(value, parsedId);
      let operation = kv.atomic().check({ key, versionstamp: null });
      for (const index of indexes) {
        if (index.kind === "unique") {
          operation = operation.check({ key: index.key, versionstamp: null });
        }
      }
      operation = operation.set(key, value);
      for (const index of indexes) operation = operation.set(index.key, key);
      const result = await operation.commit();
      return result.ok
        ? { ok: true, versionstamp: result.versionstamp }
        : conflict();
    },

    async update(id, input, versionstamp) {
      const parsedId = await parseId(id);
      const value = await parseWriteValue(input);
      const key = primaryKey(definition.name, parsedId);
      const current = await kv.get<unknown>(key);
      if (
        current.value === null || current.versionstamp !== versionstamp
      ) return conflict();
      const previous = await parseStoredValue(
        current.value,
        `${definition.name}.primary`,
      );
      const oldIndexes = preparedIndexes(previous, parsedId);
      const newIndexes = preparedIndexes(value, parsedId);
      let operation = kv.atomic().check({ key, versionstamp });

      for (const next of newIndexes) {
        const prior = oldIndexes.find((index) => index.name === next.name);
        if (
          next.kind === "unique" &&
          (!prior || !keyEquals(prior.key, next.key))
        ) {
          operation = operation.check({ key: next.key, versionstamp: null });
        }
      }
      for (const prior of oldIndexes) {
        const next = newIndexes.find((index) => index.name === prior.name);
        if (!next || !keyEquals(prior.key, next.key)) {
          operation = operation.delete(prior.key);
        }
      }
      operation = operation.set(key, value);
      for (const index of newIndexes) operation = operation.set(index.key, key);
      const result = await operation.commit();
      return result.ok
        ? { ok: true, versionstamp: result.versionstamp }
        : conflict();
    },

    async delete(id, versionstamp) {
      const parsedId = await parseId(id);
      const key = primaryKey(definition.name, parsedId);
      const current = await kv.get<unknown>(key);
      if (
        current.value === null || current.versionstamp !== versionstamp
      ) return conflict();
      const value = await parseStoredValue(
        current.value,
        `${definition.name}.primary`,
      );
      let operation = kv.atomic().check({ key, versionstamp }).delete(key);
      for (const index of preparedIndexes(value, parsedId)) {
        operation = operation.delete(index.key);
      }
      const result = await operation.commit();
      return result.ok
        ? { ok: true, versionstamp: result.versionstamp }
        : conflict();
    },

    async lookupUnique(indexName, input) {
      const index = definition.indexes[indexName];
      if (!index || index.kind !== "unique") {
        throw new KvDataError(
          "SH_KV_INDEX_INVALID",
          `${definition.name}.indexes.${indexName}`,
          "Lookup requires a declared unique index",
        );
      }
      const value = storageKeyPart(
        input,
        `${definition.name}.indexes.${indexName}`,
      );
      const key = pointerIndexKey(
        definition.name,
        indexName,
        "unique",
        value,
        value,
      );
      const pointer = await kv.get<unknown>(key);
      return pointer.value === null ? null : await readPointer(pointer.value);
    },

    async list(options): Promise<KvPage<Id, Value>> {
      const index = definition.indexes[options.index];
      if (!index || index.kind === "unique") {
        throw new KvDataError(
          "SH_KV_INDEX_INVALID",
          `${definition.name}.indexes.${options.index}`,
          "List requires a declared non-unique or belongsTo index",
        );
      }
      if (
        !Number.isSafeInteger(options.limit) || options.limit < 1 ||
        options.limit > 100
      ) {
        throw new RangeError(
          "KV page limit must be an integer from 1 through 100",
        );
      }
      const value = storageKeyPart(
        options.value,
        `${definition.name}.indexes.${options.index}`,
      );
      const prefix: Deno.KvKey = [
        "sh",
        definition.name,
        "index",
        options.index,
        value,
      ];
      const iterator = kv.list<unknown>({ prefix }, {
        limit: options.limit + 1,
        ...(options.cursor ? { cursor: options.cursor } : {}),
        reverse: options.direction === "desc",
        consistency: "strong",
      });
      const pointers: unknown[] = [];
      let exhausted = false;
      for (let count = 0; count < options.limit; count += 1) {
        const item = await iterator.next();
        if (item.done) {
          exhausted = true;
          break;
        }
        pointers.push(item.value.value);
      }
      let cursor: string | null = null;
      if (!exhausted) {
        const continuation = iterator.cursor;
        if (!(await iterator.next()).done) cursor = continuation;
      }
      const items: KvResourceEntry<Id, Value>[] = [];
      for (const pointer of pointers) items.push(await readPointer(pointer));
      return { items, cursor };
    },

    reference(id) {
      return Object.freeze({ resource: definition.name, id });
    },

    async resolve(reference) {
      if (reference.resource !== definition.name) {
        throw new KvDataError(
          "SH_KV_REFERENCE_INVALID",
          `${definition.name}.reference`,
          "Reference belongs to a different resource",
        );
      }
      return await readPrimary(await parseId(reference.id));
    },
  };

  return Object.freeze(repository);
}
