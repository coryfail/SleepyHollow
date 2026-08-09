# CLI reference

```
hollow <command> [options]

  create    Create one deterministic Sleepy Hollow project.
  dev       Run the project locally in development mode.
  test      Run full or safely targeted project tests.
  check     Independently verify project evidence.
  generate  Generate or check owned API contracts.
  deploy    Preview and deliver one verified Deno Deploy revision.
```

Every command accepts `--json` for machine-readable output on one line. Use
`hollow help <command>` for command-specific usage.

## hollow create

```bash
hollow create my-api [--json]
```

Creates a project that is valid before any endpoint exists. Refuses to overwrite
existing files and refuses unsafe names or destinations.

## hollow dev

```bash
hollow dev [--port <1-65535>] [--json]
```

Runs the project locally in development mode, restarting on file changes. Each
change activates one fresh generation; an invalid change keeps the previous
generation serving rather than dropping you to nothing.

## hollow test

```bash
hollow test [--full | --requirement <id> | --route <METHOD> <path>] [--json]
```

Runs tests in test mode with isolated KV state and records the evidence
`hollow check` consumes.

Targeting is fail-closed. If a targeted scope cannot be proven complete, the
full relevant suite runs instead and says so. A target that matches nothing
fails rather than silently passing.

A project with no governed tests yet — a fresh scaffold — passes and reports
that nothing governed exists, rather than failing.

## hollow check

```bash
hollow check [--full | --requirement <id> | --route <METHOD> <path>] [--json]
```

Verifies the project against recorded evidence. Exits non-zero on any error
diagnostic. Requires a current capture artifact — see
[Verification](verification.md).

## hollow generate

```bash
hollow generate [--check] [--json]
```

Generates OpenAPI and the typed client from your routes. `--check` verifies the
artifacts are current without writing, which is what you want in CI.

## hollow deploy

```bash
hollow deploy [--preview] [--confirm <digest>] [--json]
```

Requires `DENO_DEPLOY_TOKEN` in the environment. Refuses to upload when
verification fails.

The first external deployment and materially risky changes require confirmation
bound to the exact plan:

```bash
$ hollow deploy
Awaiting confirmation: deno-deploy:my-api Confirm with --confirm 2c5abbe9
  error: SH_DEPLOY_CONFIRMATION_REQUIRED

$ hollow deploy --confirm 2c5abbe9
```

The digest identifies **that specific plan**. A wrong or stale digest is
refused, so you cannot accidentally confirm a plan you did not review. Use
`--preview` to see the plan without any prospect of applying it.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Succeeded |
| `1` | Failed with reported diagnostics |
| `2` | Invalid invocation |

## Diagnostics

Every diagnostic carries a stable code, a summary, and a correction:

```
ERROR SH_CHECK_ROUTE_UNOBSERVED: POST /bookmarks carries approved acceptance
  criteria but runtime capture never observed it
  correction: Exercise the route from a mapped test, or record a justification
  for the exception.
```

Codes are stable across releases and safe to match on in scripts.

## Related

- [Getting started](getting-started.md)
- [Verification](verification.md)
- [Deployment](deployment.md)
