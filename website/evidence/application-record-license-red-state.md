# Application-record and license expected-red evidence

- observed_at: 2026-08-06T17:02:00Z
- command: `npm run test:structure`
- result: failed
- summary: 15 tests; 13 passed; 2 failed
- governing_inputs:
  - repository `LICENSE`
  - `AC-SGAD-007`

The focused checks failed because the public footer still named the MIT license
instead of Mozilla Public License Version 2.0, and the reference still showed
only the three-file `feature/` excerpt instead of the complete application
example. The runner executed normally and every unrelated check passed, so the
failures demonstrate the expected missing corrections.
