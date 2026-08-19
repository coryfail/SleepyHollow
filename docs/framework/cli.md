# CLI reference

Install the CLI from npm:

```bash
npm install -g @sleepy-hollow/framework
```

## Commands

Commands:

```text
hollow create <name>
hollow check [--json]
hollow test [--full | --requirement <id> | --route <METHOD> <path>] [--json]
hollow dev [--port <port>]
hollow deploy --target fly:<app> [--confirm <digest>]
```

`hollow test` runs the Node/Bun test workflow and records evidence.
`hollow deploy` requires `FLY_API_TOKEN` and stops before upload when
verification fails or a first external deployment lacks confirmation.
