---
id: SH-MODEL-ROUTE
status: draft
source_sections:
  - "6.1"
  - "10"
---

# Route model

A normalized route contains its source file, URL path, HTTP method, path
parameters, request schemas, response schemas, error contracts, handler,
authentication expectation, authorization guard, service, and contract metadata.

Runtime dispatch, `hollow check`, OpenAPI generation, and typed-client generation
consume this same normalized model. No consumer may maintain a conflicting
generator-only route definition.
