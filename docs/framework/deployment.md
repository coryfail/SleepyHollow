# Deployment

`hollow deploy` uses provider adapters. Fly.io is the first supported adapter,
with an OCI Docker image and `flyctl` deployment command.

## Fly.io

```bash
export FLY_API_TOKEN=your-app-scoped-token
hollow deploy --target fly:my-api
```

The adapter passes the token only to `flyctl`'s child environment. A verified
revision runs health and declared smoke checks after upload. For embedded
SQLite, mount a Fly volume and configure a durable database file path such as
`/data/application.sqlite`.

## Provider portability

Routes, database definitions, and the container boundary are host-neutral;
additional providers can be registered without changing application code.
