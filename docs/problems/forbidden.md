# Forbidden

The request has an authenticated principal, but the route's authorization
guard denied access.

## When it appears

This response is returned when an authorization guard resolves to `false`.
Guard exceptions are internal failures rather than denials.

## Response shape

The response uses HTTP `403` and `application/problem+json` with
`Cache-Control: no-store`. It does not reveal policy internals or protected
resource details.

## What to do

Check that the authenticated principal has the permission required by the
route's approved authorization rule. Do not retry with credentials that do not
grant the required access.

See the [security guide](/docs/security/) for authorization declarations.
