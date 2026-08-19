# Changelog

All notable changes to Sleepy Hollow are documented in this file.

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
