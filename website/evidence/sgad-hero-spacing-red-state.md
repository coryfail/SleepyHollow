# SGAD hero spacing expected-red evidence

- observed_at: 2026-08-06
- command: `npx playwright test --config playwright.config.ts --grep "excessive empty band"`
- result: failed
- summary: 1 focused test; 0 passed; 1 failed
- governing_input: `AC-SGAD-001`
- viewport: 889 × 936 CSS px

The focused browser check measured 263.7 CSS px between the bottom of the
shared navigation and the SGAD introduction, exceeding the approved 180 CSS px
ceiling. The page, browser runner, navigation, and introduction all rendered
normally, so the failure demonstrates the excessive empty band reported during
human visual review rather than an environment or selector failure.
