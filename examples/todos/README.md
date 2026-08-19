# todos

A worked Sleepy Hollow application: a todo list with two approved endpoints,
`/todos` and `/todos/[id]`, covering creation, bounded listing, reading,
updating, and deletion over embedded SQLite.

Authentication is recorded as an explicit `none`, so this example demonstrates
routing, validation, data access, and verification. For a route that requires an
authenticated caller, see the `authentication` example.

## Where the rules live

`requirements/application.req.md` records the application-wide decisions, and
each endpoint directory owns a named `*.req.md` file with criteria and an
approval bound to the exact content approved.

## Verify

```bash
npm run verify
```
