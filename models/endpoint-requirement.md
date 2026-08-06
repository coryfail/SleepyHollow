---
id: SH-MODEL-ENDPOINT-REQUIREMENT
status: draft
source_sections:
  - "5"
---

# Endpoint requirement model

An endpoint requirement is Markdown with YAML frontmatter. Frontmatter contains
a stable `id`, route `path`, lifecycle `status`, supported `methods`,
`depends_on` IDs, and owning `service`.

The document body defines purpose, inputs, successful responses, RFC 9457 error
responses, authentication, authorization, data access and indexes, side effects,
abuse considerations, stable acceptance criteria, dependencies, and assumptions.

Valid lifecycle transitions are `draft -> approved -> verified`. Any approved
behavioral change returns the document to `draft`.
