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
hollow deploy prepare --target fly:<app> --database <sqlite|postgres> [--region <region>] [--force] [--json]
```

`hollow test` runs the Node/Bun test workflow and records evidence.
`hollow deploy prepare` writes or validates local Fly artifacts only. SQLite
requires `--region` for its Fly volume; PostgreSQL names `DATABASE_URL` as an
operator-provided Fly secret. The command prints the subsequent Fly commands
but never executes them or reads a credential.
