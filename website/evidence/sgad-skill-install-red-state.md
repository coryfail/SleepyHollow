# SGAD skill-install expected-red evidence

This historical red state was superseded when AC-SGAD-012 changed from a Codex
`$skill-installer` prompt to the `npx skills add` terminal contract. Current red
evidence lives in `evidence/sgad-skills-cli-red-state.md`.

- observed_at: 2026-08-06T18:53:00Z
- command: `npm run test:structure`
- result: failed
- summary: 16 tests; 15 passed; 1 failed
- governing_criterion: `AC-SGAD-012`
- governing_requirement_digest: `sha256:4c03c10f1c6fb099ae4d4b41bc86e30e1ce7a28ef2d34cee7b125c94aceef1bb`
- base_revision: `05e2aab`

The focused structural acceptance check failed because the SGAD page did not
contain a `$skill-installer` invocation or a target for the repository's
`skill/sgad-workflow` directory. All 15 unrelated checks passed, so the runner
and prior website behavior remained valid. The failure therefore demonstrates
the missing specified install affordance rather than a syntax, configuration,
dependency, or test-environment failure.
