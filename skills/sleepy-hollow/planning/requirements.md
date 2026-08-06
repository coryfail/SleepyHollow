---
schema: sgad-component/v0.2
id: SH-F006
title: Requirements planning and approval workflow
status: draft
risk: standard
source_sections:
  - "3.2"
  - "3.3"
  - "3.4"
  - "3.5"
  - "5"
depends_on:
  - SH-F001
open_decisions:
  - OPEN-004
owners:
  - Sleepy Hollow maintainers
---

# Requirements planning and approval workflow

## Purpose

Define the reviewable, machine-readable requirements artifacts that must exist
before Sleepy Hollow generates tests or application behavior.

## In scope

- Comprehensive application requirements.
- Endpoint-level decomposition and shared model or policy requirements.
- Structure-first API scaffolding.
- Stable frontmatter, acceptance identifiers, dependencies, and lifecycle state.
- Storage-neutral governance references and lifecycle-status projections.
- Endpoint-by-endpoint approval, revision, deferral, and rejection.

## Requirements

Planning shall produce `requirements/application.md` before endpoint
implementation. It shall cover purpose, actors, scope, data, endpoints,
relationships, indexes, conventions, errors, security, deployment, architecture,
cross-cutting criteria, dependencies, assumptions, risks, and open questions.

After application approval, decomposition shall create the proposed API directory
structure and a `requirements.md` in every endpoint directory without creating
tests or route implementations. Shared contracts shall live in shared model or
policy requirements. Endpoint requirements shall use stable frontmatter and
include purpose, methods, inputs, success and error responses, security, data
access, side effects, abuse considerations, dependencies, assumptions, and
acceptance criteria.

Every generated application and endpoint `requirements.md` shall contain its
complete governance history: approval bound to exact content and bounded
criteria, bidirectional criterion-to-test mappings, credible red-state evidence,
independent verification, and applicable delivery results. Supporting Git,
review, CI, or attestation provenance may be linked, but no separate SGAD
governance artifact tree is created.

The initial lifecycle is `draft -> approved -> verified`. A behavioral revision
returns the affected requirement to `draft`; it shall not silently retain prior
approval. Frontmatter `status` remains workflow-routing metadata and a readable
lifecycle projection; it is not sole approval authority or verification evidence.

## Acceptance criteria

- AC-F006-001: Planning creates `requirements/application.md` containing every
  mandatory application-level topic before any endpoint test or implementation.
- AC-F006-002: Unresolved material decisions are recorded explicitly rather than
  replaced with invented behavior.
- AC-F006-003: Decomposition creates a complete proposed API directory tree with
  one `requirements.md` per endpoint and no endpoint tests or route files.
- AC-F006-004: Every endpoint requirement has parseable frontmatter containing a
  stable ID, path, status, methods, dependencies, and service.
- AC-F006-005: Every endpoint requirement contains the mandatory behavioral,
  security, data-access, dependency, and acceptance-criteria sections.
- AC-F006-006: A user can approve, revise, defer, or reject one endpoint without
  approving unrelated endpoints.
- AC-F006-007: Approving an explicit group changes only the named endpoint
  requirements.
- AC-F006-008: A change to approved behavior returns the affected requirement to
  `draft` and identifies dependent requirements needing review.
- AC-F006-009: Decomposition rejects behavior that contradicts the approved
  application requirement and identifies the conflicting source text.
- AC-F006-010: The requirement parser preserves stable criterion identifiers and
  reports malformed or duplicate identifiers with file locations.

## Out of scope

- A full enterprise requirements-management system.
- Complex approval state machines.
- Cryptographic locking of requirements or tests.

## Dependencies and assumptions

OPEN-004 shall validate Markdown plus YAML frontmatter as a portable authoring
format without introducing proprietary syntax.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: pending exact-content approval.
- Approver, time, bounded criteria, digest, and decision source: pending.

### Criterion mapping

- Status: pending approval and governed tests.

### Red-state evidence

- Status: pending approved test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
