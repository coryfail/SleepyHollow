---
id: SH-F001
title: Project creation
status: draft
source_sections:
  - "3.1"
  - "12"
  - "15.1"
depends_on: []
open_decisions: []
---

# Project creation

## Purpose

Give humans and agents one safe command that creates a valid SleepyHollow
application before any application-specific endpoint exists.

## In scope

- `hollow create <project-name>`.
- A minimal Deno project and typed SleepyHollow configuration.
- Empty API, requirements, and generated-output locations.
- Instructions for using the official SleepyHollow skill.
- Human-readable and machine-readable creation results.

## Requirements

The command shall create a deterministic project structure with the files needed
to type-check, test, run framework validation, and begin requirements planning.
It shall validate the project name and destination before writing, avoid hidden
destructive changes, and provide actionable failures. The generated application
shall not contain example endpoints presented as approved product behavior.

The scaffold shall make the intended locations for `requirements/application.md`,
endpoint-local requirements, runtime configuration, API routes, models, tests,
and generated artifacts evident. It shall include concise guidance for activating
or installing the official skill in supported agent environments.

## Acceptance criteria

- AC-F001-001: Given a valid name and writable empty destination, `hollow create`
  creates the project and exits successfully.
- AC-F001-002: A newly created project passes its documented type-check and
  framework validation commands before any endpoint is added.
- AC-F001-003: The scaffold contains a typed SleepyHollow configuration, an API
  location, a requirements location, and a generated-artifact location.
- AC-F001-004: The scaffold explains how to begin the official skill-guided
  planning workflow without requiring a generated endpoint.
- AC-F001-005: An invalid project name or unsafe destination produces a nonzero
  exit status and does not leave a partially overwritten project.
- AC-F001-006: Creation refuses to overwrite existing user files unless a future
  explicitly documented option authorizes each overwrite.
- AC-F001-007: `hollow create --json` returns a stable result containing the
  project path, created files, next actions, and any diagnostics.
- AC-F001-008: Repeating the command against the created destination fails safely
  and preserves the existing project.
- AC-F001-009: Following the supported installation procedure makes the
  `hollow` CLI available and reports its installed version without requiring a
  source checkout.

## Out of scope

- Generating application-specific endpoints.
- Invoking or managing an AI model.
- Selecting authentication or a multi-service architecture without planning.

## Dependencies and assumptions

The CLI distribution and installation mechanism will be selected during initial
implementation. That choice must not change the observable scaffold contract.
