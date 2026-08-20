# Deployment

`hollow deploy prepare` makes a project ready for Fly.io without touching a
Fly account. It creates or validates a managed `Dockerfile`, `.dockerignore`,
and `fly.toml`, then prints the exact Fly commands for the operator to run.
It does not read `FLY_API_TOKEN`, invoke Fly tooling, or make a network request.

## Fly.io

```bash
hollow deploy prepare --target fly:my-api --database sqlite --region iad
```

The command requires a `package.json` start script. It refuses to replace an
unrecognized `Dockerfile`, `.dockerignore`, or `fly.toml`. Repeating the same
preparation is unchanged; use `--force` only after reviewing a change to an
existing Sleepy Hollow-managed artifact.

For embedded SQLite, use `--database sqlite --region <region>`. The prepared
configuration uses one writable `data` volume mounted at `/data` and a database
path at `/data/sleepy-hollow.db`. Run the printed `fly apps create`,
`fly volumes create`, and `fly deploy` commands yourself after authenticating.

For an external SQL database, use `--database postgres`. No volume or database
URL value is written. The printed hand-off includes a `fly secrets set
DATABASE_URL=...` command followed by `fly deploy`; supply the connection URL
directly to Fly rather than placing it in source control.

## Provider portability

Routes, database definitions, and the container boundary are host-neutral.
Sleepy Hollow owns only the local preparation step, leaving provider-specific
scaling, regions, Machines, release configuration, and deployment behavior in
the provider's own files and commands.
