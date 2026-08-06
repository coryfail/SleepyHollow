---
schema: sleepy-hollow-model/v0.1
id: SH-MODEL-ROUTE
title: Route model
status: draft
source_sections:
  - "6.1"
  - "10"
depends_on: []
owners:
  - Sleepy Hollow maintainers
---

# Route model

A normalized route contains its source file, URL path, HTTP method, path
parameters, request schemas, response schemas, error contracts, handler,
authentication expectation, authorization guard, service, and contract metadata.

Runtime dispatch, `hollow check`, OpenAPI generation, and typed-client generation
consume this same normalized model. No consumer may maintain a conflicting
generator-only route definition.
