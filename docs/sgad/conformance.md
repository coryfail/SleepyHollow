# SGAD conformance

This document defines the minimum requirements for claiming SGAD conformance and
optional capability profiles that describe stronger enforcement.

The words **must**, **must not**, **should**, and **may** are normative within this
document.

## SGAD Core

A project claiming **SGAD Core 0.2.0** must satisfy every requirement below.

### Intent

1. Governed behavior must have a repository-visible specification before material
   implementation begins.
2. Specifications must distinguish approved behavior from unresolved decisions,
   assumptions, non-goals, and risks.
3. System intent must decompose into independently identifiable component
   requirements.
4. Every governed acceptance criterion must have a stable identifier.

### Authority

5. Implementation authority must come from an approval source defined by project
   policy.
6. Approval must identify the exact specification revision or digest and bounded
   criteria it covers.
7. An editable status field alone must not constitute approval.
8. A behavioral specification change must invalidate affected approval.

### Execution

9. New approved behavior must have mapped acceptance tests or evaluations before
   its implementation is considered complete.
10. The workflow must run those tests against the pre-implementation baseline and
    distinguish expected missing-behavior failures from unrelated failures.
11. The producing agent must not silently remove, weaken, or remap approved tests
    to obtain success.
12. Implementation outside approved scope must be rejected, separately specified,
    or documented as an explicit policy exception.

### Evidence

13. Every approved criterion must map to at least one required verification
    activity.
14. Every governed acceptance test must map to approved intent or a documented
    invariant allowed by policy.
15. Verification must execute through a control that does not rely solely on the
    producing agent's completion statement.
16. Missing, stale, malformed, or failing required evidence must prevent a
    `verified` result.
17. Verification must identify the specification revision, implementation
    revision, policy, checks, outcome, and residual exceptions.
18. Material changes to governed inputs must invalidate affected verification.

### Delivery

19. A governed delivery path must require the verification evidence selected by
    project risk policy.
20. The delivered revision must be traceable to the verified implementation
    revision.

## Optional capability profiles

Projects may append these capability claims after satisfying SGAD Core.

### Content-addressed

Claim: `SGAD Core 0.2.0 + Content-Addressed`

The project:

- Calculates cryptographic digests for specifications, tests or test manifests,
  policies, implementation revisions, and generated artifacts relevant to
  verification.
- Binds approval and verification records to those digests.
- Automatically rejects evidence whose digest does not match current content.

### Bidirectionally traceable

Claim: `SGAD Core 0.2.0 + Bidirectional-Traceability`

The project:

- Automatically reports criteria without tests and tests without approved intent.
- Resolves mappings through stable IDs rather than fragile prose similarity.
- Performs change-impact analysis through declared dependency relationships.

### Adversarially tested

Claim: `SGAD Core 0.2.0 + Adversarial-Testing`

The project selects risk-appropriate independent assurance such as mutation
testing, property-based testing, fuzzing, protected regression tests, security
analysis, or independently produced test cases and records the results.

### Risk-governed

Claim: `SGAD Core 0.2.0 + Risk-Governed`

The project:

- Classifies governed work using a documented risk model.
- Scales approver authority, required checks, evidence retention, and external
  mutation controls with risk.
- Fails closed when risk cannot be classified safely.

### Delivery-gated

Claim: `SGAD Core 0.2.0 + Delivery-Gated`

The project:

- Enforces valid verification for the exact delivered revision.
- Records target identity, authorization, deployed revision, and environment
  change metadata without secrets.
- Requires and retains target-specific health, smoke, migration, or other
  post-delivery evidence selected by policy.

### AI-system evaluated

Claim: `SGAD Core 0.2.0 + AI-System-Evaluated`

For nondeterministic AI behavior, the project:

- Versions evaluation data, graders, thresholds, model and prompt identity,
  tools, retrieval inputs, and configuration.
- Reports repeated-trial distributions and uncertainty rather than converting
  probabilistic results into absolute claims.
- Includes safety evaluation and production monitoring required by risk policy.

## Conformance report

A conformance claim should be accompanied by a report containing:

- SGAD version and claimed profiles.
- Repository and evaluated revision.
- Governing policy location and digest.
- Evidence for each SGAD Core requirement.
- Exceptions, rationale, authority, expiration, and compensating controls.
- Verifier identity and result.
- Date and responsible project owner.

## Exceptions

An exception does not silently preserve full conformance. It must identify:

- The unmet normative requirement.
- The bounded scope and duration.
- The approving authority.
- The reason compliance is not currently possible.
- The residual risk and compensating controls.
- The condition for removal.

A project with an active exception states `SGAD Core 0.2.0 with exceptions` and
links the exception record.

## Non-conforming claims

The following are not sufficient for SGAD conformance:

- A prompt telling an agent to follow a process without enforceable evidence.
- Requirements written only after implementation and presented as prior
  authority.
- A lifecycle field that an agent can advance without independent approval or
  verification.
- Tests that pass without stable criterion traceability.
- An agent-authored report unsupported by reproducible tool results.
- CI success that cannot identify the approved requirement revision it verifies.

## Methodology evolution

Changes to SGAD conformance rules should themselves follow SGAD. Proposed changes
state their intent, compatibility effect, adoption impact, acceptance criteria,
and evidence before becoming a new methodology version.
