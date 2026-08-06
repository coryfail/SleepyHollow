# Feature-record expected-red evidence

- observed_at: 2026-08-06T16:52:00Z
- command: `npm run test:structure`
- result: failed
- summary: 14 tests; 13 passed; 1 failed
- governing_criterion: `AC-SGAD-007`

The revised acceptance check failed because the SGAD page still rendered the
older `my-application/` tree and did not yet contain the requested three-file
`feature/` record or its separate delivery-evidence explanation. The test runner
executed correctly and all unrelated criteria passed, so this is the expected
missing behavior rather than an environment or configuration failure.
