# Request validation

The request did not match the route's declared input schemas. Sleepy Hollow
returns this problem before the handler runs, so invalid input cannot trigger
handler side effects.

## When it appears

This response covers malformed or empty JSON bodies, invalid path parameters,
query values, headers, or body fields, and undeclared application fields.

## Response shape

The response uses HTTP `400` and `application/problem+json`. When a declared
schema identifies a field, the `errors` member includes its location, path,
stable issue code, and a safe message. Rejected values are never echoed.

## What to do

Compare the request with the route's `schemas` declaration. Send a non-empty
JSON body when one is required, use the declared field names, and correct the
reported location before retrying.

See the [routing guide](/docs/routing/) for request schemas and the
[verification guide](/docs/verification/) for testing the boundary.
