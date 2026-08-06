---
schema: sgad-red-evidence/v0.1
result: failed
requirement_id: website-landing-page
requirement_digest: sha256:299742bd6eca92fd51118a13649094ede3224031f2a42081c16df5cf15fdf29f
test_digest: sha256:10b0e38e04a501685af69a94ef36af3bb0b687d5f38053dd153bdf87e7ab0c95
baseline_revision: git:fc6316cc9fe829450e3ac79c1582b6c959016fdf
recorded_at: 2026-08-06T14:57:58Z
---

# Landing page expected-red evidence

## Command

```text
node --test website/tests/sgad-acceptance.test.mjs
```

## Environment

- Node.js: `v26.0.0`
- Platform: `Darwin 25.5.0 arm64`
- Runner: Node.js built-in test runner

## Result

The runner executed 19 mapped acceptance checks: 1 passed and 18 failed. The
failures are expected missing behavior, not test-runner, dependency, syntax, or
environment failures.

The failures establish that the approved baseline did not yet contain:

- The React/Vite static application or canonical public copy.
- The Hallmark design tokens, atmospheric evidence-path artwork, responsive
  behavior, focus treatment, or reduced-motion behavior.
- Browser accessibility and responsive tests.
- GitHub Pages verification and deployment configuration.
- A retained red-state record completing the traceability chain.

`AC-WEB-015` passed at baseline because the absent application already satisfied
the negative invariant that no analytics, data collection, or browser storage
writes occur. SGAD does not require fabricating a failure for behavior already
true; implementation must preserve this passing invariant.

## Criterion outcome

| Outcome | Criteria |
|---|---|
| Expected red | AC-WEB-001 through AC-WEB-014, AC-WEB-016 through AC-WEB-019 |
| Baseline invariant passed | AC-WEB-015 |

The full console output is reproducible from the command above against the
identified baseline and test digest.

## React acceptance red

After the React test harness was configured—but before page implementation—the
following command executed successfully:

```text
cd website && npm test
```

Vitest `4.1.10` executed eight tests. Seven failed because the empty React
baseline did not contain the approved content, lifecycle, links, landmarks, or
keyboard order. `AC-WEB-015` continued to pass as the preserved no-collection
invariant.

- App test digest:
  `sha256:aceba0e7a4323a8a9c86583a090e1bcc1196ad2973d1c186b42d16931b3b1f4b`
- Test setup digest:
  `sha256:c2ccf2417a8183a91935356b3d91c9aefc75b23abe2e72e335e671c12654f65d`

## Browser acceptance red

After Playwright `1.62.1`, its pinned Chromium runtime, and the static preview
server were verified operational, the following command ran against the empty
React baseline:

```text
cd website && npm run test:browser -- --workers=1
```

The content, canonical-action, and keyboard-focus checks failed because those
approved elements did not exist. Baseline-safe checks for an empty document—no
horizontal overflow, no spatial animation, and no broken base-path request—were
already green and must remain green after implementation.

- Browser test digest:
  `sha256:82771b9eb4cbc14b6ef3ca574584731700324956a3e2991287278de9c990b776`
- Playwright config digest:
  `sha256:a8dd4488a12d65684820c92963d0dc0949924f4032906e11116a5b1c9ebd9313`
- Recorded: `2026-08-06T15:19:48Z`

The browser suite later gained green-only coverage for the 1280 × 800 hero
composition and the no-JavaScript fallback. Its current digest is
`sha256:45d3af90dfe256fcf4cab061934b3e27cd0ab3742d916dabfbe16864574d865b`.
The historical browser digest above is retained as the exact artifact that ran
against the empty baseline; it is supplementary evidence and is not used to
bind approval to expected red. That binding remains the unchanged structural
test digest recorded in this document's front matter.

The later canonical-link release guard is a green-only invariant: the approved
SGAD guide and templates already existed in the implementation baseline. It
ensures the website and those destinations enter `main` in the same release and
does not replace the expected-red evidence for AC-WEB-006 or AC-WEB-008.
