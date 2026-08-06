# SGAD skills-CLI expected-red evidence

This historical red state was superseded when AC-SGAD-012 adopted the shorter
repository-shorthand command and the skill moved to the standard `skills/`
directory. Current red evidence lives in
`evidence/sgad-short-install-red-state.md`.

- observed_at: 2026-08-06T19:03:00Z
- command: `npm run test:structure`
- result: failed
- summary: 16 tests; 15 passed; 1 failed
- governing_criterion: `AC-SGAD-012`
- governing_requirement_digest: `sha256:6aae468fe77425a861d8535c97221ac2d9ac8f13d49b3cf9e30bac48c85823ef`
- base_revision: `05e2aab`

The revised structural acceptance check failed because the page still rendered
the earlier `$skill-installer` prompt and did not contain the specified
`npx skills add` terminal command. All 15 unrelated checks passed, so the runner
and prior website behavior remained valid. The failure therefore demonstrates
the missing skills-CLI behavior rather than a syntax, configuration, dependency,
or test-environment failure.
