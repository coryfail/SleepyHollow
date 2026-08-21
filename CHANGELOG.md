# Changelog

All notable changes to Sleepy Hollow are documented in this file.

## 0.3.4 - 2026-08-21

### Fixed: development server lifecycle

The development worker now reports readiness only after the listener is bound,
keeps the Node 24 server lifecycle under one explicit contract, and preserves
bounded diagnostics when serving fails after binding. Public `hollow dev`
supervision now reports unexpected worker exits instead of remaining falsely
active. SQLite database files and their `-wal`/`-shm` runtime sidecars are
excluded from reload triggers.

## 0.3.3 - 2026-08-21

### Changed: Node/Bun documentation and scaffold alignment

The framework documentation and Sleepy Hollow skill now describe the runtime's
object-shaped route security metadata, case-sensitive endpoint requirement
headings, the `sgad-application/v0.2` application format, and the current
framework 0.3.3 testing workflow. `hollow create` now emits the matching
application metadata, Node/Bun TypeScript configuration, and Node typings.

The framework's route evidence and fixtures were aligned with the same security
shape, while retained Deno-era verification records are explicitly marked as
historical migration evidence.

## 0.3.2 - 2026-08-20

### Fixed: global `hollow` executable

The npm binary now resolves its invoked path before deciding whether it is the
main module. `hollow` therefore runs correctly when npm invokes `dist/cli.js`
through its normal global or local symlink, instead of silently exiting with
success and no output.

## 0.3.1 - 2026-08-20

### Changed: local Fly deployment preparation

`hollow deploy` no longer attempts to authenticate with Fly, upload an image,
or run live health and smoke checks. Use `hollow deploy prepare` to create or
validate a managed `Dockerfile`, `.dockerignore`, and `fly.toml` locally, then
review them and run Fly's own commands yourself.

The SQLite profile prepares one `data` volume mounted at `/data`; the PostgreSQL
profile names `DATABASE_URL` as an operator-provided secret without writing its
value. This keeps Fly-specific scaling, Machines, regions, release behavior,
and account actions in Fly's tools while preserving a portable container and
database boundary for future hosts.

## 0.3.0 - 2026-08-19

### Breaking: Node and Bun platform migration

Sleepy Hollow is moving from Deno to Node.js 24 LTS as its canonical runtime,
with Bun verified as a compatible runtime. Deno, Deno KV, Deno Deploy, JSR, and
the Deno configuration and command surface are no longer supported.

Why this change:

- The framework needs a portable runtime and deployment model instead of being
  coupled to one hosting platform or registry.
- Its embedded SQLite database needs a durable filesystem for a simple,
  single-instance deployment, while optional PostgreSQL supports externally
  managed, multi-instance deployments.
- Node and Bun make it practical to ship one ordinary npm package, explicit
  runtime adapters, OCI containers, and provider-specific deployment adapters.
- Fly.io is the first deployment adapter, not a framework dependency; the same
  container and database contracts are intended to support additional hosts.

This is a deliberate pre-1.0 breaking change. Existing Deno applications need
to move to the generated Node/Bun project, replace Deno KV access with the
framework repository API, and select either embedded SQLite or PostgreSQL. No
automatic migration of existing Deno KV data is provided.
