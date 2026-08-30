# Application standards

Sleepy Hollow applications use one declared engineering standard whether the
contributor is a human, an AI agent, or both. AI-generated and human-authored
application code receive the same review and must pass the same controls.

This guide is the framework's concrete application policy. It extends SGAD's
technology-neutral [engineering-quality baseline](../sgad/engineering-quality.md),
which requires each adopting project to own its specific tools, thresholds, and
architecture. It does not redefine SGAD for applications that do not use Sleepy
Hollow.

## Persistence starts with Drizzle

Durable relational persistence uses Drizzle by default with one of the supported
profiles:

- SQLite for the embedded default;
- PostgreSQL for managed relational storage.

An alternative is allowed only after an explicit human decision is written into
the governing application or model requirement and approved as exact content.
An agent preference, an existing dependency, or an inferred architecture is not
human approval.

Every durable model owns a directory with this minimum shape:

```text
models/<model>/
├── <model>.req.md
├── schema.ts
├── repository.ts
└── types.ts
```

The files have distinct responsibilities:

- `<model>.req.md` governs the model's behavior and records approval and evidence.
- `schema.ts` declares its Drizzle schema and persistence constraints.
- `repository.ts` owns database access and translates persistence details into
  the model's domain contract.
- `types.ts` exposes the model's public types.

Routes own HTTP concerns: transport validation, authentication and authorization,
repository calls, and responses. Routes do not import Drizzle, database drivers,
raw database clients, or framework database capabilities. See [Data](./data.md)
for the complete persistence contract and [Writing requirements](./writing-requirements.md)
for governed requirement structure.

## Authored source stays readable

Application source must be readable during review, not merely executable:

- Write multi-line code with one logical statement per line, intentional names,
  consistent formatting, and no delivered placeholders, dead code, or commented-
  out implementations.
- Add TSDoc to every application-owned function, including callbacks. Describe
  the function's purpose, inputs, output, and externally visible errors or side
  effects rather than narrating its syntax.
- Give each function one cohesive responsibility. Keep its parameters, executable
  lines, branch complexity, and nesting within the framework's declared bounds;
  extract named collaborators when it grows beyond them.
- Use strict TypeScript without `any`, unchecked non-null assertions, ignored type
  errors, or other unsafe escapes. Receive uncertain external values as `unknown`
  and validate them before use.
- Validate all trust boundaries, use explicit typed errors, and translate failures
  into the framework's RFC 9457 problem responses at the transport boundary.
- Await asynchronous work, bound external operations with timeouts or cancellation,
  use transactions for atomic changes, and avoid unbounded or N+1 database work.
- Keep route, model, and repository responsibilities separate. Prefer named,
  domain-specific modules over generic dumping grounds.
- Use structured logging without secrets or raw credentials, distinguish
  authentication from authorization, deny access by default, and review every
  dependency for necessity and maintenance risk.
- Write deterministic, criterion-mapped tests that cover approved behavior and
  meaningful failure paths. Generated and vendored artifacts must remain clearly
  distinguishable from application-owned source.

The detailed thresholds and review checklist live with the Sleepy Hollow skill's
application code standard. When a project adds stricter rules, its governing
requirements and verification configuration must name them explicitly.

## Required quality gate

Run the application gate in this order from a clean working state:

```sh
npm run format:check
npm run lint
npm run check
npm run test
npx hollow test
npx hollow check
```

The controls are complementary. Formatting and linting enforce source policy;
type checking rejects unsafe contracts; tests exercise approved behavior;
`hollow test` captures governed execution evidence; and `hollow check`
independently evaluates the current revision. A skipped or failed command
prevents verification.

Read [Verification](./verification.md) for the evidence model. These standards
and a passing gate do not guarantee complete intent, defect-free code, security,
or freedom from human review. They make the declared policy and its evidence
inspectable; they do not replace engineering judgment.
