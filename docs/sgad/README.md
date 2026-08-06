# Specification-Governed Agentic Development

**Abbreviation:** SGAD

**Status:** Draft methodology, version 0.1

> Intent authorizes. Agents implement. Evidence verifies.

Specification-Governed Agentic Development is a framework-independent method for
building software with coding agents while preserving human authority,
traceability, and independently checkable evidence.

SGAD treats a specification as more than context for a model. An approved
specification is the bounded authority under which an agent may act. Tests,
implementation, generated artifacts, and delivery evidence must trace back to
that authority. An agent may produce work, but it may not expand its own scope or
certify its own result through an unsupported claim.

## Scope

SGAD applies to software created or materially changed by coding agents. It is
independent of programming language, application framework, model provider,
agent host, repository platform, and deployment target.

SGAD governs the path from intent to evidence. It does not prescribe a product
management framework, a particular architecture, a test runner, or a managed AI
runtime.

## The four planes

| Plane | Governing question | Primary artifacts |
|---|---|---|
| Intent | What behavior is actually wanted? | Application and component specifications |
| Authority | What exact work has been approved, by whom, and at what risk? | Approval records and policy |
| Execution | What was produced under that authority? | Tests, implementation, configuration, and generated artifacts |
| Evidence | What independently checkable facts support completion? | Test results, verification reports, attestations, and delivery records |

Keeping these planes distinct prevents a coding agent from silently turning an
assumption into intent, intent into authority, or its own completion statement
into evidence.

## Core invariants

A conforming SGAD workflow preserves these invariants:

1. Material implementation does not begin without a written specification.
2. Unresolved behavioral decisions remain explicit; an agent does not invent
   authority through a plausible assumption.
3. Approval applies to an exact specification revision and a bounded scope.
4. Every approved acceptance criterion has a stable identity and traceable test
   evidence.
5. The expected failing state is observed before implementation satisfies new
   behavior.
6. Verification relies on repository and tool evidence rather than the producing
   agent's assertion.
7. Behavioral changes invalidate affected approval and verification evidence.
8. Delivery is permitted only by the evidence required for the change's risk.

## Lifecycle

The minimal requirement lifecycle is deliberately small:

```text
draft -> approved -> verified
```

- `draft` means intent is still being formed or reviewed. Implementation is not
  authorized.
- `approved` means a specific requirement revision is authorized for bounded
  implementation.
- `verified` means the approved revision is satisfied by current, independently
  checkable evidence.

The status text is a human-readable projection. A verifier must derive authority
and verification from valid records, digests, repository state, and evidence; it
must not trust an editable `status` field by itself.

> No governed lifecycle transition occurs without independently checkable
> evidence.

## Workflow

```text
Discover
  -> Specify the system
  -> Decompose behavior
  -> Approve bounded requirements
  -> Formulate tests
  -> Prove the expected red state
  -> Implement
  -> Verify independently
  -> Deliver with evidence
  -> Revalidate when anything material changes
```

See [workflow.md](workflow.md) for phase entry and exit conditions.

## Documents

- [Methodology requirements](requirements.md) defines the approved scope and
  acceptance criteria SGAD will use to govern itself.
- [Principles](principles.md) defines the values and design constraints.
- [Workflow](workflow.md) defines the end-to-end operating process.
- [Artifacts and lifecycle](artifacts-and-lifecycle.md) defines specifications,
  approval records, evidence, state, and invalidation.
- [Verification model](verification-model.md) defines the trust boundary and
  required kinds of evidence.
- [Adoption guide](adoption-guide.md) shows how to introduce SGAD in any
  repository.
- [Conformance](conformance.md) defines the minimum claim and optional capability
  profiles.
- [Templates](templates/) provide portable starting artifacts.

## Standalone SGAD skill

The portable [SGAD workflow skill](../../skills/sgad-workflow/SKILL.md) helps
developers apply this methodology in repositories that do not use SleepyHollow.
It guides governance discovery, specifications, exact-content approval,
criterion traceability, red-state evidence, bounded implementation, independent
verification, and evidence-gated delivery using the adopting project's own
language, framework, tests, CI, and deployment tools.

This is a separate skill from the SleepyHollow application skill. It does not
teach or require the SleepyHollow runtime or CLI.

## Relationship to SleepyHollow

SleepyHollow is a reference implementation of SGAD for headless API development.
It extends the general method with endpoint-local requirements, runtime schemas,
data-access checks, authorization guards, API contract generation, typed clients,
and deployment verification.

SGAD does not require SleepyHollow. A project can conform using Markdown, its
existing test runner, source control, CI, and a verifier appropriate to its own
stack.

## Influences and distinction

SGAD builds on specification-driven development, acceptance test-driven
development, behavior-driven development, test-driven development, docs as code,
requirements traceability, policy as code, and software verification.

Its distinguishing concern is governance at agent boundaries: specifications
authorize exact behavior, autonomy remains scoped to that authority, and state
transitions require evidence that can be checked independently of the producing
agent.

## Non-goals

SGAD is not intended to:

- Eliminate human responsibility for product intent.
- Treat tests as proof that an incomplete specification is correct.
- Require heavyweight documents for trivial changes.
- Prevent exploration; exploratory code simply has no authority to ship as
  verified behavior until it enters the governed workflow.
- Mandate a particular coding agent, model, tool, or framework.
- Allow process artifacts to substitute for working software.
