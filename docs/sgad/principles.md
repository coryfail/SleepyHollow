# SGAD principles

These principles govern how authority, agent autonomy, and evidence interact.
They apply whether the implementation is written entirely by agents, jointly by
humans and agents, or mostly by humans with agent assistance.

## 1. Humans own behavioral intent

Agents may clarify, structure, challenge, and decompose intent. They do not become
the final authority for what stakeholders want.

A human or another explicitly authorized source validates the behavioral intent.
Tooling then verifies whether derived artifacts satisfy that approved intent.

## 2. Specifications are authorization boundaries

A specification is not merely useful context. Once approved, it grants bounded
authority to create the behavior it describes and no more.

An agent encountering missing or contradictory intent must return to discovery or
specification. Plausibility is not permission.

## 3. Uncertainty stays visible

Unknowns, assumptions, conflicts, and risks are recorded explicitly. Agents must
not collapse uncertainty into confident prose simply to continue execution.

An unresolved decision that materially changes behavior, security, data,
compatibility, cost, or deployment blocks approval of the affected scope.

## 4. Decompose to the smallest independently valuable authority

Large system intent is decomposed into components that can be reviewed,
implemented, verified, deferred, or rejected independently.

Approval of one component does not imply approval of its neighbors. Dependencies
are explicit so changes can invalidate the smallest safe affected set.

## 5. Keep context beside behavior

Component specifications, tests, and implementation should be colocated or
connected through deterministic references. This improves discovery, reduces
context reconstruction, and makes drift visible during ordinary repository work.

The component's named `*.req.md` file is the single home for its complete governance
history. It embeds approval, criterion mapping, red-state evidence, verification,
and applicable delivery records beside behavior. Supporting Git, review, CI, or
attestation provenance may be linked from that record.

## 6. Give every criterion a stable identity

Each approved acceptance criterion has an identifier that survives wording,
file, and test-layout changes. Tests name or otherwise record the criteria they
cover.

Identifiers are not reused for different behavior. Removed criteria remain
auditable with their removal rationale.

## 7. Observe red before accepting green

New acceptance tests are executed before implementation. The failure must result
from the absence of the approved behavior, not from a broken repository,
incorrect environment, or malformed test.

Recording the expected red state demonstrates that a test can detect the behavior
it claims to verify and reduces false-green evidence.

## 8. Separate production from verification

The producing agent may run checks and repair failures, but it cannot establish
verification merely by reporting that it succeeded.

Verification is performed by deterministic tooling, independently controlled
checks, authorized review, or a combination appropriate to risk. A second model
is useful only when its output is treated as review evidence rather than an
infallible oracle.

## 9. Prefer deterministic, agent-readable interfaces

Agents work more reliably with small explicit APIs, stable command behavior,
structured output, bounded operations, precise diagnostics, and visible escape
hatches.

Human-readable output remains important, but automation must not depend on
interpreting conversational prose to determine success or scope.

## 10. Changes invalidate stale authority and evidence

Approval and verification are bound to exact relevant content. A change to a
requirement, test, implementation, dependency, configuration, generated artifact,
or environment invalidates the evidence affected by that change.

Invalidation follows declared dependencies and impact analysis. It should be no
broader than necessary and never narrower than can be justified safely.

## 11. Scale autonomy and evidence with risk

Agent autonomy may increase when operations are reversible, blast radius is low,
requirements are precise, and verification is strong. Higher-risk changes require
stronger approval, test independence, security analysis, and delivery gates.

SGAD avoids imposing production-change ceremony on an experimental script while
also avoiding prototype-level evidence for security-sensitive production work.

## 12. Completion is an evidence bundle

Completion is not a confidence statement, a task checkbox, or a successful code
generation session. It is a reproducible bundle connecting approved intent to the
current implementation and its verification results.

A completion report identifies what changed, which criteria are satisfied, how
they were checked, which artifacts were produced, and what risks remain.

## 13. Derive artifacts from canonical definitions

Contracts, clients, documentation, configuration, and other generated artifacts
should derive from the same normalized definitions used by implementation and
verification.

Parallel hand-maintained truths invite drift and force agents to guess which one
governs.

## 14. The process must govern itself

Projects advocating SGAD should apply SGAD to changes in their own methodology,
templates, verifiers, and policies. A change to the rules is itself governed
behavior with requirements, review, evidence, and compatibility impact.
