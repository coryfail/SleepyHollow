# SGAD short-install expected-red evidence

- observed_at: 2026-08-06T19:07:00Z
- commands: `npm run test:structure`; `npm run test:links`
- result: failed
- structural_summary: 16 tests; 15 passed; 1 failed
- link_summary: 1 test; 0 passed; 1 failed
- governing_criteria: `AC-SGAD-012`, `AC-F017-013`
- website_requirement_digest: `sha256:8be911e04a7a28ae24eb182f5a06fd1cc132a97c4ab559a0dc2271ee56c54d45`
- skill_requirement_digest: `sha256:eac9fee1879783dbbb26dc4ff6c3fe27acdbf6039fc9c0f193467bcf398f1a0e`
- base_revision: `05e2aab`

The structural check failed because the SGAD page still rendered the nested
GitHub URL instead of `npx skills add coryfail/SleepyHollow --skill
sgad-workflow`. The link-target check failed because the canonical
`skills/sgad-workflow/SKILL.md` package did not yet exist. All 15 unrelated
structural checks passed. These failures therefore demonstrate the missing short
command and standard discovery layout rather than a broken runner or unrelated
website regression.
