---
schema: sgad-red-state/v0.1
result: failed
requirement_ids:
  - AC-SITE-010
observed_at: 2026-08-06T18:00:00Z
---

# GitHub Pages concurrency expected-red evidence

## Production observation

The first `main` deployment run was canceled before executing any steps. GitHub
reported that a higher-priority request for `pages-refs/heads/main` was waiting.
A pull-request verification run targeting `main` shared that concurrency group,
so non-production verification could cancel the production deployment.

## Focused expected-red check

`npm run test:structure` executed 16 structural acceptance tests. Fifteen passed
and AC-SITE-010 failed because the workflow concurrency key did not include the
GitHub event name.

## Required transition

The Pages workflow must isolate `push`, `pull_request`, and manual runs while
retaining per-ref cancellation inside each event type.
