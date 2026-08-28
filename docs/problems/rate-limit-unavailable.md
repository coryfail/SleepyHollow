# Rate limit unavailable

The configured rate-limit policy could not execute safely. Sleepy Hollow fails
closed so a limiter outage does not silently turn a protected route into an
unlimited one.

## When it appears

This response covers an invalid rate-limit key, malformed limiter decision, or
exception from the policy adapter.

## Response shape

The response uses HTTP `503` and `application/problem+json` with
`Cache-Control: no-store`. It does not disclose adapter errors, keys, or
credentials.

## What to do

Retry only according to your service's availability policy. Inspect the
protected `SH_RATE_LIMIT_FAILED` diagnostic and repair the policy adapter
before restoring traffic.

See the [security guide](/docs/security/) for the policy boundary.
