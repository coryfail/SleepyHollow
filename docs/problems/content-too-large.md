# Content too large

The request body exceeded the route's declared byte limit. Sleepy Hollow stops
reading the stream once the limit is crossed and does not invoke the handler.

## When it appears

This response occurs when `Content-Length` is above the configured `maxBytes`,
or when streamed bytes exceed that limit.

## Response shape

The response uses HTTP `413` and `application/problem+json` with the stable
problem type for this page. It contains no request content or implementation
details.

## What to do

Reduce the payload to the route's supported size, or deliberately raise the
route's positive integer `maxBytes` when the larger contract is approved and
tested.

See the [routing guide](/docs/routing/) for route declarations.
