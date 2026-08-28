# Unsupported media type

The route declares a JSON request body, but the request's media type is not
JSON. Sleepy Hollow rejects it before parsing or invoking the handler.

## When it appears

This response is returned when `Content-Type` is missing or is not
`application/json` or an `application/*+json` media type.

## Response shape

The response uses HTTP `415` and `application/problem+json`. The body does not
include the submitted payload.

## What to do

Set `Content-Type: application/json` (or a supported `application/*+json` type)
and send valid JSON that matches the route's body schema.

See the [routing guide](/docs/routing/) for body declarations.
