# Sleepy Hollow

A headless API framework for Node.js and Bun where the framework proves what
was built.

Sleepy Hollow is built for agent-assisted backend work. It supplies file-based
routing, strict Zod validation, explicit security composition, relational data
access, OpenAPI/client generation, and independently checkable evidence of
what tests exercised.

> **Status:** in development and pre-1.0. The framework is packaged for npm as
> `@sleepy-hollow/framework` and targets Node.js 24+ and Bun.

## Why it exists

Sleepy Hollow binds approved requirements to the code and evidence that verify
them:

- Approval is bound to the exact bytes of a requirement by digest.
- Every approved acceptance criterion maps to at least one test.
- Test execution records request, response, and declared data-operation
  evidence.
- `hollow check` fails closed when approved behavior was not exercised.

## Quick start

```bash
npm install -g @sleepy-hollow/framework
hollow create my-api
cd my-api
npm install
npm run test
hollow check
```

Use `bun add @sleepy-hollow/framework` and `bunx hollow` if Bun is your chosen
runtime. Node and Bun share the same public framework API.

For agent-assisted planning and verification, install the optional official
skill with `npx skills add coryfail/SleepyHollow --skill sleepy-hollow`.

## An endpoint

```ts
import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

export default defineRoute({
  GET: {
    schemas: {
      params: z.object({ id: z.string() }).strict(),
      responses: { 200: z.object({ id: z.string(), url: z.string() }).strict() },
    },
    security: { authentication: "none" },
    contract: { summary: "Return one bookmark" },
    handler: ({ params }) => Response.json({ id: params.id, url: "https://example.com" }),
  },
});
```

## Data and deployment

SQLite is the default embedded database. Mount a durable volume and use an
explicit file path in production; the Todo example demonstrates that profile.
For multi-instance or externally managed storage, configure the optional
PostgreSQL profile through `DATABASE_URL`.

`hollow deploy` is provider-oriented. Fly.io is the first adapter and uses a
Docker image plus `flyctl`; its persistent volume is suitable for SQLite. The
application/server boundary and OCI image are portable, so future adapters can
target other hosts without changing route or database code.

```bash
export FLY_API_TOKEN=your-app-scoped-token
hollow deploy --target fly:my-api
```

## Documentation

- [Getting started](docs/framework/getting-started.md)
- [Data](docs/framework/data.md)
- [Deployment](docs/framework/deployment.md)
- [CLI reference](docs/framework/cli.md)

## Why the runtime changed

Version 0.3.0 moved from a platform-specific runtime and key-value service to
Node/Bun with embedded SQLite and optional PostgreSQL. The change keeps the
framework deployable on more hosts, lets applications ship their default
database with the service, and preserves an explicit path to managed SQL. See
[CHANGELOG.md](CHANGELOG.md) for the rationale.

## License

See [LICENSE](LICENSE).
