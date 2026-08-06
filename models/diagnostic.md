---
id: SH-MODEL-DIAGNOSTIC
status: draft
source_sections:
  - "8"
  - "11.2"
  - "12"
---

# Diagnostic model

A diagnostic contains a stable code, severity, summary, affected requirement or
criterion, route or command, source location, evidence, and safe correction path
when one is known.

Human-readable and JSON CLI output render the same diagnostic. Sensitive values,
secrets, authorization material, session data, and raw credentials are never
diagnostic evidence.
