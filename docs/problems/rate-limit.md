# Rate limit

The route's configured rate-limit policy rejected this request. The request did
not reach the handler.

## When it appears

This response is returned when the policy limiter says the caller's key has
exhausted its configured allowance for the current window.

## Response shape

The response uses HTTP `429` and `application/problem+json`. It includes
`Cache-Control: no-store` and a positive integer `Retry-After` value indicating
when a retry may be attempted.

## What to do

Wait for the indicated retry interval, then retry within the route's published
quota. If the limit is unexpected, review the policy and its key derivation in
the project security module.

See the [security guide](/docs/security/) for rate-limit configuration.
