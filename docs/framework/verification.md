# Verification

> **Keep governed requirements out of automated prose formatting.** An approval
> binds exact bytes, and a formatter can rewrap prose and detach that approval.
> The scaffold keeps requirements separate from source formatting for this
> reason.

This is the part of Sleepy Hollow that does not exist in other frameworks. It is
worth understanding before anything else.

## The problem it solves

An agent writes a handler, writes a test, and the test passes. That tells you
almost nothing:

- The test may never have called the handler.
- The query it runs may be unbounded.
- The route that shipped may not be the route the requirement described.
- The "verified" label may be a line of prose someone typed.

Passing tests are evidence that assertions held. They are not evidence that the
approved behavior was exercised.

## What Sleepy Hollow does instead

While your tests run, the framework wraps your repositories and route handlers
and records what actually happened:

- Which of `params`, `query`, `headers`, `body` each handler **read**
- Which response statuses it **returned**
- Which data operations it **performed** — resource, kind, index, limit,
  versionstamp check, atomicity

Records are attributed to the criterion test that produced them and written to
`generated/capture.json`. Wrapping is transparent: a wrapped repository returns
the same values, versionstamps, and errors as the one it wraps, and a wrapped
route returns the handler's response unchanged. Capture that alters behavior is
a defect, not a trade-off.

`hollow check` then compares that observed evidence against what your
requirements approved and your routes declared.

## What fails, and why

| Failure                       | Meaning                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `SH_CHECK_ROUTE_UNOBSERVED`   | A route with approved criteria that no test reached. The criterion mapping claims coverage that does not exist. |
| `SH_CHECK_CAPTURE_UNUSABLE`   | The evidence artifact is missing, stale, or unreadable. Verification with no evidence is not verification.      |
| `SH_CHECK_QUERY_UNBOUNDED`    | A query ran without a positive bounded limit.                                                                   |
| `SH_CHECK_INDEX_INCOMPATIBLE` | A query used an index the resource does not declare.                                                            |

The first one is the important one. A test that passes without touching its
handler is the most common way agent-written tests are worthless, and it is
exactly what this catches.

## Uncaptured is not a warning

A route no test exercised is reported as **uncaptured** and fails verification.
It is never reported as "observed with no operations," because absence of
observation must never read as evidence of correctness.

If a criterion is legitimately verified below the transport layer — a schema
rule proven by a unit test, say — that does not fail on its own. Only a route
with approved criteria and no observation at all fails.

## The escape hatch, and its price

An uncaptured route can be accepted with a **recorded justification**:

```
SH_CHECK_ROUTE_UNOBSERVED_ACCEPTED
  GET /legacy was never observed and is accepted by a recorded justification:
  covered by a contract test outside the transport layer
```

The justification appears in the verification result. The exception is visible
and auditable rather than silent. That is the entire point — you can make an
exception, but you cannot make one quietly.

## What verification does not prove

Being precise about the boundary:

- It proves **what your tests exercised**. Untested paths carry no evidence and
  are reported as such. Verification confidence is a function of your test
  coverage, and the artifact makes the untested remainder explicit.
- It does **not** prove your requirements describe the right product. Governance
  binds implementation to approved intent; it cannot tell you the intent was
  good.
- It does **not** prove a remote platform accepts your deployment. See
  [Deployment](deployment.md).

## Governed requirements

Approval is bound to the exact bytes of a requirement by SHA-256 digest,
computed over everything before the `## Governance record` heading with the
frontmatter `status:` line omitted.

That last detail matters: `status` is a **lifecycle projection**, not evidence.
Changing `draft` to `verified` changes no digest and grants no authority.
Changing any other governed byte invalidates the approval immediately.

So a requirement cannot be quietly edited after approval, and a status field
cannot be quietly promoted to claim verification that no evidence supports.

## Related

- [Getting started](getting-started.md)
- [Deployment](deployment.md)
- [SGAD methodology](../sgad/README.md)
