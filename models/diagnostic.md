---
schema: sleepy-hollow-model/v0.1
id: SH-MODEL-DIAGNOSTIC
title: Diagnostic model
status: draft
source_sections:
  - "8"
  - "11.2"
  - "12"
depends_on: []
owners:
  - Sleepy Hollow maintainers
---

# Diagnostic model

A diagnostic contains a stable code, severity, summary, affected requirement or
criterion, route or command, source location, evidence, and safe correction path
when one is known.

Human-readable and JSON CLI output render the same diagnostic. Sensitive values,
secrets, authorization material, session data, and raw credentials are never
diagnostic evidence.
