# Internal server error

The server could not produce a response that satisfies the route contract.
Sleepy Hollow converts handler exceptions and invalid declared responses into a
safe internal failure.

## When it appears

This response is returned when a handler throws, returns an undeclared status,
returns malformed JSON, returns an unexpected body, or returns a body that does
not match its declared response schema.

## Response shape

The response uses HTTP `500` and `application/problem+json`:

```json
{
  "type": "https://sleepyhollow.io/problems/internal-server-error",
  "title": "Internal Server Error",
  "status": 500,
  "instance": "/requested/path"
}
```

The response intentionally omits stack traces, secrets, rejected values, and
implementation-only messages. The matching internal diagnostic is available to
the configured diagnostic sink.

## What to do

Inspect the server-side diagnostic, then make the handler's behavior match the
approved route requirement and declared response schema. Do not copy exception
details into the client response.

See the [verification guide](/docs/verification/) for contract checks.
