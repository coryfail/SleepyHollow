# Deployment

## Verification gate

For framework 0.3.5, use this exact order on the revision being prepared for
deployment:

```bash
npm run verify
npx hollow test
npx hollow check
```

Do not run `hollow check` before `hollow test`. The test command discovers
governed `criterionTest(...)` registrations and persists the manifest and
results; capture-aware tests must write the capture evidence that the check
command consumes. Deploy only when the check passes. A direct Vitest pass alone
is not a verification result.

`hollow deploy prepare` owns only deterministic local Fly preparation. It
creates or validates marked `Dockerfile`, `.dockerignore`, and `fly.toml`
artifacts, then prints commands for the operator to run with Fly tooling. This
skill must never claim that Sleepy Hollow uploads, deploys, authenticates, or
checks a live Fly application.

## Before preparation

Confirm the project has a supported Node or Bun `package.json` with a non-empty
`start` script. Select the database profile deliberately: SQLite requires a
region and a single writable Fly volume; PostgreSQL requires an externally
managed `DATABASE_URL` secret.

## Prepare local artifacts

Run one of:

```bash
hollow deploy prepare --target fly:<app> --database sqlite --region <region>
hollow deploy prepare --target fly:<app> --database postgres
```

The command must not inspect credentials, start a process, contact a provider,
or create a remote resource. Do not use `--force` to overwrite a user-owned
deployment file; it may replace only a file carrying the Sleepy Hollow marker.

## Operator hand-off

Review the generated files and run the printed Fly commands yourself. For
SQLite, create the app and `data` volume in the selected region before deploying.
For PostgreSQL, set `DATABASE_URL` directly with Fly tooling without putting its
value in generated files or logs.

Keep Fly-specific scaling, Machines, release commands, regions, and deployment
strategy in `fly.toml` and Fly's own commands. This keeps the framework from
becoming a narrow wrapper around one hosting provider.

## After deployment

Use Fly's status, logs, and health-check tools to inspect the live service. The
operator—not `hollow deploy prepare`—owns validation of a remote deployment.
