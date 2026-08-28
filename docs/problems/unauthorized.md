# Unauthorized

The route requires authentication, but the configured provider did not find a
valid identity for this request.

## When it appears

This response is returned when a required provider returns `null`. A provider
exception is an internal failure instead of a login denial.

## Response shape

The response uses HTTP `401` and `application/problem+json`. It includes the
provider's `WWW-Authenticate` challenge and `Cache-Control: no-store`, without
echoing credentials.

## What to do

Authenticate according to the provider's challenge, then retry with valid
credentials. Keep provider and credential handling inside the project's
security module.

See the [security guide](/docs/security/) for authentication declarations.
