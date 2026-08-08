---
schema: sgad-application/v0.2
id: sleepy-hollow-application
title: Sleepy Hollow requirements and architecture specification
status: draft
risk: standard
depends_on: []
owners:
  - Sleepy Hollow maintainers
---

# Sleepy Hollow Requirements and Architecture Specification

**Version:** 0.4.0

**Date:** August 6, 2026

## 1. Executive summary

Sleepy Hollow is an agentic-first, simple headless framework for rapidly designing, prototyping, testing, and deploying APIs on Deno.

Its defining feature is the official Sleepy Hollow AI skill. The skill guides a user from a plain-language application idea to a reviewed API design, creates requirements beside every proposed endpoint, develops each approved endpoint through test-driven development, verifies the result with deterministic framework tooling, and deploys the finished application.

Sleepy Hollow also publishes a separate, framework-independent SGAD workflow
skill. It helps developers adopt Specification-Governed Agentic Development in
any repository without requiring the Sleepy Hollow runtime, CLI, or application
skill.

The framework is the small, reliable runtime beneath that experience. It provides file-based routing, schemas, validation, Deno KV integration, security defaults, tests, API contracts, generated clients, and fast deployment. It remains usable by a human without the skill, but it is intentionally designed so an agent can understand and operate it reliably.

The primary product promise is:

> Describe the application. Review the design endpoint by endpoint. Sleepy Hollow builds, tests, and deploys it.

The operating trust boundary is:

> The skill plans and implements. The framework independently verifies and runs the result.

Authentication is not a built-in product requirement. Each application defines its authentication and authorization needs during AI-assisted planning. Sleepy Hollow provides neutral request-principal, authorization, secret-handling, and verification interfaces so projects can use no authentication, project-specific authentication, an external provider, API keys, or service credentials without forcing one model on every application.

Microservices are optional. A project may be one deployable API, several independently deployable services, or one API designed for later extraction. Sleepy Hollow does not require distributed architecture and does not attempt to become a full microservice orchestration platform in the first release.

## 2. Product definition

### 2.1 Product category

Sleepy Hollow is an agentic-first headless application framework and development workflow. The AI skill is the primary development experience. The Deno framework and CLI provide the deterministic application runtime, checks, contracts, and deployment path that make the agentic workflow trustworthy.

Sleepy Hollow is not primarily:

- A general-purpose web framework
- A backend-as-a-service
- An autonomous agent host
- An identity provider
- An ORM for many databases
- A microservice control plane
- An enterprise requirements-management system

### 2.2 Primary users

The first release serves:

- Developers using Codex, Claude, or another compatible coding agent
- Solo developers and small teams prototyping headless applications
- Frontend developers who need a backend quickly
- Teams that want an approved, reviewable API design before implementation
- Projects that may begin small and later become production applications or independent services

### 2.3 Core value proposition

Sleepy Hollow reduces the distance between an application idea and a deployed, consumable API while retaining deliberate design and test evidence.

The user should receive:

- Guided application planning
- One comprehensive application requirements document
- A visible proposed API directory structure
- Endpoint requirements stored beside their implementations
- Endpoint-by-endpoint human approval
- Acceptance tests derived from approved criteria
- TDD-based implementation
- Deno KV persistence
- Security-aware defaults and checks
- OpenAPI documentation
- A typed TypeScript client
- A simple deployment workflow

### 2.4 Design principles

1. **Agentic integration is the main feature.** The official skill owns the primary product journey.
2. **Review design before code.** The entire application is planned before endpoints are implemented.
3. **Requirements live beside behavior.** Every endpoint directory contains its requirements, tests, and implementation.
4. **Approval is granular.** A user can approve and build one endpoint without approving the entire implementation backlog.
5. **TDD is the implementation pattern.** Approved acceptance criteria become failing tests before implementation begins.
6. **Verification is independent.** The skill cannot declare its own output correct without framework checks and passing tests.
7. **The kernel stays small.** A narrow, predictable API is easier for humans and agents to use correctly.
8. **Secure behavior should be difficult to forget.** Validation and basic protections are framework defaults.
9. **Authentication is application-defined.** The planning workflow selects the right approach for each application.
10. **Microservices are optional.** A single deployable API is the default unless independent services are justified.
11. **One strong deployment path comes first.** Fast, repeatable deployment matters more than broad platform support.
12. **Escape hatches are explicit.** Custom behavior is allowed without making the common path ambiguous.

## 3. Primary user workflow

### 3.1 Installation and project creation

The intended onboarding flow is:

1. Install the Sleepy Hollow framework and CLI.
2. Open Codex, Claude, or another supported agent environment.
3. Install or activate the official Sleepy Hollow skill when the environment supports skills.
4. Create a new project that depends on the installed Sleepy Hollow framework.
5. Invoke the skill and describe the desired application.

The first-release CLI shall support a direct project creation command such as:

```bash
hollow create my-api
```

The generated project shall be valid before application-specific endpoints exist and shall include clear instructions for activating or using the official skill.

### 3.2 Whole-application planning

The skill shall begin by understanding the application rather than generating code immediately.

It shall:

1. Inspect an existing project when present.
2. Ask only questions whose answers materially affect behavior or architecture.
3. Identify resources, data ownership, endpoints, relationships, indexes, consumers, security needs, operational constraints, and deployment goals.
4. Determine whether the application should be one API, multiple services, or one API designed for later extraction.
5. Determine whether each area requires no authentication, user authentication, API keys, external identity, or service authentication.
6. Record unresolved decisions explicitly instead of silently inventing them.
7. Create one comprehensive Markdown requirements document.
8. Prompt the user to review and approve the overall application design.

No endpoint implementation shall be generated before the application-level plan exists.

### 3.3 Master requirements document

The planning phase shall create a single authoritative document at:

```text
requirements/application.md
```

The document shall include at minimum:

- Product purpose and user goals
- Actors and API consumers
- In-scope and out-of-scope behavior
- Resource and data model
- Proposed endpoints and methods
- Relationships and indexes
- Request and response conventions
- Error behavior
- Authentication and authorization decisions, including an explicit `none` decision
- Security constraints
- Deployment model
- Single-service or multi-service architecture decision
- Cross-cutting acceptance criteria
- Endpoint inventory and dependencies
- Open questions, assumptions, and risks

This document is the approved source for decomposition. Endpoint requirements shall not introduce behavior that contradicts it.

### 3.4 Requirements decomposition and structure-first generation

After the overall design is approved, the skill shall:

1. Split the master document into endpoint-level requirements.
2. Create the complete proposed API directory structure.
3. Place a `requirements.md` file in every proposed endpoint directory.
4. Create shared model or policy requirements where multiple endpoints depend on the same contract.
5. Avoid creating endpoint tests or implementation files at this stage.
6. Present the resulting endpoint inventory to the user for review.

Example structure:

```text
my-application/
├── requirements/
│   └── application.md
├── sleepyhollow.config.ts
├── api/
│   ├── bookmarks/
│   │   ├── requirements.md
│   │   └── [id]/
│   │       └── requirements.md
│   └── collections/
│       ├── requirements.md
│       └── [id]/
│           └── requirements.md
├── models/
│   ├── bookmark.md
│   └── collection.md
└── generated/
```

After an endpoint is approved and built, its directory becomes:

```text
api/bookmarks/[id]/
├── requirements.md
├── route.test.ts
└── route.ts
```

### 3.5 Endpoint review and approval

The skill shall prompt the user to review endpoint requirements before generating tests or implementation.

The user may:

- Approve one endpoint
- Approve a group of endpoints explicitly
- Request revisions
- Defer an endpoint
- Reject an endpoint
- Return to the application-level design when a change affects shared behavior

Approval shall resolve through an independently verifiable approval record bound
to the exact requirement content and approved scope. The initial human-readable
lifecycle is intentionally small:

```text
draft -> approved -> verified
```

An endpoint frontmatter `status` is a lifecycle projection used for routing and
readability. An editable status value is not approval authority or verification
evidence by itself. Independent approval and evidence records determine the
actual governed state.

If approved behavior changes, the requirement returns to `draft`, affected tests are regenerated or revised transparently, and the user approves the changed behavior again.

### 3.6 Per-endpoint TDD loop

For each approved endpoint, the skill shall:

1. Read the endpoint requirement and its approved dependencies.
2. Generate acceptance tests that map directly to every acceptance criterion.
3. Record criterion identifiers in test names or metadata.
4. Run the tests before implementation.
5. Confirm they fail because the required behavior does not yet exist, not because the project is broken.
6. Stop and report unexpected baseline failures.
7. Generate the smallest implementation that satisfies the approved behavior.
8. Run the endpoint tests.
9. Run relevant integration tests.
10. Run `hollow check`.
11. Repair bounded implementation failures without changing approved behavior.
12. Expose the endpoint as `verified` only after an independent verifier resolves
    valid exact-content approval, mapped tests, credible red-state evidence, and
    passing results. The projected status is not itself completion evidence.
13. Report changed files, criterion coverage, verification results, and remaining risks.

The process repeats until all approved endpoints are implemented or the user chooses to stop.

### 3.7 Final generation and deployment

When the selected endpoint set is verified, the skill shall:

1. Generate or refresh OpenAPI.
2. Generate or refresh the typed TypeScript client.
3. Run the full application test suite.
4. Run `hollow check` against the complete application.
5. Present any breaking contract or data changes.
6. Prepare deployment configuration.
7. Ask for confirmation before the first external deployment or a materially risky production change.
8. Deploy through the supported target.
9. Run a smoke test.
10. Return the live API URL, contract locations, and verification summary.

## 4. Official Sleepy Hollow skill

### 4.1 Role

The official skill is the defining agentic integration. It teaches a compatible coding agent how to plan, structure, review, test, build, verify, and deploy a Sleepy Hollow application.

The framework shall not embed a managed model runtime in the first release. Model selection, conversation, and file editing remain responsibilities of Codex, Claude, or another host agent.

### 4.2 Skill responsibilities

The skill owns:

- Focused requirements gathering
- API and data design
- Security and authentication discovery
- Master requirements creation
- Requirements decomposition
- Structure-first endpoint scaffolding
- Human approval checkpoints
- Acceptance-test generation
- Red-green-refactor TDD behavior
- Endpoint implementation
- Interpretation of framework diagnostics
- Bounded repair
- Contract and client generation
- Deployment preparation and execution
- Clear completion reporting

### 4.3 Framework responsibilities

The framework and CLI own:

- Application runtime
- Routing and method dispatch
- Schema validation
- Deno KV access
- Index and pagination rules
- Error normalization
- Security defaults
- Test execution helpers
- Structural checks
- OpenAPI generation
- Typed client generation
- Deployment mechanics
- Machine-readable diagnostics

### 4.4 Skill structure

The official skill should use progressive disclosure and may use this structure:

```text
sleepyhollow/
├── SKILL.md
├── references/
│   ├── planning-and-design.md
│   ├── requirements-format.md
│   ├── endpoint-tdd.md
│   ├── security-and-auth.md
│   ├── deno-kv.md
│   ├── service-design.md
│   └── deployment.md
└── scripts/
    └── collect-project-context.ts
```

`SKILL.md` shall remain concise and contain the mandatory workflow and routing instructions. Detailed framework conventions and templates shall live in directly referenced files and be loaded only when relevant.

### 4.5 Portable agent guidance

Projects should generate concise environment-specific instructions when useful:

```text
AGENTS.md
CLAUDE.md
.github/copilot-instructions.md
```

These files provide a portable subset of the official skill's conventions. They do not replace the richer interactive workflow of the official skill.

### 4.6 Standalone SGAD workflow skill

The project shall publish a separate SGAD workflow skill for developers applying
the methodology outside the Sleepy Hollow framework. The SGAD skill shall be
framework-, language-, agent-host-, repository-, test-runner-, and deployment-
target-independent.

The skill shall guide a developer through establishing repository governance,
discovering affected behavior, drafting or revising specifications, decomposing
bounded components, obtaining approval bound to exact content, mapping tests to
stable criteria, observing credible red-state evidence, implementing only
approved scope, verifying through independent project controls, and delivering
with evidence. It shall support honest brownfield adoption without fabricating
historical approval or red-state evidence.

The SGAD skill shall keep mandatory gates in its primary instructions and load
detailed artifact, workflow, verification, adoption, and conformance guidance
progressively. It shall provide portable templates for application and component
requirements. It shall not depend on
Sleepy Hollow commands, treat an editable lifecycle field as approval, let the
producing agent certify itself, or claim SGAD conformance without sufficient
evidence.

The distributable package shall live at `skills/sgad-workflow` so open
agent-skill tooling can discover it from the repository shorthand. Public
installation guidance shall use:

```bash
npx skills add coryfail/SleepyHollow --skill sgad-workflow
```

## 5. Requirements format

Requirement placement follows behavioral ownership:

- `requirements/application.md` owns product-wide intent, shared architecture,
  cross-cutting behavior, and system-level acceptance criteria.
- A component's `requirements.md` lives beside and owns the behavior of that
  endpoint, CLI surface, runtime module, skill, website, or documentation set.
- Root `requirements.md` is reserved for durable governed behavior that spans an
  entire repository and cannot be assigned honestly to the application or one
  component.

The top-level `requirements/` directory contains only `application.md`; it is not
a collection point for miscellaneous specifications.

### 5.1 Endpoint requirement frontmatter

Each endpoint requirement shall contain stable, machine-readable frontmatter:

```yaml
---
id: bookmarks-by-id
path: /bookmarks/:id
status: draft
methods:
  - GET
depends_on:
  - bookmark-model
service: application
---
```

The `status` field is workflow-routing metadata and a lifecycle projection. Its
editable value cannot serve as sole approval authority or verification evidence.
The requirement must instead resolve independently verifiable records bound to
its exact content and governed scope.

### 5.2 Required sections

Each endpoint requirements file shall contain:

- Purpose
- Supported method or methods
- Inputs
- Success responses
- Error responses
- Authentication decision
- Authorization rules when applicable
- Data access and indexes
- Side effects
- Rate-limit or abuse considerations when applicable
- Acceptance criteria with stable identifiers
- Dependencies and assumptions

Example:

```md
---
id: bookmarks-by-id
path: /bookmarks/:id
status: draft
methods:
  - GET
depends_on:
  - bookmark-model
service: application
---

# Bookmark by ID

Return one bookmark by its primary identifier.

## GET

### Input

- `id`: Bookmark ID from the path.

### Success response

- Status: `200`
- Body: The matching bookmark.

### Errors

- `400` when the ID is malformed.
- `404` when no bookmark exists.

### Security

- Authentication: None.
- Authorization: None.

### Data access

- Read by primary ID.
- No unbounded query.

### Acceptance criteria

- AC-001: A valid existing ID returns the matching bookmark with status `200`.
- AC-002: A valid unknown ID returns an RFC 9457 `404` response.
- AC-003: A malformed ID returns an RFC 9457 `400` response.
```

### 5.3 Embedded governance format

Each application and endpoint `requirements.md` shall contain its complete
`Governance record` after the behavioral specification. It embeds exact-content
approval, bidirectional criterion mapping, credible red-state evidence,
independent verification, and applicable delivery results. Calculate the
governed-content digest from the exact bytes before the `## Governance record`
heading after omitting the one top-level frontmatter `status:` line and its line
ending. No other normalization is permitted. This keeps the human-readable
lifecycle projection outside the approval digest while binding every behavioral
section. Supporting Git, review, CI, or attestation provenance may be linked
from the embedded record.

### 5.4 Acceptance-criterion traceability

Every approved acceptance criterion shall map to at least one test. Tests may cover multiple criteria when the mapping remains explicit. Verification shall report:

- Criteria with passing tests
- Criteria with failing tests
- Criteria with no mapped tests
- Tests that do not map to approved behavior

The initial release does not require cryptographic test locking. The skill shall not silently weaken or remove approved tests. Changes to tests derived from approved criteria must be shown to the user when they change intended behavior.

## 6. Framework kernel

### 6.1 File-based routes

Sleepy Hollow shall use predictable file-based API routes. Directory segments map to URL segments, and dynamic folders such as `[id]` map to path parameters.

Each implemented route shall declare:

- HTTP method
- Input schemas
- Output schemas
- Handler
- Authentication or principal expectations when applicable
- Authorization guard when applicable
- Contract metadata needed for OpenAPI

### 6.2 Validation

The framework shall:

- Validate path, query, header, and body inputs at runtime
- Validate declared response bodies
- Reject unknown input fields by default
- Apply explicit body-size limits
- Produce actionable validation errors
- Generate contract schemas from the same definitions used at runtime

### 6.3 Data access

The first release shall use Deno KV as its supported persistence system.

The framework shall provide:

- Typed key and value access
- Resource-oriented repositories or equivalent small primitives
- Declared secondary indexes
- Cursor pagination
- Bounded list operations
- Uniqueness enforcement using atomic checks where supported
- Atomic operations where Deno KV permits them
- Test database isolation
- Explicit raw-KV escape hatch

The framework shall detect or warn about:

- Unbounded reads
- Filtering without a compatible declared index
- Unsafe read-modify-write patterns
- Production code directly using raw Deno KV without an explicit escape hatch

### 6.4 Relationships

The first release shall support simple references and indexed lookups, including a basic `belongsTo` pattern. It shall not promise SQL-style joins, automatic cascading behavior, or distributed transactions.

### 6.5 Error format

API errors shall use RFC 9457 Problem Details. Production responses shall not expose stack traces, secrets, internal KV keys, or implementation details.

### 6.6 Custom behavior

Custom routes and handlers are first-class. Applications shall not be forced into generated CRUD when the approved requirements call for purpose-specific behavior.

## 7. Authentication and authorization flexibility

### 7.1 Product boundary

Sleepy Hollow v0.1 shall not ship a mandatory built-in authentication system or prescribe email/password, passwordless, OIDC, sessions, JWTs, API keys, or service credentials for all applications.

Authentication shall be selected during application planning and documented in:

- The master application requirements
- Every affected endpoint requirement
- Shared security or identity requirements when used by multiple endpoints

An application may explicitly choose:

- No authentication
- Project-defined user authentication
- External identity provider
- API key authentication
- Signed bearer tokens
- Service credentials
- Another reviewed project-specific mechanism

### 7.2 Framework integration boundary

The framework shall provide a neutral principal and authorization interface so authentication can be added without rewriting route behavior.

Conceptually:

```ts
export interface AuthProvider {
  authenticate(request: Request): Promise<Principal | null>;
}

export interface Principal {
  id: string;
  type: "user" | "service" | "api-key" | string;
  claims?: Record<string, unknown>;
}
```

This interface is a compatibility boundary, not a built-in identity product.

### 7.3 Skill behavior

The skill shall not invent security-sensitive authentication code without review. When authentication is required, it shall:

1. Identify the application actors and trust boundaries.
2. Prefer an established, maintained provider or project dependency when appropriate.
3. Document credentials, sessions or tokens, expiration, revocation, transport, CSRF implications, and authorization behavior.
4. Define `401` and `403` behavior for every protected endpoint.
5. Create acceptance criteria for authentication and authorization failures.
6. Flag custom credential storage or cryptographic design for explicit review.

### 7.4 Authorization

Authorization remains endpoint behavior even when authentication is supplied externally. Protected endpoints shall declare their guard or policy. `hollow check` shall flag endpoints whose requirements demand protection but whose implementation lacks a corresponding guard.

## 8. Basic security

The framework shall include security controls that are broadly applicable regardless of the authentication approach:

- Runtime input and output validation
- Unknown-field rejection
- Safe error responses
- Secure response headers
- Explicit production CORS configuration
- Request body limits
- Bounded pagination
- Indexed-query enforcement
- Configurable rate limiting
- Secret and authorization-header redaction
- Production environment validation
- Request IDs
- Dependency and configuration warnings where practical

`hollow check` shall compare endpoint security requirements with route configuration and report missing protections.

Security checks shall be machine-readable and actionable. An error should identify the route, requirement, violated rule, and a safe correction path.

## 9. Optional microservices

### 9.1 Architecture choice

Microservices are an optional planning decision, not a default framework mode. The skill shall ask whether the application should be:

- One deployable API
- Multiple independently deployable services
- One API with boundaries designed for possible extraction later

The skill should recommend one API unless independent ownership, scaling, deployment, isolation, or lifecycle needs justify multiple services.

### 9.2 Structure

When multiple services are approved, each service shall have its own application requirements, endpoint requirements, runtime configuration, contract, tests, deployment, and Deno KV database.

```text
services/
├── users/
│   ├── requirements/application.md
│   ├── sleepyhollow.config.ts
│   └── api/
├── projects/
│   ├── requirements/application.md
│   ├── sleepyhollow.config.ts
│   └── api/
└── notifications/
    ├── requirements/application.md
    ├── sleepyhollow.config.ts
    └── api/
```

### 9.3 Service rules

- Each service owns its data.
- A service shall not read another service's Deno KV database.
- Cross-service access occurs through an API contract and generated client.
- Service authentication is defined by the approved project requirements.
- Request deadlines and cancellation shall be supported.
- Request IDs shall propagate between services.
- Cross-service operations shall not imply atomic transactions.
- Partial failure behavior shall be documented in requirements.

### 9.4 First-release boundary

The first release may support service-shaped projects and generated service clients without providing:

- Service discovery
- Token exchange
- A central identity service
- JWKS hosting
- Circuit breakers
- Distributed transactions
- Saga orchestration
- Event infrastructure
- Coordinated multi-service deployment
- Distributed tracing infrastructure

These may be added later when real applications demonstrate the need.

## 10. API contracts and clients

Every implemented application or service shall generate:

- OpenAPI specification
- Local API documentation
- Framework-neutral typed TypeScript client
- Typed requests and responses
- Typed RFC 9457 errors
- Runtime response validation where configured
- Configurable base URL and fetch implementation
- Authentication injection hook without assuming one auth model

Contract generation shall derive from the same normalized route and schema definitions used by the runtime.

`hollow check` shall detect stale generated artifacts and common breaking changes, including:

- Removed routes or methods
- Newly required input
- Removed response properties
- Narrowed types
- Changed error contracts
- Changed authentication requirements
- Changed pagination behavior

## 11. Testing and verification

### 11.1 Test utilities

Sleepy Hollow shall provide utilities for:

- Starting an application in test mode
- Isolated Deno KV databases
- Typed request helpers
- Seeding and cleaning data
- Supplying a project-defined principal or credentials
- Asserting RFC 9457 responses
- Testing generated clients against the application

### 11.2 `hollow check`

`hollow check` shall be independent of the skill and shall verify at minimum:

- Type checking
- Unit and acceptance tests
- Requirement-to-test criterion mapping
- Route and method consistency
- Request and response schema coverage
- OpenAPI consistency
- Generated client consistency
- Missing or incompatible indexes
- Unbounded queries
- Required authorization guards
- Security configuration
- Pending or unreviewed data changes
- Breaking contract changes

All commands shall support human-readable output and structured `--json` output suitable for agents and automation.

### 11.3 Verification status

An endpoint may be marked `verified` only when:

- Its requirement is approved
- Every acceptance criterion maps to a test
- The expected pre-implementation failure was observed
- All mapped tests pass after implementation
- Relevant integration checks pass
- `hollow check` passes for the endpoint and its affected dependencies

## 12. CLI

The initial CLI shall remain small:

```bash
hollow create
hollow dev
hollow test
hollow check
hollow generate
hollow deploy
```

The CLI shall:

- Be usable by humans and agents
- Support `--json` where output is consumed programmatically
- Emit stable error codes
- Name affected requirements, criteria, routes, fields, indexes, or config keys
- Avoid hidden destructive changes
- Preview data and contract changes before applying them
- Return nonzero status for failed required checks

The CLI does not need commands for invoking or managing AI models in the first release. That behavior belongs to the official skill and its host agent.

## 13. Configuration and observability

The framework shall provide:

- Typed environment configuration
- Startup validation
- Local environment-file support
- Secret redaction
- Development, test, preview, and production modes
- Structured JSON logs
- Request IDs
- Health endpoint
- Readiness endpoint when a service has external dependencies

Logs shall not contain secrets, authorization headers, session material, raw credentials, or sensitive request bodies by default.

## 14. Deployment

Fast deployment is part of the primary product experience.

The first release shall support:

- Local Deno development
- One excellent hosted production target, initially Deno Deploy
- Environment validation before deployment
- Full verification before deployment
- Deployment preview or plan
- Deployment through `hollow deploy`
- Post-deployment health and smoke tests
- Clear live URL and contract output

The skill shall guide deployment, but the CLI shall perform the deterministic build, validation, upload, and smoke-test steps.

Standalone executables and additional cloud adapters are deferred until the initial path is reliable.

## 15. First-release scope

### 15.1 Required

- Official Sleepy Hollow agent skill
- Standalone framework-independent SGAD workflow skill
- Whole-application planning dialogue
- Comprehensive `requirements/application.md`
- Endpoint requirement decomposition
- Structure-first API scaffolding
- Endpoint-by-endpoint approval
- Acceptance-criterion traceability
- Per-endpoint TDD loop
- File-based routes
- Custom route handlers
- Request and response schemas
- Deno KV persistence
- Declared indexes and cursor pagination
- Basic relationships
- RFC 9457 errors
- Basic security defaults
- Neutral auth-provider and principal hooks
- OpenAPI generation
- Typed TypeScript client generation
- Independent `hollow check`
- Human and JSON CLI output
- Local development
- One hosted deployment target
- Optional multi-service project structure
- Generated cross-service clients

### 15.2 Explicitly deferred

- Built-in email/password authentication
- Built-in passwordless authentication
- Built-in OIDC product
- Social login and account linking
- Managed Codex or Claude invocation from the CLI
- Agent runtime, model routing, and token accounting
- Cryptographically locked tests
- Complex requirements state machines
- Full migration automation
- Additional databases
- File and object storage
- Background jobs and cron
- Universal extension marketplace
- Multiple deployment adapters
- Standalone executable deployment
- Full microservice orchestration
- User token exchange and shared identity infrastructure
- Circuit breakers and distributed tracing
- Enterprise approval governance

### 15.3 Non-goals

- Generating implementation before requirements review
- Requiring users to approve all endpoints at once
- Treating AI output as verified without independent evidence
- Forcing authentication on public applications
- Forcing one identity model on every project
- Encouraging agents to invent cryptography or credential storage casually
- Requiring microservices for simple applications
- Hiding application behavior in implicit package scanning or magic activation

### 15.4 Colocated requirement inventory

| ID | Location | Responsibility |
|---|---|---|
| SH-F001 | `cli/create/requirements.md` | Installation and safe project creation |
| SH-F002 | `core/routing/requirements.md` | File-based HTTP routing runtime |
| SH-F003 | `core/validation/requirements.md` | Schemas, validation, and Problem Details |
| SH-F004 | `core/kv/requirements.md` | Typed, bounded Deno KV access |
| SH-F005 | `core/security/requirements.md` | Security, authentication, and authorization boundaries |
| SH-F006 | `skills/sleepy-hollow/planning/requirements.md` | Application planning, decomposition, and approval |
| SH-F007 | `core/testing/requirements.md` | Test utilities and criterion traceability |
| SH-F008 | `cli/check/requirements.md` | Independent `hollow check` verification |
| SH-F009 | `skills/sleepy-hollow/requirements.md` | Official agent skill and end-to-end workflow |
| SH-F010 | `cli/generate/requirements.md` | OpenAPI and typed-client generation |
| SH-F011 | `cli/requirements.md` | Shared CLI behavior and diagnostics |
| SH-F012 | `core/config/requirements.md` | Configuration and observability |
| SH-F013 | `cli/deploy/requirements.md` | Verified Deno Deploy delivery |
| SH-F014 | `core/services/requirements.md` | Optional multi-service projects |
| SH-F015 | `cli/dev/requirements.md` | Local development server |
| SH-F016 | `cli/test/requirements.md` | Test execution and criterion results |
| SH-F017 | `skills/sgad-workflow/requirements.md` | Framework-independent SGAD workflow skill |
| SH-F018 | `cli/evidence/requirements.md` | Repository evidence loading for check, test, and deploy |

## 16. MVP acceptance criteria

The first release is complete when all of the following are demonstrated:

1. A user can install Sleepy Hollow and create a valid project.
2. The official skill can turn a plain-language idea into a comprehensive application requirements document.
3. The user can review and approve the application design before implementation.
4. The skill can decompose the design into endpoint requirements and create the API folder structure without generating endpoint code.
5. Every proposed endpoint contains `requirements.md` before it contains tests or implementation.
6. A user can approve endpoints individually.
7. Approval of one endpoint causes the skill to generate tests mapped to its acceptance criteria.
8. The skill runs the tests before implementation and recognizes the expected failure.
9. The skill implements the endpoint and obtains passing tests without weakening approved behavior.
10. `hollow check` independently verifies the endpoint.
11. The application persists and queries data through Deno KV with declared indexes and bounded pagination.
12. Invalid input and unknown fields are rejected consistently.
13. Errors use RFC 9457 without leaking sensitive implementation details.
14. The skill can plan an application with no authentication.
15. The skill can plan and integrate a reviewed project-defined authentication approach through the neutral framework interface.
16. Security checks identify a protected endpoint missing its required guard.
17. OpenAPI and a typed TypeScript client are generated from the implemented contract.
18. Breaking contract changes are detected.
19. Human-readable and JSON diagnostics identify actionable failures.
20. The skill can deploy a verified application and return its live URL.
21. A deployment smoke test verifies the live health endpoint and one representative API operation.
22. The skill can optionally scaffold two independent services with separate requirements and Deno KV stores.
23. One service can call another through a generated client using the authentication approach approved in that project's requirements.
24. No service reads another service's Deno KV data directly.
25. A developer can use the standalone SGAD skill in a non-Sleepy Hollow
    repository to establish governance, create reviewable requirements, preserve
    approval and red-state gates, and produce an evidence-based verification
    handoff without claiming unsupported conformance. The skill is discoverable
    from `skills/sgad-workflow` through the documented `npx skills add`
    repository command.

## 17. Delivery sequence

### Phase 1: Minimal framework kernel

- File-based routing
- Schemas and validation
- Deno KV primitives
- Errors and basic security
- Test utilities
- Human-readable and JSON diagnostics
- Project creation

### Phase 2: Requirements and verification

- Master and endpoint requirements formats
- Structure-first scaffolding support
- Criterion mapping
- `hollow test`
- `hollow check`
- Contract consistency checks

### Phase 3: Agent skills

#### Official Sleepy Hollow skill

- Planning questions
- Application design
- Master document generation
- Endpoint decomposition
- Approval workflow
- TDD implementation loop
- Bounded repair and reporting

#### Standalone SGAD workflow skill

- Repository governance and adoption assessment
- Application and component specification guidance
- Exact-content approval and criterion traceability
- Red-state, implementation, and independent-verification gates
- Portable artifact templates and evidence-based handoff

### Phase 4: Headless outputs

- OpenAPI
- Local documentation
- Typed client
- Breaking-change detection

### Phase 5: Deployment

- Deno Deploy target
- Environment validation
- Deployment plan
- Smoke tests
- Skill-guided deployment flow

### Phase 6: Optional services

- Multi-service structure planning
- Independent service contracts
- Generated service clients
- Project-defined service-auth integration
- Request deadline and request-ID propagation

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The skill generates code before design approval | Product loses its defining workflow | Require master planning and endpoint status checks before test or code generation |
| The skill modifies tests to make code pass | False verification | Map tests to approved criteria, show behavioral test changes, and verify independently |
| One giant requirements file becomes hard to use | Agent context and review degrade | Use it as the approved source, then decompose into colocated endpoint files |
| Endpoint files duplicate shared rules inconsistently | Contracts drift | Keep shared model and policy requirements and validate dependencies |
| Flexible authentication encourages unsafe custom code | Credential or authorization vulnerabilities | Prefer reviewed providers, define a neutral interface, require explicit security criteria, and flag custom crypto |
| Agentic scope expands into an AI platform | Release is delayed | Keep model execution in the host agent and the workflow in the skill |
| The standalone SGAD skill drifts from the methodology | Developers receive contradictory governance guidance | Keep methodology documents authoritative and validate the skill's gates, references, and templates against them |
| Framework API becomes too broad for agents | Lower implementation reliability | Maintain a small canonical API and explicit escape hatches |
| Microservices add premature complexity | Slow prototypes and operational burden | Default to one API and require planning justification for multiple services |
| Deno KV limits future workloads | Rework for advanced data needs | Keep data access behind stable primitives and document the escape hatch |
| Fast deployment bypasses review | Unsafe production changes | Require verification, plans, confirmation for first or risky deployment, and smoke tests |

## 19. Open implementation decisions

The following decisions require prototypes or focused evaluation before their exact implementation becomes normative:

| ID | Decision | Evaluation goal |
|---|---|---|
| OPEN-001 | Route module API | Proposed resolution in SH-F002: one default `defineRoute` method-map export per endpoint directory, with the filesystem as the sole path source |
| OPEN-002 | Schema library | Proposed resolution in SH-F003: pinned Zod 4 schemas with fail-closed JSON Schema/OpenAPI normalization from the same runtime definitions |
| OPEN-003 | Deno KV index encoding | Proposed resolution in SH-F004: native tuple keys, pointer indexes, versionstamp checks, and native opaque cursors behind bounded declared-index queries |
| OPEN-004 | Requirement parser | Proposed resolution in SH-F006: strict YAML 1.2 core frontmatter plus ordinary Markdown headings and stable acceptance-criterion list items, with deterministic source diagnostics and no proprietary authoring syntax |
| OPEN-005 | Criterion-to-test metadata | Proposed resolution in SH-F007: a transparent `criterionTest` wrapper registers native Deno tests with stable test, requirement, and criterion IDs while exposing the same frozen metadata for manifests and reports |
| OPEN-006 | Endpoint-local verification | Proposed resolution in SH-F007: targeted checks close transitively over both requirement dependencies and dependents, then escalate to the full relevant suite whenever ownership or graph safety is uncertain |
| OPEN-007 | Auth-provider interface | Proposed resolution in SH-F005: named project providers return a validated neutral principal, while routes explicitly declare none or required authentication and optional guards |
| OPEN-008 | Rate limiting | Proposed resolution in SH-F005: bounded process-local fixed windows for test/development and a pluggable shared-scope adapter requirement for protected production routes |
| OPEN-009 | Generated client shape | Proposed resolution in SH-F010: one dependency-free Web Standards TypeScript module with required base URL, injectable fetch and neutral authentication hook, optional fail-closed response validation, and no persistence or framework-runtime access |
| OPEN-010 | Skill portability | Rich Codex skill plus useful Claude and generic-agent guidance |
| OPEN-011 | Deno Deploy integration | Fast setup with safe credential handling and reliable smoke tests |

## 20. Definition of done for an endpoint

An endpoint is done when:

- A valid approval record resolves to the exact content of its `requirements.md`
  and bounded criteria.
- Its dependencies are approved or explicitly available.
- Every acceptance criterion maps to at least one test.
- The pre-implementation tests failed for the expected missing behavior.
- The endpoint implementation satisfies the approved contract.
- All mapped tests pass.
- Relevant integration tests pass.
- Input and output schemas are complete.
- Required security and authorization behavior is enforced.
- Data access is bounded and index-compatible.
- OpenAPI and generated client output are current.
- `hollow check` passes.
- A content-bound verification result establishes the verified state; any
  editable status field is only a lifecycle projection.
- The completion report identifies changes, evidence, and remaining risks.

## 21. Final product statement

Sleepy Hollow is an agentic-first platform for rapidly building and deploying headless applications. Its official AI skill plans the complete application, creates reviewable requirements beside every endpoint, develops approved behavior through TDD, and deploys the result on a simple Deno framework that independently verifies the work. Its separate SGAD workflow skill makes the underlying methodology usable by developers in any software repository.

The shortest expression of the product is:

> Describe it. Review it. Sleepy Hollow builds and deploys it.

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: pending exact-content product approval.
- Approver, time, approved criteria, digest, and decision source: pending.

### Criterion mapping

- Status: pending exact-content product approval and governed tests.

### Red-state evidence

- Status: pending approved product test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent product verification.

### Delivery

- Status: not applicable while the application specification remains draft.
