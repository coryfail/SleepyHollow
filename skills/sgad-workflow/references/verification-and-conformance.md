# Verification and conformance

Separate validation of desired intent from verification of current implementation.
The producing agent may assemble evidence but must not be the sole authority or
oracle for completion.

## Verification layers

Select layers according to component risk and policy:

1. Structural: parse artifacts, stable IDs, dependencies, and repository policy.
2. Authority: verify authorized approval matches exact current intent.
3. Traceability: check criteria-to-tests and tests-to-intent.
4. Red state: validate missing-behavior failure against the baseline.
5. Functional: run mapped unit, integration, contract, system, and regression tests.
6. Policy and security: run applicable static, authorization, dependency, secret,
   configuration, data, privacy, and abuse checks.
7. Contract and compatibility: detect unapproved interface, schema, error, data,
   and compatibility changes.
8. Generated artifacts: regenerate or compare canonical outputs.
9. Non-functional: evaluate approved performance, reliability, accessibility,
   privacy, resource, and operational thresholds.
10. Delivery: bind the verified revision to the target and post-delivery evidence.

Require the verifier to be independent, reproducible, fail-closed, structured,
actionable, content-bound, and observable.

## SGAD Core assessment

Require evidence that:

- Governed intent predates material implementation and decomposes into stable
  component criteria.
- Approval comes from defined authority, binds exact content, and invalidates on
  behavioral change.
- Tests map to approved intent, credible red evidence exists for new behavior,
  and the producer cannot weaken tests or expand scope silently.
- Verification is independent, identifies exact inputs and policy, and fails on
  missing, stale, malformed, or failing evidence.
- Governed delivery requires valid evidence and traces the target revision to the
  verified revision.

Do not claim conformance from prompts, lifecycle labels, passing tests without
traceability, unsupported agent reports, or CI results that cannot identify the
approved requirement revision.

## Optional profiles

Assess optional profiles only after SGAD Core is satisfied:

- Content-Addressed
- Bidirectional-Traceability
- Adversarial-Testing
- Risk-Governed
- Delivery-Gated
- AI-System-Evaluated

State `SGAD Core 0.2.0 with exceptions` when active exceptions remain. Identify the
unmet rule, bounded scope and duration, authority, residual risk, compensating
controls, and removal condition.

For nondeterministic AI systems, version datasets, graders, thresholds, models,
prompts, tools, retrieval inputs, and configuration. Report repeated-trial
distributions, uncertainty, safety evidence, and monitoring instead of absolute
guarantees.
