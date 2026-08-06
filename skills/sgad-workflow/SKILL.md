---
name: sgad-workflow
description: Apply Specification-Governed Agentic Development (SGAD) in any software repository by establishing governance, writing reviewable specifications, binding approval to exact intent, mapping acceptance criteria to tests, recording credible red-state evidence, implementing within approved scope, and handing off to independent verification and evidence-gated delivery. Use when a developer asks to adopt, follow, explain, audit, or assess SGAD; create SGAD requirements or evidence artifacts; govern agent-generated changes; or run a greenfield or brownfield change through the SGAD methodology. This skill is framework-independent and does not require SleepyHollow.
---

# SGAD workflow

Apply SGAD as a governance workflow, not as a documentation style. Keep intent,
authority, execution, and evidence distinct throughout the change.

## Route the request

Choose the smallest route that satisfies the request:

- **Explain:** Describe SGAD concepts without changing repository state.
- **Assess:** Compare current artifacts and controls with SGAD Core; report gaps
  without asserting conformance.
- **Adopt:** Establish a governed boundary, artifact locations, authority, and a
  staged rollout. Read [adoption.md](references/adoption.md).
- **Execute:** Run a concrete change through the full workflow below. Read
  [workflow.md](references/workflow.md).

For artifact creation, approval design, or lifecycle questions, read
[governance-and-artifacts.md](references/governance-and-artifacts.md). For
verification, risk profiles, or conformance assessment, read
[verification-and-conformance.md](references/verification-and-conformance.md).

## Preserve the non-negotiable gates

1. Write governed intent before material implementation.
2. Keep unresolved behavioral decisions explicit; do not invent authority.
3. Bind approval to exact requirement content and bounded criteria.
4. Give every governed acceptance criterion a stable identifier.
5. Map criteria to tests or evaluations in both directions.
6. Run mapped tests against the pre-implementation baseline and retain credible
   red-state evidence for new behavior.
7. Stop when the baseline is broken for an unrelated reason.
8. Implement only approved scope; never weaken intent or tests to obtain success.
9. Use an independent repository control for verification; producer prose is not
   verification.
10. Invalidate affected authority and evidence after material changes.
11. Gate delivery on the evidence required by project risk and policy.

Treat `draft`, `approved`, and `verified` as lifecycle projections. Never accept
an editable status field, an agent's assertion, or a second agent's agreement as
the sole evidence for approval or verification.

## Execute a governed change

### 1. Establish governance

Inspect repository instructions, existing requirements, tests, CI, ownership,
release controls, and evidence. Determine:

- Which behavior is governed and which policy applies.
- The risk classification and required checks.
- Who or what may approve exact intent.
- Canonical locations for specifications, approval, and evidence.
- The independent verifier entry point and delivery gate.

If these controls do not exist, propose the smallest explicit policy before
continuing. Do not silently appoint the producing agent as approver or verifier.

### 2. Discover and specify

Inspect existing behavior and ask only questions that materially affect intent,
architecture, security, compatibility, operations, or delivery. Record conflicts,
assumptions, risks, and open decisions.

Create or revise the application specification when system boundaries or shared
behavior change. Decompose work into independently reviewable component
requirements. Start from:

- [application-requirements.md](assets/templates/application-requirements.md)
- [component-requirements.md](assets/templates/component-requirements.md)

Do not create tests or implementation for new governed behavior while its intent
remains draft.

### 3. Obtain exact-content approval

Present the requirement, stable criteria, risk, dependencies, assumptions, and
open decisions. Require approval evidence from the authority defined by policy
and bind it to the exact content digest or immutable revision and approved scope.

If approval is absent, stop at a review-ready specification. If intent changes,
return the affected requirement to draft and invalidate downstream evidence.

### 4. Formulate tests and prove red

Map each approved criterion to one or more tests or evaluations and map every
governed acceptance test back to approved intent or a documented invariant. Add
happy paths, declared failures, boundaries, security behavior, side effects, and
risk-appropriate adversarial cases.

Run the tests against the pre-implementation baseline. Record identities,
revision, results, and why each expected failure demonstrates missing approved
behavior. Treat compilation errors, malformed assertions, unavailable
dependencies, or unrelated regression failures as broken baseline, not red-state
evidence.

For behavior that predates SGAD adoption, record characterization evidence and
the absence of historical red evidence honestly.

### 5. Implement within authority

Produce the smallest change that satisfies approved criteria and repository
policy. Preserve test semantics and declared scope. Repair bounded implementation
defects, but return to specification review if the required behavior changes or
the approved scope is insufficient.

### 6. Verify independently

Run the repository's verifier or CI control against current repository state.
Require it to check applicable structure, authority, traceability, red evidence,
tests, security and policy, contracts, generated artifacts, non-functional
requirements, and delivery readiness.

Use [verification-report.md](assets/templates/verification-report.md) for the
evidence handoff. Report missing, stale, ambiguous, or failing required evidence
as failure. Do not mark the result verified solely from checks selected or
interpreted by the producer.

### 7. Deliver and revalidate

Before external mutation, present the verified revision, target, compatibility
and data impact, required authorization, rollback expectations, and post-delivery
checks. Obtain any confirmation required by project policy. Bind the delivered
revision to the verified revision and retain smoke, health, migration, or other
required operational evidence.

After any material change, perform impact analysis, invalidate affected approval
and verification, preserve historical records, and repeat the smallest safe
portion of the workflow.

## Report the outcome

State:

- Governed scope, requirement IDs, digests or revisions, and risk.
- Approval source and exact bounded scope, or the missing approval blocker.
- Criterion-to-test mappings and pre-implementation evidence.
- Implementation revision and changed governed artifacts.
- Independent checks, results, and evidence locations.
- Delivery result when authorized.
- Exceptions, missing evidence, invalidated dependents, and residual risks.

Claim SGAD Core or an optional profile only when every applicable normative
requirement has evidence. Otherwise report the current adoption stage and gaps.
