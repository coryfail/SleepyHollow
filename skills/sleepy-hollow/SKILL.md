---
name: sleepy-hollow
description: Build and deploy a headless API on the Sleepy Hollow Deno framework. Use when a developer describes an application idea to build, asks to add or change an endpoint in a Sleepy Hollow project, or asks to verify or deploy one. Plans the whole application first, writes requirements beside every endpoint, implements approved behavior through TDD, and verifies with hollow check before deployment.
---

# Sleepy Hollow

Guide an application from a plain-language idea to a deployed, verified API. The
skill plans and implements. The framework independently verifies and runs the
result.

## Mandatory constraints

These constraints are not advisory and are not delegated to a reference file:

- Do not implement an endpoint before its requirement is approved.
- Generate mapped tests and observe the expected failure before implementation.
- Report an unexpected baseline failure instead of treating it as red state.
- Repair implementation only; return behavioral change to requirement review.
- Declare verification only from independent `hollow check` evidence.
- Confirm the first external deployment or a materially risky change.

Never weaken a mapped test, relax an approved criterion, or declare success from
your own reasoning. Verification comes from the framework, not from this skill.

## Workflow

### 1. Inspect and ask

Inspect the existing project before proposing anything. Ask only questions whose
answers materially change behavior or architecture, and never re-ask what the
project already answers. Record unresolved decisions as explicit open questions
rather than inventing an answer.

Read [references/planning.md](references/planning.md) for the discovery topics
and the questions worth asking in each.

### 2. Plan the whole application

Produce one `requirements/application.md` covering purpose, actors, scope, data
model, endpoints, relationships, indexes, conventions, errors, authentication,
authorization, security, operations, deployment, service architecture,
cross-cutting criteria, dependencies, assumptions, and open questions.

Authentication planning must record actors, trust boundaries, credential kind,
expiration, revocation, transport, cross-site request implications, and the
`401` and `403` response behavior whenever authentication is required. An
application that needs no authentication records that decision explicitly.

Present the application for review. Do not decompose it until approval binds its
exact content. Read
[references/requirement-format.md](references/requirement-format.md) for the
governed document format.

### 3. Decompose into endpoints

After application approval, create the proposed API directory structure and a
`requirements.md` in every endpoint directory. Create no tests, no route
implementations, and no generated contracts in this phase.

Present the endpoint inventory and dependency order, then accept approval,
revision, deferral, or rejection for each endpoint individually. Approving one
endpoint never authorizes another.

Read [references/service-design.md](references/service-design.md) when the
application may need more than one deployable service.

### 4. Implement approved work through TDD

For each approved endpoint, map every approved criterion to at least one test,
run those tests against the current baseline, and confirm each failure
identifies the approved missing behavior. If the baseline fails for an unrelated
reason, stop and report it: that is a broken baseline, not red state.

Implement the smallest behavior that satisfies the approved contract, then rerun
the mapped tests. Read [references/tdd.md](references/tdd.md) for the mapping
and red-state rules, [references/security.md](references/security.md) for
required request, response, and authorization behavior, and
[references/deno-kv.md](references/deno-kv.md) for bounded, index-compatible
data access.

### 5. Verify independently

Run `hollow check` and treat its result as the only source of verification. Do
not declare an endpoint verified from passing tests alone. Repair bounded
implementation defects and rerun. If satisfying the diagnostics would change
approved behavior, return to requirement review instead.

### 6. Report and deploy

Report changed files, criterion coverage, verification results, contract
outputs, deployment results, and remaining risks for the selected work.

Deploy only from a verified revision. Read
[references/deployment.md](references/deployment.md) for the plan, confirmation,
and smoke-test requirements.
