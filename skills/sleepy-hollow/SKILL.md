---
name: sleepy-hollow
description: Build and deploy a headless API on the Sleepy Hollow Node.js and Bun framework. Use when a developer describes an application idea to build, asks to add or change an endpoint in a Sleepy Hollow project, or asks to verify or deploy one. Plans the whole application first, writes requirements beside every endpoint, implements approved behavior through TDD, and verifies with hollow check before deployment.
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
- Use Drizzle for durable relational persistence unless the human explicitly approves a recorded alternative.
- Put every model in `models/<model>/` with its own governed `<model>.req.md`, `schema.ts`, `repository.ts`, and `types.ts`.
- Keep database access inside model repositories and out of route handlers.
- Apply the same application engineering standard to AI-generated and human-authored code.
- Document every application-owned function and format implementation code as readable multi-line blocks.
- Require passing formatter and linter results before verification.

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

Produce one `requirements/application.req.md` covering purpose, actors, scope, data
model, endpoints, relationships, indexes, conventions, errors, authentication,
authorization, security, operations, deployment, service architecture,
cross-cutting criteria, dependencies, assumptions, and open questions.

For data that must survive a request or process restart, make Drizzle the
default ORM and choose the supported SQLite or PostgreSQL profile. Do not replace
Drizzle because the agent inferred a preference. Record a non-Drizzle option
only after a human explicitly names and confirms it, including the decision
source in the application requirement. Record an explicit `no persistence`
decision when no data must persist. Read
[references/persistence.md](references/persistence.md) for the planning and
implementation rules.

List each model as a separately owned component. Its requirement defines fields,
relationships, constraints, indexes, access paths, retention, security, and
migrations. Read [references/models.md](references/models.md) for the required
layout and ownership boundaries.

Use the local application requirement format exactly: `schema:
sgad-application/v0.2`, stable `id`, `title`, `risk`, `status`, `depends_on`,
and non-empty `owners`. The parser rejects the legacy
`sleepy-hollow-application/v0.1` shape. Read
[references/requirement-format.md](references/requirement-format.md) before
migrating an existing scaffold.

For the root application requirement, use `depends_on: []` unless a reviewed
dependency is intentional. Because framework 0.4.1 includes this application
requirement in verification scope, map every approved application criterion to
one or more governed `criterionTest(...)` tests as well as mapping endpoint
criteria.

Authentication planning must record actors, trust boundaries, credential kind,
expiration, revocation, transport, cross-site request implications, and the
`401` and `403` response behavior whenever authentication is required. An
application that needs no authentication records that decision explicitly.

Present the application for review. Do not decompose it until approval binds its
exact content. Read
[references/requirement-format.md](references/requirement-format.md) for the
governed document format.

### 3. Decompose into models and endpoints

After application approval, create one `models/<model>/<model>.req.md` for every
proposed model, plus the proposed API directory structure and named
`<requirement-id>.req.md` files in endpoint directories. A model directory owns
exactly one model requirement. An endpoint directory may contain multiple
independently governed requirement files. Create no schemas, repositories,
tests, route implementations, or generated contracts in this phase.

Present the model and endpoint inventories with dependency order, then accept
approval, revision, deferral, or rejection for each requirement individually.
Approve model requirements before endpoint requirements that depend on them.
Approving one requirement never authorizes another.

Read [references/service-design.md](references/service-design.md) when the
application may need more than one deployable service.

### 4. Implement approved work through TDD

For each approved endpoint, map every approved criterion to at least one test,
run those tests against the current baseline, and confirm each failure
identifies the approved missing behavior. If the baseline fails for an unrelated
reason, stop and report it: that is a broken baseline, not red state.

Implement the smallest behavior that satisfies the approved contract, then rerun
the mapped tests. After the unit tests pass, exercise the changed behavior with
a smoke test through the public API boundary when the environment permits it.
Read [references/tdd.md](references/tdd.md) for the mapping, red-state, and
smoke-test rules, [references/security.md](references/security.md) for required
request, response, and authorization behavior, and relational resource
definitions for bounded, index-compatible data access. Read
[references/code-quality.md](references/code-quality.md) before writing or
reviewing application code.

Treat that reference as the application's contributor standard, not as an
agent-only preference. Preserve or create the project's human-facing
`CONTRIBUTING.md`, and keep it aligned with the same formatter, linter,
TypeScript, architecture, security, testing, and exception rules.

Implement approved models before their dependent endpoints. Keep Drizzle schemas,
public types, and repositories in the owning model directory. Routes may call a
model repository; they may not import Drizzle, database drivers, or raw database
capabilities.

### 5. Verify independently

Run `hollow check` and treat its result as the only source of verification. Do
not declare an endpoint verified from passing tests alone. In framework 0.4.1,
run these commands in order:

```bash
npm run format:check
npm run lint
npm run verify
npx hollow test
npx hollow check
```

`hollow test` must run before `hollow check`: it discovers governed
`criterionTest(...)` registrations and persists
`generated/test-manifest.json` and `generated/test-results.json`; the
capture-aware tests must also write the current `generated/capture.json`.
`hollow check` consumes all three persisted artifacts; it does not replace them
with an empty or inferred test manifest. It also includes the configured
application requirement in its inventory, so every approved application
criterion must be mapped to a governed test. Otherwise the check reports
`SH_CHECK_CRITERION_UNMAPPED` even when endpoint criteria are covered.

The check also discovers model requirements and source standards. It fails when
a model lacks its governed files, a model schema does not use Drizzle, route code
accesses a database directly, or application-owned functions violate the
documentation, type-safety, complexity, suppression, structured-logging, or
multi-line source rules.

Read the current discovery boundary and known limitations in
[references/tdd.md](references/tdd.md). A direct Vitest pass is not
independent verification. Repair bounded implementation defects and rerun. If
satisfying the diagnostics would change approved behavior, return to requirement
review instead.

### 6. Report and deploy

Report changed files, criterion coverage, verification results, contract
outputs, deployment results, and remaining risks for the selected work.

Deploy only after the formatter check, linter, `npm run verify`, `npx hollow test`,
and `npx hollow check` have completed successfully for the same revision. Read
[references/deployment.md](references/deployment.md) for the plan, confirmation,
and smoke-test requirements.
