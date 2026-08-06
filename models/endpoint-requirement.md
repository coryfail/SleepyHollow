---
schema: sleepy-hollow-model/v0.1
id: SH-MODEL-ENDPOINT-REQUIREMENT
title: Endpoint requirement model
status: draft
source_sections:
  - "5"
depends_on: []
owners:
  - Sleepy Hollow maintainers
---

# Endpoint requirement model

An endpoint requirement is Markdown with YAML frontmatter. Frontmatter contains
a stable `id`, route `path`, lifecycle `status`, supported `methods`,
`depends_on` IDs, and owning `service`.

The document body defines purpose, inputs, successful responses, RFC 9457 error
responses, authentication, authorization, data access and indexes, side effects,
abuse considerations, stable acceptance criteria, dependencies, and assumptions.

Valid lifecycle projections are `draft -> approved -> verified`. The embedded
governance record determines actual authority and evidence; changing an editable
status value alone does not. Any approved behavioral change returns the document
to `draft` and requires fresh content-bound approval.
