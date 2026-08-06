---
id: SH-MODEL-SERVICE
status: draft
source_sections:
  - "9"
---

# Service model

A service is an independently describable and deployable SleepyHollow
application with its own application requirement, runtime configuration, API
routes, tests, generated contract, deployment, and Deno KV database.

Services own their data. Cross-service access uses the owning service's generated
client and approved authentication mechanism, propagates request IDs, applies
deadlines and cancellation, and documents partial failure without implying an
atomic distributed transaction.
