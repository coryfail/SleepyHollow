---
schema: sgad-verification-report/v0.1
result: pending
requirement_id: component-stable-id
requirement_digest: sha256:replace-me
implementation_revision: git:replace-me
policy_digest: sha256:replace-me
verifier:
  name: verifier-name
  version: verifier-version
verified_at: null
---

# Verification report

## Scope

Describe the exact component, criteria, implementation revision, dependencies,
configuration, and environments covered by this report.

## Approval evidence

| Requirement | Digest | Criteria | Approver | Approval record | Valid |
|---|---|---|---|---|---|
| component-stable-id | `sha256:...` | AC-COMPONENT-001 | identity | reference | pending |

## Criterion evidence

| Criterion | Test or evaluation | Red evidence | Current result | Evidence reference |
|---|---|---|---|---|
| AC-COMPONENT-001 | Test identity | Reference | pending | Reference |

## Required checks

| Code | Check | Tool and version | Result | Evidence reference |
|---|---|---|---|---|
| SGAD-STRUCTURE | Specification structure | Tool | pending | Reference |
| SGAD-AUTHORITY | Approval matches content | Tool | pending | Reference |
| SGAD-TRACE | Bidirectional traceability | Tool | pending | Reference |
| SGAD-RED | Expected red state | Tool | pending | Reference |
| SGAD-TEST | Functional tests | Tool | pending | Reference |
| SGAD-POLICY | Project policy | Tool | pending | Reference |

## Generated artifacts

| Artifact | Canonical input digest | Artifact digest | Current |
|---|---|---|---|
| Artifact path | `sha256:...` | `sha256:...` | pending |

## Invalidation inputs

List the requirements, tests, source, dependencies, policies, configuration,
tools, environments, and generated inputs whose material change invalidates this
report.

## Exceptions and residual risks

- State accepted warnings, unavailable checks, nondeterminism, assumptions, and
  remaining risk.

## Result

State `passed` only when every required check has valid evidence for the exact
declared inputs. Otherwise state `failed` and identify the blocking diagnostics.
