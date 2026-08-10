/**
 * Typed persistence over Deno KV.
 *
 * A resource definition names its key structure and indexes, and yields a
 * repository whose reads and writes are checked against it. Index maintenance
 * happens inside the mutation, so a secondary index cannot silently fall out
 * of step with the record it points at.
 *
 * Requires the `--unstable-kv` flag on Deno versions where KV is unstable.
 *
 * @module
 */
export { defineKvResource } from "./definition.ts";
export { rawKv } from "./raw.ts";
export { createKvRepository } from "./repository.ts";
export { openKvTestContext } from "./test_context.ts";
export { KvDataError } from "./types.ts";
export type {
  KvIndexDefinition,
  KvIndexDefinitions,
  KvIndexKind,
  KvMutationResult,
  KvPage,
  KvReference,
  KvRepository,
  KvRepositoryMetadata,
  KvResourceDefinition,
  KvResourceEntry,
  KvTestContext,
  RawKvAccess,
  StorageKeyPart,
} from "./types.ts";
