# SleepyHollow requirements

[`application.md`](application.md) is the authoritative product and architecture
requirement. It is decomposed into requirements colocated with the concrete CLI,
framework, and skill behavior they govern.

## Structure-first layout

```text
SleepyHollow/
├── requirements/
│   ├── README.md
│   ├── application.md
│   ├── repository-organization.md
│   ├── approvals/
│   │   ├── SH-F017.yaml
│   │   └── SH-R001.yaml
│   └── evidence/
│       └── SH-R001-red-state.md
├── cli/
│   ├── requirements.md
│   ├── create/
│   │   └── requirements.md
│   ├── dev/
│   │   └── requirements.md
│   ├── test/
│   │   └── requirements.md
│   ├── check/
│   │   └── requirements.md
│   ├── generate/
│   │   └── requirements.md
│   └── deploy/
│       └── requirements.md
├── core/
│   ├── routing/
│   │   └── requirements.md
│   ├── validation/
│   │   └── requirements.md
│   ├── kv/
│   │   └── requirements.md
│   ├── security/
│   │   └── requirements.md
│   ├── testing/
│   │   └── requirements.md
│   ├── config/
│   │   └── requirements.md
│   └── services/
│       └── requirements.md
├── skills/
│   ├── sgad-workflow/
│   │   └── requirements.md
│   └── sleepy-hollow/
│       ├── requirements.md
│       └── planning/
│           └── requirements.md
├── models/
│   ├── endpoint-requirement.md
│   ├── route.md
│   ├── principal.md
│   ├── diagnostic.md
│   └── service.md
└── generated/
    └── README.md
```

This is the structure-first stage. A component directory initially contains only
its `requirements.md`. After approval, its acceptance tests are added beside the
requirement. Implementation follows only after the expected failing tests have
been observed. For example:

```text
core/routing/
├── requirements.md
├── mod.test.ts
└── mod.ts
```

The repository therefore follows the same workflow SleepyHollow provides to an
application: whole-product planning, concrete structure, granular approval,
colocated requirements, TDD, and independent verification.

## Requirement lifecycle

```text
draft -> approved -> verified
```

- `draft`: proposed behavior is under review; tests and implementation must not
  begin.
- `approved`: acceptance tests and TDD implementation are authorized.
- `verified`: all criteria map to passing tests and independent checks pass.

A behavioral change returns the affected requirement to `draft` and identifies
dependent requirements that require review. Criterion identifiers are stable and
must not be silently reused or weakened.

## Requirement inventory

| ID | Location | Responsibility |
|---|---|---|
| SH-F001 | `cli/create/requirements.md` | Installation and safe project creation |
| SH-F002 | `core/routing/requirements.md` | File-based HTTP routing runtime |
| SH-F003 | `core/validation/requirements.md` | Schemas, validation, and Problem Details |
| SH-F004 | `core/kv/requirements.md` | Typed, bounded Deno KV access |
| SH-F005 | `core/security/requirements.md` | Security, authentication, and authorization boundaries |
| SH-F006 | `skills/sleepy-hollow/planning/requirements.md` | Application planning, decomposition, and approval |
| SH-F007 | `core/testing/requirements.md` | Test utilities and criterion traceability |
| SH-F008 | `cli/check/requirements.md` | Independent `hollow check` verification |
| SH-F009 | `skills/sleepy-hollow/requirements.md` | Official agent skill and end-to-end workflow |
| SH-F010 | `cli/generate/requirements.md` | OpenAPI and typed-client generation |
| SH-F011 | `cli/requirements.md` | Shared CLI behavior and diagnostics |
| SH-F012 | `core/config/requirements.md` | Configuration and observability |
| SH-F013 | `cli/deploy/requirements.md` | Verified Deno Deploy delivery |
| SH-F014 | `core/services/requirements.md` | Optional multi-service projects |
| SH-F015 | `cli/dev/requirements.md` | Local development server |
| SH-F016 | `cli/test/requirements.md` | Test execution and criterion results |
| SH-F017 | `skills/sgad-workflow/requirements.md` | Framework-independent SGAD methodology workflow skill |
| SH-R001 | `requirements/repository-organization.md` | Project-boundary organization and canonical repository paths |

## Shared models

Files under `models/` define contracts used by multiple components. They do not
own executable behavior and therefore do not replace component acceptance
criteria. A component requirement names the shared models it consumes; changes
to those models return every affected component requirement to `draft`.

## Acceptance criteria

Acceptance criteria describe observable outcomes and use stable IDs. Each
approved criterion must map to at least one automated test. A requirement cannot
be marked `verified` when a criterion is unmapped, failing, or weakened without
review.
