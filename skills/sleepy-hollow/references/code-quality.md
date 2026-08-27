# Application engineering standard

This is the canonical code standard for every Sleepy Hollow application. It
applies equally to AI-generated and human-authored code. A contributor may not
lower the standard because code was generated, and an agent may not replace it
with its own preferences.

## Formatting, layout, and naming

Use the repository's version-controlled Prettier and ESLint configuration. Keep
lines within 100 columns, put one logical statement on each line, and write
functions, tests, objects, and control flow as readable multi-line blocks. Group
imports by origin, remove unused or commented-out code, and do not leave TODO or
placeholder implementations in delivered work.

Use names that describe domain intent. Functions use verb phrases, booleans
begin with `is`, `has`, `can`, or `should`, and model terminology matches the
approved requirements. Avoid single-letter names outside conventional short
indexes and avoid unexplained abbreviations.

## Functions and documentation

Every application-owned function has an immediately preceding concise TSDoc
comment. This includes exported and local functions, methods, handlers, test
helpers, and callbacks. Prefer a named function when an anonymous callback
cannot be documented clearly. State purpose and observable behavior rather than
repeating the function name; document inputs, output, errors, and side effects
when they are not obvious from the signature.

Each function has one responsibility, no more than four parameters, no more
than 40 executable lines, cyclomatic complexity no greater than 10, and control
flow nested no deeper than three levels. Prefer early returns and an options
object over deeply nested branches or long positional parameter lists. Extract
a focused named helper when a function crosses a limit or performs unrelated
work.

Comments explain intent, policy, or a non-obvious tradeoff. Do not narrate
syntax. Delete obsolete code instead of commenting it out.

## TypeScript safety

Use strict TypeScript with unchecked indexed access, exact optional properties,
implicit override checks, implicit-return checks, and fallthrough checks
enabled. Public boundaries declare explicit input and return types. Internal
inference is welcome when the result remains unambiguous.

Do not use explicit `any`, unchecked non-null assertions, `@ts-ignore`, or
`@ts-nocheck`. Accept uncertain external values as `unknown`, validate or narrow
them, and model invalid states out of the type system when practical. Use
type-only imports and exhaustive handling for closed unions.

## Boundaries, validation, and errors

Validate every request, environment variable, webhook, file, and external
service value at the boundary before it reaches domain or persistence logic.
Parse configuration once during startup and fail with an actionable message
when it is invalid. Never assume a value is trustworthy because TypeScript
describes it.

Expected failures use typed domain errors and map consistently to RFC 9457
problem responses. Unexpected failures retain their cause and useful diagnostic
context. Never silently swallow an error or expose a stack trace, query, secret,
or internal implementation detail. A `catch` block must recover, translate, add
context, or rethrow; an empty catch block is forbidden.

## Async and resource safety

Do not leave floating promises. Await an operation unless deliberately returning
its promise, and use `Promise.all` only when operations are independent. External
I/O has an appropriate timeout and cancellation path. Related durable writes
use a transaction. Avoid sequential query patterns that create N+1 behavior,
and release acquired resources on both success and failure.

## Architecture and persistence

Routes own HTTP validation, authorization orchestration, repository calls, and
response formation. Models own domain concepts and public types. Repositories
own persistence, transactions, and record mapping. Shared business policy lives
in a focused governed module, not in a generic `utils` dumping ground. Keep
dependencies directed toward domain boundaries and do not introduce circular
imports.

Drizzle is the default for durable relational data. Follow the model layout,
repository boundary, indexing, migration, and exception rules in `models.md`
and `persistence.md`. Collection reads are bounded; multi-step writes use the
approved concurrency strategy.

## Security, logging, and dependencies

Treat authentication and authorization as separate checks. Authorization is
deny-by-default and verifies resource ownership or tenant scope. Parameterize
database operations and apply the approved abuse controls. Never log passwords,
credentials, session values, tokens, secrets, or sensitive personal data.

Use the application's structured logger rather than `console`. Include a request
or correlation identifier where one exists and record enough context to
diagnose a failure without leaking protected data. Health checks distinguish
process liveness from dependency readiness.

Before adding a package, confirm that the framework or an existing dependency
does not already provide the capability. Record the concrete reason for a new
dependency, review its security and maintenance posture, and review the lockfile
change. Do not add a package for trivial functionality.

## Tests

Map every approved acceptance criterion to a deterministic test. Tests state one
primary behavior clearly, use an Arrange-Act-Assert shape or an equally readable
structure, and cover success, validation, authorization, failure, and boundary
behavior relevant to the requirement. Mock external boundaries rather than the
implementation under test. Every defect repair adds a regression test.

Do not use test ordering, live network state, wall-clock timing, randomness
without a fixed seed, or shared mutable state. Do not weaken assertions to make
a test pass. Criterion coverage is required; a blanket line-coverage percentage
is not a substitute for behavioral evidence.

## Exceptions

Blanket ESLint or TypeScript suppressions are forbidden. A narrow suppression
must name the exact rule, explain why the safer form is not viable, and be bound
to the owning approved requirement. Architecture, persistence, security, or
quality exceptions also record scope, reason, approver, and decision source.

## Quality gate

Run the following against the same revision, in order:

```bash
npm run format:check
npm run lint
npm run check
npm run test
npx hollow test
npx hollow check
```

Do not declare verification when a command was skipped or failed. `hollow check`
independently scans application, model, and test TypeScript for bounded source
standards, including documentation, readable bodies, line length, unsafe type
escapes, suppressions, console use, function limits, empty catches, model
architecture, and route persistence boundaries. Prettier, typed ESLint, and
TypeScript remain required because they enforce broader rules that a bounded
independent scan should not reimplement.
