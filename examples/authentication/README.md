# authentication

The smallest Sleepy Hollow application with a route that requires an
authenticated caller. `GET /hello` returns a greeting naming the caller, and
refuses anyone who cannot present the credential.

The `todos` example records authentication as an explicit `none`. This one
exists to show the other half: how a project declares a provider, and what a
protected route does with an anonymous request.

## What to look at

| File                      | Why it matters                                   |
| ------------------------- | ------------------------------------------------ |
| `security.ts`             | One provider, produced by `defineSecurity`       |
| `sleepyhollow.config.ts`  | Names that module through `securityModule`       |
| `api/hello/route.ts`      | Declares `mode: "required"` and a `401` contract |
| `api/hello/hello_test.ts` | Tests through composed security, not the handler |

Nothing is discovered by scanning. The project names its security module, and a
module that cannot be resolved fails startup rather than serving routes
unprotected.

## The provider is not a credential system

`security.ts` compares a bearer token against a constant in source. It has no
store, no expiry, no revocation, and no protection against a stolen token. Copy
its _shape_ — receive a request, return a principal or `null` — and replace its
body. The `401`, the challenge header, the problem body, and the guarantee that
the handler never runs are all the framework's job, not yours.

## Run it

```bash
deno task verify
```

Serve it and try the route:

```bash
hollow dev
```

```bash
curl -i http://127.0.0.1:8000/hello
```

That returns `401` with a `WWW-Authenticate` challenge. With the credential:

```bash
curl -i -H 'authorization: Bearer sleepy-hollow-demo-token' http://127.0.0.1:8000/hello
```

## Where the rules live

`requirements/application.req.md` records the application-wide decision to
require authentication. `api/hello/hello.req.md` owns the route's criteria, and
each carries its own approval bound to the exact content approved.
