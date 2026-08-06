# SGAD workflow

The SGAD workflow turns uncertain intent into bounded authority and then into
independently verified evidence. Phases may iterate, and independent approved
components may execute in parallel, but no phase may fabricate the evidence
required by an earlier gate.

## Phase 0: Establish governance

Before governed work begins, the project defines:

- Which changes require SGAD.
- Who or what may approve intent.
- Risk classifications and required evidence.
- Ownership-based locations for application, component, and repository
  requirements and their embedded governance records.
- The verifier entry point and structured result format.
- Which changes invalidate prior approval or verification.
- Deployment and external-mutation policies.

The smallest project can encode this in repository guidance and CI. A regulated
project may require signed approvals, protected environments, and retained
attestations.

### Exit condition

The repository can determine whether a proposed change is governed, what evidence
it requires, and which authority may approve it.

## Phase 1: Discover

The agent inspects existing specifications, source, tests, contracts,
configuration, operational evidence, and relevant external constraints. It asks
only questions whose answers materially affect behavior or architecture.

Discovery identifies:

- Actors, consumers, and desired outcomes.
- Existing behavior and compatibility constraints.
- Data ownership and security boundaries.
- Operational and deployment constraints.
- Dependencies and affected components.
- Assumptions, conflicts, risks, and unresolved decisions.

### Exit condition

Material uncertainty is either resolved or recorded explicitly with its effect on
approval.

## Phase 2: Specify the system

For a new system or material product change, the agent creates or updates an
application-level specification describing the system boundary and cross-cutting
behavior.

The system specification includes purpose, actors, scope, non-goals, component or
interface inventory, shared data and policy, security, operational expectations,
dependencies, risks, open decisions, and system-level acceptance criteria.

### Exit condition

The intended system is coherent enough to decompose without implementation-level
guessing. No affected component implementation begins merely because a system
draft exists.

## Phase 3: Decompose behavior

System intent is divided into the smallest independently reviewable and valuable
components. Each component specification defines its scope, inputs, outputs,
errors, state, side effects, security, non-functional constraints, dependencies,
assumptions, and stable acceptance criteria.

The complete proposed structure is created before tests or implementation for
new components. Component specifications are colocated with their future behavior
or linked through deterministic references.

### Exit condition

Every proposed behavior belongs to an identifiable component, dependencies are
visible, and each component can be approved, deferred, revised, or rejected
without implicitly authorizing unrelated behavior.

## Phase 4: Approve bounded requirements

An authorized human or policy reviews the intended behavior, assumptions, risks,
and acceptance criteria. Approval is recorded against the digest of the exact
specification revision and names its scope.

Approval does not authorize:

- Behavior omitted from the specification.
- A different specification revision.
- Unreviewed changes to shared dependencies.
- External mutation beyond the approved delivery policy.

### Exit condition

The selected component has valid approval evidence bound to its exact content and
all approval-blocking decisions are resolved.

## Phase 5: Formulate acceptance tests

Tests are derived from approved criteria. Each criterion maps to at least one
test, and each acceptance test maps back to approved behavior. Tests may cover
multiple criteria when the mapping remains explicit.

Test design includes happy paths, declared errors, boundaries, security behavior,
side effects, and risk-appropriate adversarial or property-based cases. A test
must not silently change intended behavior to simplify implementation.

### Exit condition

Traceability analysis finds no approved criterion without a test and no governed
acceptance test without approved intent.

## Phase 6: Prove the expected red state

The acceptance tests run before implementation. The workflow records which tests
failed, which criteria they represent, and why the failure demonstrates missing
approved behavior.

Unexpected baseline failures stop the component loop. A type error, broken test
environment, unavailable dependency, or malformed assertion is not acceptable
red-state evidence.

### Exit condition

Every new governed behavior has credible failing evidence, and the unaffected
baseline remains valid.

## Phase 7: Implement

The agent produces the smallest implementation that satisfies the approved
behavior and project policy. It may repair bounded implementation failures but
must not weaken tests, expand scope, or reinterpret intent silently.

If implementation reveals a necessary behavioral change, the affected
requirement returns to `draft`. Approval and downstream evidence are invalidated
according to the dependency graph.

### Exit condition

Mapped tests pass, relevant integration tests pass, and the working tree contains
no unexplained behavior outside the approved scope.

## Phase 8: Verify independently

The verifier evaluates current repository state rather than the producer's
summary. It checks the applicable structural, traceability, functional, security,
contract, artifact, and policy evidence.

Verification records the requirement digest, approval evidence, implementation
revision, test and artifact identities, verifier version, results, diagnostics,
and residual risks.

### Exit condition

Every required check passes and a reproducible verification entry binds the
approved intent to the current implementation.

## Phase 9: Deliver with evidence

Delivery tooling presents the change, verification evidence, compatibility and
data impact, target environment, and planned post-delivery checks. Required
approval is obtained before external mutation.

After delivery, smoke tests, health checks, or other target-specific evidence are
recorded. A successful upload without required operational evidence is not a
successful delivery.

### Exit condition

The delivered revision is identifiable, required post-delivery evidence passes,
and consumers receive the relevant locations, contracts, and residual risks.

## Phase 10: Evolve and revalidate

SGAD is continuous rather than a one-way project phase. A material change starts
impact analysis:

1. Identify changed artifacts and dependency edges.
2. Invalidate affected approval and verification records.
3. Return affected requirements to `draft` when behavior changed.
4. Repeat the smallest safe portion of the workflow.
5. Preserve prior evidence for audit rather than rewriting history.

## Parallel work

Components may execute concurrently when:

- Each has independent approval.
- Their dependencies are approved and stable.
- They do not write the same governed artifacts.
- Integration evidence exists before either is marked verified.

Parallelism must not turn approval of a shared dependency into implicit approval
of every dependent component.

## Exploratory work

Exploration is permitted when clearly isolated and labeled. An exploratory branch
or prototype may test feasibility before detailed specification, but it cannot be
presented as verified or delivered through a governed production path.

Useful discoveries flow back into a draft specification. Production behavior is
then implemented from approved intent with fresh evidence rather than treating
the prototype as retroactively authorized.
