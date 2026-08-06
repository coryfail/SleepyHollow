# SGAD verification model

SGAD separates intent validation from implementation verification.

- **Validation** asks whether the approved specification expresses the behavior
  stakeholders actually want.
- **Verification** asks whether current artifacts satisfy that exact approved
  specification under the governing policy.

Humans or other explicitly authorized sources remain responsible for validating
intent. SGAD automates and strengthens verification everywhere evidence can be
made independently checkable.

## Trust boundary

The producing agent is inside the production boundary and outside the final trust
boundary. It may:

- Help write and refine specifications.
- Generate tests and implementation.
- Run checks and inspect failures.
- Repair bounded implementation defects.
- Assemble a proposed completion report.

It may not establish authority or verification solely by:

- Changing a lifecycle field.
- Claiming a user approved something.
- Removing or weakening a failing test.
- Rewriting an acceptance criterion to match its code.
- Reporting that checks passed without reproducible results.
- Treating a second agent's agreement as deterministic proof.

## Threat model

SGAD assumes an agent can make mistakes without malicious intent and that a
misaligned or compromised process may optimize for appearing complete.

The verifier accounts for these failure modes:

| Failure mode | Required control |
|---|---|
| Agent invents missing behavior | Explicit uncertainty markers and approval bound to exact content |
| Agent expands scope | Diff-to-requirement analysis and bounded approval scope |
| Agent marks a draft approved | Authorized approval record with matching digest |
| Agent writes a test that always passes | Recorded expected red state and optional mutation or adversarial testing |
| Agent weakens a test after implementation | Test digest binding, change detection, and renewed red evidence |
| Criterion lacks a test | Bidirectional traceability check |
| Test lacks approved intent | Reverse traceability and explicit exception policy |
| Source passes tests but violates policy | Independent structural, security, contract, and configuration checks |
| Generated output is stale or edited | Deterministic regeneration and artifact comparison |
| Dependency change invalidates behavior | Dependency-aware impact analysis and evidence invalidation |
| Agent fabricates a success report | Verifier-controlled execution and signed or content-addressed results |
| Production differs from verified revision | Delivery attestation and post-delivery checks |

## Required verification layers

The governing policy selects applicable checks based on the component and risk.
SGAD recognizes these layers.

### 1. Structural verification

Checks that required artifacts exist, parse correctly, use unique stable IDs,
declare dependencies, and follow repository structure and policy.

### 2. Authority verification

Checks that approval comes from an authorized source, covers the relevant
criteria, and matches the current requirement digest.

### 3. Traceability verification

Checks both directions:

- Every approved criterion maps to sufficient tests or evaluations.
- Every governed acceptance test maps to approved intent or an explicit allowed
  invariant.

### 4. Red-state verification

Checks that new tests failed against the pre-implementation baseline for the
expected reason and were not merely broken.

### 5. Functional verification

Runs mapped unit, integration, contract, system, and regression tests in the
required environments.

### 6. Policy and security verification

Runs applicable static analysis, authorization, dependency, secret, configuration,
data-access, threat-model, and abuse-resistance checks.

### 7. Contract and compatibility verification

Compares interfaces, schemas, errors, data behavior, and compatibility policy.
Breaking changes require explicit approval and delivery treatment.

### 8. Generated-artifact verification

Regenerates or hashes derived artifacts and fails on drift or unapproved manual
edits.

### 9. Non-functional verification

Evaluates approved performance, reliability, accessibility, privacy, resource,
or operational thresholds with methods appropriate to the requirement.

### 10. Delivery verification

Binds the verified revision to the target and records health, smoke, migration,
or rollback-readiness evidence required by policy.

## Verifier properties

A conforming verifier should be:

- **Independent:** Its result does not depend on trusting the producer's prose.
- **Deterministic where possible:** Identical inputs and environment produce the
  same decision.
- **Reproducible:** Reports identify the commands, tool versions, policy, and
  environment needed to repeat material checks.
- **Fail-closed:** Missing, malformed, stale, or ambiguous required evidence does
  not become success.
- **Structured:** Automation receives a versioned result and stable diagnostic
  codes.
- **Actionable:** Failures identify the affected requirement, criterion, artifact,
  rule, and safe correction path when known.
- **Content-bound:** Results identify the exact requirement, tests,
  implementation, dependencies, and generated artifacts evaluated.
- **Observable:** Human-readable output and retained evidence explain why a
  decision occurred.

## Example result envelope

```json
{
  "schema": "sgad-verification-result/v0.1",
  "result": "failed",
  "requirementId": "bookmarks-by-id",
  "requirementDigest": "sha256:...",
  "implementationRevision": "git:...",
  "policyDigest": "sha256:...",
  "checks": [
    {
      "code": "SGAD-TRACE-UNMAPPED",
      "result": "failed",
      "criterionId": "AC-BOOKMARKS-003",
      "location": "api/bookmarks/[id]/requirements.md",
      "message": "Approved criterion has no mapped test"
    }
  ]
}
```

## Test trust

Agent-generated tests are useful evidence but not automatically trustworthy. The
policy may require stronger test assurance based on risk:

- Human review of criteria and test semantics.
- Independent generation of additional tests from the approved specification.
- Mutation testing to show that tests detect meaningful implementation defects.
- Property-based testing for broad behavioral invariants.
- Fuzzing and adversarial security cases.
- Differential testing against an existing implementation or independent model.
- Protected regression tests unavailable to the producing agent when warranted.

No technique compensates for missing intent. Strong tests can faithfully verify
the wrong specification.

## Nondeterministic AI systems

When the product being built is itself nondeterministic, exact assertions may not
be sufficient. SGAD still applies, but evidence can include:

- Versioned evaluation datasets and scoring methods.
- Statistical thresholds and confidence intervals.
- Safety and policy evaluations.
- Model, prompt, tool, retrieval, and configuration identities.
- Repeated trials and variance reporting.
- Human evaluation for criteria that cannot be automated reliably.
- Production monitoring, drift detection, and incident feedback.

An AI-system verification entry states the evaluated distribution and limits. It
must not convert a probabilistic result into an absolute guarantee.

## Residual risk

Verification entries disclose what was not established, including untested
assumptions, unavailable environments, accepted warnings, nondeterministic
results, and policy exceptions.

Passing verification means the required evidence satisfied the declared policy
for exact inputs. It does not mean the specification was complete, the system is
free of every defect, or future environments cannot invalidate the result.
