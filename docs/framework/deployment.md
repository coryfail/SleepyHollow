# Deployment

`hollow deploy` delivers a verified revision to your own Deno Deploy account.

## Your credentials, not ours

Sleepy Hollow is a community framework. It holds no credentials of its own and
never requires any to be present in the framework repository. You bring a token
for your account:

```bash
export DENO_DEPLOY_TOKEN=your-token
hollow deploy
```

Without it, deployment fails before any network request is attempted:

```
No Deno Deploy access token is available. Set DENO_DEPLOY_TOKEN to a token
for the target account before deploying.
```

The token is read at deployment time, sent only as an authorization header to
the Deno Deploy API origin, and never written to logs, generated artifacts,
diagnostics, or command output.

## Verification comes first

`hollow deploy` refuses to upload when required verification fails, and reports
the blocking evidence:

```
Blocked before upload: deno-deploy:my-api
  error: SH_DEPLOY_VERIFICATION_FAILED
      SH_CHECK_ROUTE_UNOBSERVED: POST /bookmarks was never observed
      correction: Resolve every reported diagnostic and rerun hollow check.
```

There is no force flag. Deploying unverified code is not a supported workflow.

## The plan

Before any external mutation you get a plan:

- Target and application revision
- Environment key changes, **named without their values**
- Contract changes since the deployed revision
- Smoke tests that will run after upload

The first external deployment and any materially risky change pause for
confirmation after the plan is shown:

```bash
hollow deploy --confirm
```

Confirmation is recorded with its source. It is never inferred from an earlier
approval of unrelated work — approving an endpoint is not approving a deploy.

## After upload

A deployment is not successful until its required smoke tests pass. A live
health check runs, then each configured representative operation.

If a required smoke test fails, you get a **failed** result that still reports
the live revision and actionable evidence:

```
Deployed with failed smoke tests: deno-deploy:my-api
  live revision  abc123
  smoke          SMOKE-BOOKMARKS failed  GET /bookmarks returned 500
```

The upload succeeded and the code is live. That is precisely why it is reported
as a failure rather than a success — you need to know the live revision is bad.

## Idempotence

Redeploying an unchanged verified revision produces a predictable no-change
result rather than a redundant upload.

## What is proven, and what is not

The framework verifies token sourcing, request construction, credential
containment, and failure interpretation — all without an account or a network.

It does **not** verify that Deno Deploy accepts a request. That is established
by your first real deployment, which is why the confirmation gate exists. If the
live contract differs from what the adapter constructs, that is a defect in the
adapter, not in your project — please report it.

## Related

- [Verification](verification.md)
- [CLI reference](cli.md)
