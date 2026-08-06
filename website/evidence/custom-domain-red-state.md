# Custom-domain expected-red evidence

- observed_at: 2026-08-06T17:21:00Z
- command: `npm run test:structure`
- result: failed
- summary: 16 tests; 14 passed; 2 failed
- governing_input: `AC-SITE-003`

The focused structural checks failed because the production build still used
the repository-specific `/SleepyHollow/` base and did not include a `CNAME`
artifact for `sleepyhollow.io`. The runner executed normally and all unrelated
checks passed, so the failures demonstrate the two missing custom-domain
delivery behaviors rather than an environment failure.

The pre-release DNS audit also found no apex, `www`, or GitHub domain-verification
records. DNS activation therefore remains an external publication dependency
after the repository release is deployed.
