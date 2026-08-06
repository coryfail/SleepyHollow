# SGAD adoption guide

Adopt SGAD incrementally around one meaningful governed component. Reuse the
repository's existing language, framework, tests, source control, CI, and
deployment path.

## Establish the first boundary

Define which changes are governed. Start with externally visible behavior,
security, authorization, privacy, data, public contracts, production
configuration, deployment, and agent-generated work above a declared risk
threshold. Allow lighter handling for explicitly non-behavioral changes.

Define:

- Authorized approvers and content-binding mechanism.
- Risk classes and evidence required for each.
- The governed `requirements.md` files that will contain complete governance
  histories.
- Criterion-mapping convention.
- One stable verifier command or CI entry point.
- Evidence retention, invalidation, and delivery rules.

## Greenfield adoption

Write the system specification, decompose independently reviewable components,
approve exact intent, create mapped tests, retain red evidence, implement, verify,
and only then deliver.

## Brownfield adoption

Specify only the behavior relevant to the selected change. Label inferred legacy
behavior and unknowns. Record characterization tests for existing behavior and
state that historical approval or red evidence is unavailable. Require fresh
approval and red evidence for new governed behavior.

## Suggested stages

1. Visible intent: specifications, stable criteria, and auditable approval.
2. Traceable tests: bidirectional mapping and credible red evidence.
3. Independent verification: one fail-closed verifier bound to revisions.
4. Governed delivery: risk-scaled gates and retained operational evidence.

## Repository layout example

```text
project/
├── requirements/application.md
└── src/feature-name/
    ├── requirements.md
    ├── feature.test.ts
    └── feature.ts
```

Place requirements according to behavioral ownership:

- `requirements/application.md` owns application-wide intent and is the only
  item in the top-level `requirements/` directory.
- A component's `requirements.md` lives beside the feature, service, package,
  website, skill, or documentation behavior it governs.
- Root `requirements.md` is optional and reserved for durable repository-wide
  behavior that cannot be assigned honestly elsewhere.

Use the feature's `requirements.md` as the single home for its complete
governance history: approval, criterion mapping, red-state evidence,
verification, and applicable delivery. Append those records beneath
`## Governance record`. Git, review, CI, and attestations may be linked as
supporting provenance from that record.

## Avoid common failures

- Do not treat `status: approved` as authorization.
- Do not generate code first and backfill requirements as supposed prior intent.
- Do not let the producing agent own intent, approval, every test oracle, and
  verification.
- Do not equate passing tests with complete correctness.
- Do not make low-risk changes needlessly heavyweight; scale evidence while
  preserving SGAD Core.
- Do not freeze specifications. Return discoveries that change behavior to draft
  review and invalidate affected evidence.
