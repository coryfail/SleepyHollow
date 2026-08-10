# Sleepy Hollow

A headless API framework for Deno where the framework proves what was built.

Sleepy Hollow is designed for a world where most code is written by agents. It
provides the ordinary things a backend needs — file-based routing, schema
validation, typed Deno KV access, security defaults, OpenAPI and client
generation, deployment — and one thing that is not ordinary: it records what
your handlers actually do while their tests run, and refuses to certify behavior
no test exercised.

> **Status:** in development, and published to JSR as
> [`@sleepy-hollow/framework`](https://jsr.io/@sleepy-hollow/framework). The
> install instructions below resolve against the published package. The API is
> pre-1.0 and may change.

## Why it exists

An agent writing Hono produces plausible code, plausible tests, and a green
checkmark. Nothing checks that the test touched the handler, that the query is
bounded, or that the route the requirement describes is the route that shipped.

Sleepy Hollow closes that gap:

- **Requirements are governed.** Approval is bound to the exact bytes of a
  requirement by digest. Editing the requirement invalidates the approval.
- **Criteria map to tests.** Every approved acceptance criterion maps to at
  least one test, in both directions.
- **Behavior is observed, not claimed.** While tests run, the framework records
  which request locations each handler read, which statuses it returned, and
  which data operations it performed with what index and bound.
- **Verification fails closed.** A route carrying approved criteria that no test
  ever exercised fails `hollow check`. So does a stale or missing evidence
  artifact.

The trust boundary: **the agent plans and implements; the framework
independently verifies and runs the result.**

## Quick start

```bash
hollow create my-api
cd my-api
deno task test      # runs your tests and records what they exercised
hollow check        # independently verifies the recorded evidence
```

A new project starts clean:

```
Test run passed.
Independent verification passed.
```

Then install the [Sleepy Hollow skill](skills/sleepy-hollow/SKILL.md) into your
agent environment and describe what you want:

```bash
npx skills add coryfail/SleepyHollow --skill sleepy-hollow
```

Or write endpoints yourself. The framework verifies independently of the skill,
and [Writing requirements](docs/framework/writing-requirements.md) covers the
part the skill would otherwise do for you.

## An endpoint

Routes are files. The directory is the path.

```ts
// api/bookmarks/[id]/route.ts
import { defineRoute } from "@sleepy-hollow/framework/routing";
import { z } from "@sleepy-hollow/framework/validation";

const bookmark = z.object({ id: z.string(), url: z.string() }).strict();

export default defineRoute({
  GET: {
    schemas: {
      params: z.object({ id: z.string() }).strict(),
      responses: { 200: bookmark },
    },
    security: { authentication: "none" },
    contract: { summary: "Return one bookmark" },
    handler: ({ params }) =>
      Response.json({ id: params.id, url: "https://example.com" }),
  },
});
```

Every schema is a Zod schema and every object schema is `.strict()`. The runtime
rejects anything else at startup rather than at the first bad request.

Every route declares its schemas and its authentication explicitly. There is no
implicit default, because a forgotten default is how endpoints ship unprotected.

## Documentation

| Guide                                                | What it covers                                 |
| ---------------------------------------------------- | ---------------------------------------------- |
| [Getting started](docs/framework/getting-started.md) | Install, create, first endpoint, verify        |
| [Writing requirements](docs/framework/writing-requirements.md) | Authoring and approving what `hollow check` verifies |
| [Routing](docs/framework/routing.md)                 | File-based routes, methods, parameters         |
| [Data](docs/framework/data.md)                       | Deno KV resources, indexes, bounded queries    |
| [Security](docs/framework/security.md)               | Route modes, the project security module       |
| [Verification](docs/framework/verification.md)       | Capture, `hollow check`, what "verified" means |
| [Deployment](docs/framework/deployment.md)           | `hollow deploy`, your own credentials          |
| [CLI reference](docs/framework/cli.md)               | Every command and flag                         |

## SGAD methodology

Sleepy Hollow is the reference implementation of
[Specification-Governed Agentic Development](docs/sgad/README.md): a
framework-independent methodology in which specifications authorize work, agents
implement approved behavior, and independently checkable evidence governs
completion.

You can apply SGAD outside this framework with the standalone
[SGAD workflow skill](skills/sgad-workflow/SKILL.md), which contains no Sleepy
Hollow runtime or CLI dependency.

## Install

Sleepy Hollow targets Deno. It uses Deno KV, Deno runtime APIs, and Deno Deploy.
It does not support Node or Bun.

Add the framework to a project:

```bash
deno add jsr:@sleepy-hollow/framework
```

The CLI ships in the same package. Install it as `hollow`, which is how the
documentation refers to it:

```bash
deno install -A --global --name hollow jsr:@sleepy-hollow/framework/cli
```

Or run it without installing anything:

```bash
deno run -A jsr:@sleepy-hollow/framework/cli create my-api
```

JSR declares no binary entry, so there is no `npx` equivalent. The CLI is
reached through Deno or not at all.

## Deploying

`hollow deploy` uses your own Deno Deploy account. Set an access token for the
target account before deploying:

```bash
export DENO_DEPLOY_TOKEN=your-token
```

Sleepy Hollow holds no credentials of its own. The token is read at deployment
time, sent only to the Deno Deploy API, and never written to logs, generated
artifacts, or command output.

## Contributing

Development follows a feature-branch workflow with `main` reserved for
production releases. See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming,
release, and hotfix procedures.

Sleepy Hollow develops itself using the process it provides. The application
specification lives at
[requirements/application.md](requirements/application.md), and component
requirements are colocated with their tests and implementation under
[`cli/`](cli/), [`core/`](core/), and [`skills/`](skills/). Repository-wide
behavior is governed by the root [requirements.md](requirements.md).

## License

See [LICENSE](LICENSE).
