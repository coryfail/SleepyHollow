# Security

Sleepy Hollow ships no identity model. It gives you one place to declare who can
authenticate requests, and it refuses to serve a route whose declaration it
cannot honor.

## Every route declares a mode

There is no implicit default, because a forgotten default is how endpoints ship
unprotected:

```ts
export default defineRoute({
  GET: {
    schemas: { responses: { 200: bookmark } },
    security: { authentication: { mode: "none" } },
    contract: { summary: "Return one public bookmark" },
    handler: ({ principal }) => Response.json({ principal }), // null
  },
});
```

```ts
export default defineRoute({
  GET: {
    schemas: { responses: { 200: bookmark, 401: problem } },
    security: {
      authentication: {
        mode: "required",
        provider: "project-auth",
        requirementId: "AC-APP-014",
      },
    },
    contract: { summary: "Return one private bookmark" },
    handler: ({ principal }) => Response.json({ owner: principal!.id }),
  },
});
```

`none` never invokes a provider and gives the handler a `null` principal.
`required` resolves the named provider and hands its principal to the handler.
`requirementId` names the approved criterion that made the route protected, so
verification can check the route against the requirement that demanded it.

A required route must also declare a `401` response schema. Normalization fails
at startup if it does not.

The `!` above is not incidental. `principal` is still typed as possibly `null`
even on a required route, so you need an assertion the runtime does not require.
That narrowing defect is recorded in [Routing](routing.md); the type does not
yet deliver what the runtime guarantees.

## The project security module

Providers, rate-limit policies, and CORS live in one module that default-exports
the result of `defineSecurity`:

```ts
// security.ts
import { defineSecurity } from "@sleepy-hollow/framework/security";

export default defineSecurity({
  providers: {
    "project-auth": {
      challenge: 'Bearer realm="project"',
      authenticate: async (request) => {
        const token = request.headers.get("authorization");
        const user = token ? await lookUpSession(token) : null;
        return user ? { id: user.id, type: "project-user" } : null;
      },
    },
  },
});
```

Return `null` for "no valid identity". Do not throw to signal a failed login —
an exception becomes a safe internal failure, not a `401`.

Name the module in your project configuration:

```ts
// sleepyhollow.config.ts
export default defineProject({
  name: "bookmarks",
  apiDirectory: "api",
  requirementsFile: "requirements/application.md",
  generatedDirectory: "generated",
  securityModule: "security.ts",
});
```

Nothing is discovered by scanning. Routes come from the filesystem because the
filesystem _is_ the routing table; security wiring has no such excuse. Whether
your API is protected must not depend on a file quietly appearing or
disappearing.

`defineSecurity` freezes what it returns, so provider wiring cannot be mutated
after composition.

## What fails, and when

Composition happens once, at startup. These are startup failures, not request
failures:

| Situation                                      | Result                               |
| ---------------------------------------------- | ------------------------------------ |
| No `securityModule` declared                   | Composes with no providers           |
| Named module cannot be resolved                | Fails, naming the declared path      |
| Module's default export is malformed           | Fails, naming the declared path      |
| Route requires a provider that is not declared | Fails, naming the route and provider |

A project that declares no security module is valid as long as every route
declares `authentication: { mode: "none" }`. The moment one route requires
authentication, a resolvable provider becomes mandatory — a required route with
no provider cannot authenticate anyone, and finding that out on the first
request is finding out too late.

`hollow dev` composes exactly this. A protected route answers an unauthenticated
local request with `401` and the provider's challenge, the same as anywhere
else. The test application composes it too, so a criterion test cannot pass
against a route that would reject the identical request when served.

## What the framework does not do

- No built-in email/password, sessions, JWT, OIDC, or API-key product.
- No credential store or cryptographic protocol.
- No CSRF mechanism for a cookie or session design you choose.
- No denial-of-service guarantee. Rate limiting is an application quota control.

Those remain your application's requirements, specified and tested with your own
authentication design.
