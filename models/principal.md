---
id: SH-MODEL-PRINCIPAL
status: draft
source_sections:
  - "7.2"
---

# Principal model

A principal represents an identity authenticated by a project-selected provider.
It contains a stable `id`, a `type` such as `user`, `service`, or `api-key`, and
optional claims.

The model does not prescribe how credentials are issued, transported, stored,
expired, or revoked. Authorization consumes the principal through explicit route
guards; public routes may operate with no principal.
