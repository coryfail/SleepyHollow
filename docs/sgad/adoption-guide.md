# Adopting SGAD

SGAD can be introduced incrementally without replacing a project's language,
framework, test runner, issue tracker, or CI platform. Start with one meaningful
component and make its authority and evidence explicit.

## 1. Define the governed boundary

Choose which work requires SGAD. A practical initial policy covers:

- New externally visible behavior.
- Security, authorization, privacy, or data changes.
- Public API and compatibility changes.
- Production configuration and deployment behavior.
- Agent-generated changes larger than a defined risk threshold.

Formatting, comments, disposable exploration, or clearly non-behavioral changes
may use a lighter path when repository policy says so.

## 2. Add a portable structure

One possible minimal structure is:

```text
project/
├── requirements/application.req.md
└── src/account/
    ├── profile.req.md
    ├── profile.test.ts
    ├── profile.ts
    ├── password-reset.req.md
    ├── password-reset.test.ts
    └── password-reset.ts
```

Place requirements according to the behavior they own:

- `requirements/application.req.md` owns application-wide intent, shared
  architecture, cross-cutting behavior, and system criteria. It is the only item
  in the top-level `requirements/` directory.
- A component's meaningful named `*.req.md` file lives beside the feature,
  service, package, website, skill, or documentation behavior it governs. A
  directory may contain several independently governed requirement files.
- Repository-wide behavior uses its own meaningful root-level `*.req.md` name
  when it cannot be assigned honestly to the application or one component.

Use each governed `*.req.md` file as the single home for its complete
governance history: exact-content approval, stable criteria, bidirectional test
mapping, red-state evidence, independent verification, and applicable delivery
results. Append these records beneath `## Governance record` after the governed
behavioral content.

Git history, a protected review, CI, or an attestation may be linked as
supporting provenance, but the canonical record remains in the named
requirement file.
Do not accept an editable status as sole proof of approval or verification.

## 3. Write the system specification

Capture the system purpose, actors, scope, boundaries, shared models, security,
operations, risks, open decisions, and cross-cutting acceptance criteria.

For a brownfield project, begin with the behavior relevant to the selected change
rather than pretending the entire legacy system is fully specified. Mark inferred
behavior and unknowns honestly.

Use [the application template](templates/application-requirements.md) as a
starting point.

## 4. Decompose one component

Select a component small enough to review and verify independently. Create its
named `*.req.md` file before new tests or implementation. Give every criterion a
stable ID.

Good criteria describe observable outcomes:

```text
AC-RESET-004: An expired reset token produces a generic invalid-token response
and does not reveal whether the account exists.
```

Avoid criteria that only describe activity:

```text
AC-RESET-004: Implement token validation.
```

Use [the component template](templates/component-requirements.md).

## 5. Record approval against exact content

At minimum, review the specification through an authorized control, calculate
the governed-content digest, and append the approval decision and its supporting
source beneath `## Governance record` in the same named requirement file.

Calculate the digest over the exact bytes before that heading after omitting the
single top-level frontmatter `status:` line and its line ending. Apply no other
normalization.

Do not allow an agent to establish approval by changing `status: draft` to
`status: approved` without independently verifiable authorization.

## 6. Add criterion mapping

Choose one deterministic mapping mechanism:

- Criterion IDs in test names.
- Test annotations or metadata.
- A mapping table in the governed `*.req.md` file connecting criteria and tests.
- Generated mappings from a supported test framework.

Add a CI check for unmapped criteria and unapproved acceptance tests.

## 7. Require the red phase

Run new tests against the pre-implementation baseline. Retain enough information
to reproduce and classify the expected failure. Stop if unrelated baseline checks
fail.

For an existing implementation being brought under SGAD, record a characterization
baseline instead. Do not fabricate historical red evidence; state that the
behavior predates adoption.

## 8. Establish an independent verifier

Create one stable command or CI entry point that:

- Parses specifications and approval evidence.
- Validates stable IDs and dependencies.
- Checks criterion mappings.
- Validates red evidence when required.
- Runs relevant tests and existing quality gates.
- Detects changed or stale generated artifacts.
- Appends a human-readable result and links any machine-readable runner output in
  the governed `*.req.md` file.
- Returns nonzero when required evidence fails or is missing.

The first verifier may be a small script around existing tools. Independence
comes from evidence and control boundaries, not from building an elaborate new
platform.

## 9. Bind CI and delivery

Protect governed branches or environments so delivery requires a valid verifier
result for the exact revision. Record the result in the named `*.req.md` file and link
the supporting CI run or repository attestation.

Add post-delivery evidence only after pre-delivery verification is reliable.

## 10. Add impact invalidation

Start conservatively: rerun all relevant evidence after governed changes. As the
dependency model improves, narrow invalidation safely.

Never skip a check merely because impact analysis could not determine whether it
was needed. Ambiguity expands the required verification scope.

## Suggested rollout

### Stage 1: Visible intent

- Application and component specifications exist.
- Criteria have stable IDs.
- Human approval is auditable.

### Stage 2: Traceable tests

- Criteria and tests map bidirectionally.
- The expected red state is recorded for new behavior.
- Test changes invalidate evidence.

### Stage 3: Independent verification

- One verifier command checks authority, traceability, tests, and project policy.
- Results are structured and bound to repository revisions.
- CI fails closed on missing evidence.

### Stage 4: Governed delivery

- Risk changes required evidence.
- Generated artifacts and compatibility are checked.
- Deployment requires valid evidence and records post-delivery checks.

## Branch and pull-request integration

A feature-branch workflow fits SGAD naturally:

1. Create a branch from the active development branch.
2. Draft or revise the component specification.
3. Review and approve exact intent.
4. Add mapped tests and red evidence.
5. Implement and verify.
6. Open or update the implementation pull request with the embedded verification
   entry and its supporting runner links.
7. Merge only while the report still matches the head revision.

A project may use separate specification and implementation pull requests for
higher risk. Lower-risk work may use staged commits in one protected pull request
as long as approval and evidence boundaries remain auditable.

## Common adoption failures

### Treating `approved` as a trusted string

An editable field is routing metadata, not authorization. Bind approval to an
authorized identity and exact content.

### Generating code and then backfilling requirements

That documents an implementation; it does not govern its creation. Use an
explicit brownfield characterization path when behavior already exists.

### Letting the agent own every oracle

If the same agent writes intent, approves it, writes tests, writes code, selects
checks, and interprets results, the workflow has produced activity rather than an
independent trust boundary.

### Equating tests with complete correctness

Tests verify specified examples and invariants. Add security, contract,
configuration, compatibility, and operational checks appropriate to risk.

### Making every change heavyweight

Use concise specifications and risk-scaled evidence. A two-line behavior change
may need only a small component update and focused tests; governance should remain
proportional.

### Freezing specifications

Discovery continues during implementation. When intent must change, return to
`draft`, update dependencies, reapprove, and regenerate evidence transparently.
