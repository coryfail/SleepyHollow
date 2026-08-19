---
schema: sleepy-hollow-model/v0.1
id: SH-MODEL-SERVICE
title: Service model
status: draft
source_sections:
  - "9"
depends_on: []
owners:
  - Sleepy Hollow maintainers
---

# Service model

A service is an independently describable and deployable Sleepy Hollow
application with its own application requirement, runtime configuration, API
routes, tests, generated contract, deployment, and owned database binding.

Services own their data. Cross-service access uses the owning service's generated
client and approved authentication mechanism, propagates request IDs, applies
deadlines and cancellation, and documents partial failure without implying an
atomic distributed transaction.
