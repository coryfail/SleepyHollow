# Service architecture

One deployable API is the default. Multiple services require justification
during planning, because distribution adds operational cost immediately and pays
back only under specific conditions.

## When one API is right

- The whole application deploys together.
- One team owns every endpoint.
- Data is naturally shared.
- Load is uniform.

This covers most first releases. A single API designed with clean resource
ownership can be extracted later at far lower cost than an unnecessary
distributed system can be collapsed.

## When independent services are justified

- A component must deploy on its own schedule.
- Scaling profiles genuinely diverge.
- A trust or compliance boundary requires isolation.
- Independent teams own separate lifecycles.

Record which condition applies. "It might scale someday" is not one of them.

## Designed for later extraction

The middle option is usually the right one: one deployable API with strict
internal boundaries. Each resource has exactly one owning module, cross-boundary
access goes through a declared interface rather than direct data access, and no
module reaches into another's keyspace.

Extraction then becomes a deployment change instead of a rewrite.

## Boundaries

When the application does declare multiple services, each service owns its
resources exclusively. Cross-service access uses the declared transport, and the
framework verifies that no service reads another's data directly. Shared
contracts live in a shared requirement that both services depend on.
