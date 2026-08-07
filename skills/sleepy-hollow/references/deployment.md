# Deployment

Deploy only from a verified revision. `hollow deploy` owns the deterministic
build, validation, upload, and smoke-test steps; this skill guides and
interprets them but never bypasses them.

## Before deploying

Full verification must pass. A failed required check blocks upload and reports
the blocking evidence rather than deploying anyway.

## The plan

Present a deployment plan before any external mutation:

- Target and application revision
- Environment key changes, named without their values
- Contract changes since the deployed revision
- Checks already run and smoke tests planned

## Confirmation

The first external deployment and any materially risky production change require
explicit confirmation after the plan is presented. Record who confirmed and
where the decision was made. Never infer confirmation from an earlier approval
of unrelated work: approving an endpoint is not approving a deploy.

## Credentials

Deployment credentials come from the environment and must not appear in logs,
generated artifacts, diagnostics, or command output. Never echo a token to
confirm it is set.

## After uploading

A deployment is not successful until required smoke tests pass. Run a live
health check and at least one representative API operation.

A failed smoke test returns a failed deployment result carrying the live
revision and actionable evidence. Do not report a false success because the
upload itself succeeded.

## Results

A successful result reports the live URL, deployed revision, OpenAPI location,
documentation location, smoke-test evidence, and completion time. Redeploying an
unchanged verified revision produces a predictable no-change result.
