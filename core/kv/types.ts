import type { z } from "zod";

export type StorageKeyPart = Exclude<Deno.KvKeyPart, symbol>;
export type KvIndexKind = "index" | "unique" | "belongsTo";

export interface KvIndexDefinition<Value> {
  readonly kind: KvIndexKind;
  readonly value: (value: Value) => StorageKeyPart;
}

export type KvIndexDefinitions<Value> = Readonly<
  Record<string, KvIndexDefinition<Value>>
>;

export interface KvResourceDefinition<
  Name extends string,
  IdSchema extends z.ZodType<StorageKeyPart>,
  ValueSchema extends z.ZodType,
  Indexes extends KvIndexDefinitions<z.output<ValueSchema>>,
> {
  readonly name: Name;
  readonly id: IdSchema;
  readonly value: ValueSchema;
  readonly indexes: Indexes;
}

export interface KvResourceEntry<Id, Value> {
  readonly id: Id;
  readonly value: Value;
  readonly versionstamp: string;
}

export type KvMutationResult =
  | { readonly ok: true; readonly versionstamp: string }
  | { readonly ok: false; readonly reason: "conflict" };

export interface KvPage<Id, Value> {
  readonly items: readonly KvResourceEntry<Id, Value>[];
  readonly cursor: string | null;
}

export interface KvReference<Name extends string, Id> {
  readonly resource: Name;
  readonly id: Id;
}

export interface KvRepositoryMetadata {
  readonly access: "canonical";
  readonly resource: string;
  readonly primaryKey: readonly ["sh", string, "primary", "<id>"];
  readonly indexes: Readonly<Record<string, KvIndexKind>>;
  readonly maxPageSize: 100;
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

export interface KvRepository<
  Name extends string,
  Id,
  Value,
  Indexes extends KvIndexDefinitions<Value>,
> {
  readonly metadata: KvRepositoryMetadata;
  get(id: Id): Promise<KvResourceEntry<Id, Value> | null>;
  create(id: Id, value: Value): Promise<KvMutationResult>;
  update(
    id: Id,
    value: Value,
    versionstamp: string,
  ): Promise<KvMutationResult>;
  delete(id: Id, versionstamp: string): Promise<KvMutationResult>;
  lookupUnique(
    index: keyof Indexes & string,
    value: StorageKeyPart,
  ): Promise<KvResourceEntry<Id, Value> | null>;
  list(options: {
    readonly index: keyof Indexes & string;
    readonly value: StorageKeyPart;
    readonly limit: number;
    readonly cursor?: string;
    readonly direction?: "asc" | "desc";
  }): Promise<KvPage<Id, Value>>;
  reference(id: Id): KvReference<Name, Id>;
  resolve(
    reference: KvReference<Name, Id>,
  ): Promise<KvResourceEntry<Id, Value> | null>;
}

export interface KvTestContext {
  readonly kv: Deno.Kv;
  close(): void;
}

export interface RawKvAccess {
  readonly kv: Deno.Kv;
  readonly metadata: Readonly<{
    access: "raw";
    requirementId: string;
    reason: string;
  }>;
}

export class KvDataError extends Error {
  constructor(
    readonly code: string,
    readonly location: string,
    message: string,
  ) {
    super(message);
    this.name = "KvDataError";
  }
}
