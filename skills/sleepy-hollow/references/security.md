# Security behavior

Secure behavior is a framework default, not a later hardening pass.

## Validation

Every request location the route reads is validated by a schema: `params`,
`query`, `headers`, and `body`. An unvalidated location that the handler reads
fails `hollow check`.

Validation failures return RFC 9457 problem details. Do not invent an error
envelope.

## Responses

Declare a response schema for every status the route can return, including
declared failures. An undeclared status blocks verification and produces an
incomplete OpenAPI contract.

## Authentication and authorization

Each route explicitly declares `authentication: "none"` or
`authentication: "required"`. There is no implicit default, because a forgotten
default is how endpoints ship unprotected.

An authenticated route returns:

- `401` when the credential is missing, malformed, or invalid
- `403` when the caller is authenticated but not permitted

Authorization guards are declared on the route, not buried in handler logic, so
that verification can confirm a guard exists for every route that needs one.

## Principals

The framework supplies a neutral request principal. A project chooses its own
provider: none, project-specific, external identity, API keys, or service
credentials. Do not hard-code one identity model into handlers.

## Secrets

Secrets come from configuration, never from source. Redaction applies to logs,
diagnostics, generated artifacts, and command output. A credential must not
appear in any of them.

## Abuse

Bound every request body and every collection query. Rate limiting uses the
framework's process-local limiter for tests and development, and a shared-scope
adapter for protected production routes. A process-local limiter in production
is a configuration error and fails verification.
