---
id: SH-F004
title: Deno KV data access
status: draft
source_sections:
  - "6.3"
  - "6.4"
  - "15.1"
depends_on:
  - SH-F001
  - SH-F003
open_decisions:
  - OPEN-003
---

# Deno KV data access

## Purpose

Provide small, typed persistence primitives that make common Deno KV operations
bounded, index-aware, atomic where possible, and testable.

## In scope

- Typed keys and values.
- Resource-oriented repositories or equivalent primitives.
- Declared secondary indexes and uniqueness.
- Cursor pagination and bounded list operations.
- Simple references and indexed `belongsTo` lookups.
- Atomic operations, isolated test databases, and an explicit raw-KV escape
  hatch.

## Requirements

Deno KV is the only supported first-release persistence system. The canonical
data API shall make primary access, declared index access, pagination, and
atomic checks explicit. Uniqueness shall use atomic checks where Deno KV permits
them. Tests shall be able to create and clean isolated databases without sharing
state.

The framework shall expose enough metadata for independent verification to
detect unbounded reads, index-incompatible filtering, unsafe read-modify-write
patterns, and unapproved direct raw-KV use. The escape hatch shall be visible and
intentional rather than indistinguishable from canonical access.

## Acceptance criteria

- AC-F004-001: A resource can be written and read through typed key and value
  primitives without application-level key encoding.
- AC-F004-002: A declared secondary index returns matching resources in a
  deterministic order through a bounded query.
- AC-F004-003: Cursor pagination returns a bounded page and a usable continuation
  cursor without skipping or duplicating unchanged records.
- AC-F004-004: Concurrent attempts to claim a declared unique value allow no more
  than one successful owner.
- AC-F004-005: Supported multi-key changes use a Deno KV atomic operation and
  expose a deterministic conflict result.
- AC-F004-006: Two test contexts use isolated KV state and can be cleaned without
  affecting each other.
- AC-F004-007: A simple reference can be resolved by primary key and a declared
  `belongsTo` lookup can be served by a compatible index.
- AC-F004-008: Verification metadata distinguishes canonical bounded access from
  an explicit raw-KV escape hatch.
- AC-F004-009: The API does not claim SQL joins, automatic cascades, or
  distributed transactions.

## Out of scope

- Additional databases.
- SQL-style joins and automatic cascading behavior.
- Full migration automation.
- File or object storage.

## Dependencies and assumptions

OPEN-003 must validate index encoding, uniqueness, cursor stability, and atomic
behavior against Deno KV's supported guarantees.
