# Two-page expected-red evidence

- observed_at: 2026-08-06T16:29:00Z
- command: `node --test tests/two-page-acceptance.test.mjs`
- result: failed
- summary: 14 tests; 3 passed; 11 failed
- requirement_digests:
  - `sleepy-hollow-website`: `sha256:f593521a8a280a5866e37de67c498545779c46762057443322a7bfb3c14aa80d`
  - `website-sleepy-hollow-page`: `sha256:20af56fff2d4b0786637895b333a94a75d38c98efd8b11c1d44ebb0ebbaa343e`
  - `website-sgad-page`: `sha256:953d9a6f2e3b10e19cda2cb350df58620bdaf0760039b000bc1c08785a9c9bef`

## Expected missing behavior

The checks failed because the approved second static entry, shared two-page
navigation, route-specific page components, SGAD browser coverage, and revised
traceability did not yet exist. The runner itself executed correctly, three
unchanged constraints still passed, and the failures therefore demonstrate the
expected missing behavior rather than a syntax, dependency, configuration, or
test-environment failure.

The first failure was `missing sgad/index.html`; the remaining failures named
the absent route-specific source, navigation state, browser coverage, and
evidence mapping. This evidence was captured before implementation began.
