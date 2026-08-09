import type { z } from "zod";

/** A Deno KV key part usable as a storage key: symbols are not storable. */
export type StorageKeyPart = Exclude<Deno.KvKeyPart, symbol>;

/**
 * How an index behaves: `index` permits repeats, `unique` refuses them, and
 * `belongsTo` marks an index that points at another resource's identifier.
 */
export type KvIndexKind = "index" | "unique" | "belongsTo";

/** One secondary index: its kind, and how to derive its key from a record. */
export interface KvIndexDefinition<Value> {
  /** Whether the index permits repeats, refuses them, or names an owner. */
  readonly kind: KvIndexKind;
  /** Derives this index's key part from the record being written. */
  readonly value: (value: Value) => StorageKeyPart;
}

/** Every secondary index of a resource, keyed by index name. */
export type KvIndexDefinitions<Value> = Readonly<
  Record<string, KvIndexDefinition<Value>>
>;

/**
 * A stored resource: its name, the schemas its identifier and value must
 * satisfy, and the indexes maintained alongside it.
 */
export interface KvResourceDefinition<
  Name extends string,
  IdSchema extends z.ZodType<StorageKeyPart>,
  ValueSchema extends z.ZodType,
  Indexes extends KvIndexDefinitions<z.output<ValueSchema>>,
> {
  /** Identifies the resource, and namespaces every key it writes. */
  readonly name: Name;
  /** Schema every identifier must satisfy. */
  readonly id: IdSchema;
  /** Schema every stored value must satisfy. */
  readonly value: ValueSchema;
  /** Secondary indexes maintained with each mutation. */
  readonly indexes: Indexes;
}

/** One stored record, with the versionstamp a later write must present. */
export interface KvResourceEntry<Id, Value> {
  /** The record's identifier. */
  readonly id: Id;
  /** The stored value. */
  readonly value: Value;
  /** Version at the time of the read; required to update or delete. */
  readonly versionstamp: string;
}

/**
 * The outcome of a write: either it committed, or it lost to a concurrent
 * change and the caller must re-read before retrying.
 */
export type KvMutationResult =
  | { readonly ok: true; readonly versionstamp: string }
  | { readonly ok: false; readonly reason: "conflict" };

/** One page of a bounded list, with the cursor that continues it. */
export interface KvPage<Id, Value> {
  /** The records on this page. */
  readonly items: readonly KvResourceEntry<Id, Value>[];
  /** Cursor for the next page, or `null` when the listing is exhausted. */
  readonly cursor: string | null;
}

/** A pointer to a record of another resource, resolvable through its owner. */
export interface KvReference<Name extends string, Id> {
  /** Name of the resource the identifier belongs to. */
  readonly resource: Name;
  /** The referenced record's identifier. */
  readonly id: Id;
}

/**
 * What a repository is and what it may do, exposed for inspection so a
 * boundary check can read a repository's reach without executing it.
 */
export interface KvRepositoryMetadata {
  /** Marks this as the owning accessor, as opposed to raw KV access. */
  readonly access: "canonical";
  /** Name of the resource this repository owns. */
  readonly resource: string;
  /** Shape of the primary key this repository writes. */
  readonly primaryKey: readonly ["sh", string, "primary", "<id>"];
  /** Kind of each declared index, keyed by index name. */
  readonly indexes: Readonly<Record<string, KvIndexKind>>;
  /** Hard ceiling on page size; a listing cannot be unbounded. */
  readonly maxPageSize: 100;
  /** Every operation this repository exposes. */
  readonly operations: readonly [
    "get",
    "create",
    "update",
    "delete",
    "lookupUnique",
    "list",
    "reference",
    "resolve",
  ];
}

/**
 * Typed access to one resource.
 *
 * Writes are optimistic: {@linkcode KvRepository.update} and
 * {@linkcode KvRepository.delete} require the versionstamp from a prior read
 * and report `conflict` rather than overwriting a concurrent change. Index
 * maintenance happens inside the same transaction as the record write.
 */
export interface KvRepository<
  Name extends string,
  Id,
  Value,
  Indexes extends KvIndexDefinitions<Value>,
> {
  /** What this repository owns and may do. */
  readonly metadata: KvRepositoryMetadata;
  /**
   * Reads one record by identifier.
   *
   * @param id The record's identifier.
   * @returns The record, or `null` when it does not exist.
   */
  get(id: Id): Promise<KvResourceEntry<Id, Value> | null>;
  /**
   * Writes a record that must not already exist.
   *
   * @param id Identifier to create under.
   * @param value The value to store; validated against the resource schema.
   * @returns `conflict` when the identifier is taken or an index collides.
   */
  create(id: Id, value: Value): Promise<KvMutationResult>;
  /**
   * Replaces a record, provided it has not changed since it was read.
   *
   * @param id The record's identifier.
   * @param value The replacement value.
   * @param versionstamp The versionstamp from the read this update is based on.
   * @returns `conflict` when the record changed in the meantime.
   */
  update(
    id: Id,
    value: Value,
    versionstamp: string,
  ): Promise<KvMutationResult>;
  /**
   * Removes a record and its index entries, if it has not changed.
   *
   * @param id The record's identifier.
   * @param versionstamp The versionstamp from the read this delete is based on.
   * @returns `conflict` when the record changed in the meantime.
   */
  delete(id: Id, versionstamp: string): Promise<KvMutationResult>;
  /**
   * Reads the single record a unique index points at.
   *
   * @param index Name of a `unique` index on this resource.
   * @param value The indexed value to look up.
   * @returns The record, or `null` when nothing is indexed under that value.
   */
  lookupUnique(
    index: keyof Indexes & string,
    value: StorageKeyPart,
  ): Promise<KvResourceEntry<Id, Value> | null>;
  /**
   * Reads one bounded page of the records an index groups together.
   *
   * @param options Which index and value to list, and how to page through it.
   * @returns One page, and the cursor that continues it.
   */
  list(options: {
    readonly index: keyof Indexes & string;
    readonly value: StorageKeyPart;
    readonly limit: number;
    readonly cursor?: string;
    readonly direction?: "asc" | "desc";
  }): Promise<KvPage<Id, Value>>;
  /**
   * Makes a portable pointer to one of this resource's records.
   *
   * @param id The record's identifier.
   * @returns A reference another service can hold and later resolve.
   */
  reference(id: Id): KvReference<Name, Id>;
  /**
   * Reads the record a reference points at.
   *
   * @param reference A reference produced by {@linkcode KvRepository.reference}.
   * @returns The record, or `null` when it no longer exists.
   */
  resolve(
    reference: KvReference<Name, Id>,
  ): Promise<KvResourceEntry<Id, Value> | null>;
}

/** An isolated KV store for one test, and the handle that disposes it. */
export interface KvTestContext {
  /** The store under test. */
  readonly kv: Deno.Kv;
  /** Closes the store and releases its backing resources. */
  close(): void;
}

/**
 * Unmediated KV access, granted deliberately.
 *
 * Reaching past a repository defeats schema and index guarantees, so the grant
 * records which requirement asked for it and why.
 */
export interface RawKvAccess {
  /** The underlying store. */
  readonly kv: Deno.Kv;
  /** Why this escape hatch was opened, and under whose authority. */
  readonly metadata: Readonly<{
    access: "raw";
    requirementId: string;
    reason: string;
  }>;
}

/** Thrown when stored data does not satisfy the resource that owns it. */
export class KvDataError extends Error {
  /**
   * Builds an error naming the fault and where it was found.
   *
   * @param code Stable machine-readable identifier for this kind of fault.
   * @param location Where the fault was found, such as the offending key.
   * @param message What is wrong, in one sentence.
   */
  constructor(
    readonly code: string,
    readonly location: string,
    message: string,
  ) {
    super(message);
    this.name = "KvDataError";
  }
}
