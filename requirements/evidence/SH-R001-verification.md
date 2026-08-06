---
schema: sgad-verification-report/v0.1
result: passed
requirement_id: SH-R001
requirement_digest: sha256:9ced44762c2fdcfc2e1e35f6e5414d55e76a43d8e13fe0cff71cd5f0c6210691
implementation_revision: a31961a6a4073032ca540b5425a973bd2812aac5
base_revision: eb5026d610c5eff535c00c200761a65e39537ef3
verified_at: 2026-08-06T20:32:01Z
---

# SH-R001 verification report

## Authority and scope

Approval record `requirements/approvals/SH-R001.yaml` matches the current
requirement digest and authorizes AC-R001-001 through AC-R001-004 at low risk.
The implementation is limited to repository paths, current canonical references,
and the evidence required for this move.

## Criterion results

| Criterion | Evaluation | Result |
|---|---|---|
| AC-R001-001 | Assert `website/.hallmark/` files exist and root `.hallmark/` is absent | passed |
| AC-R001-002 | Assert both named skill directories exist and singular `skill/` is absent | passed |
| AC-R001-003 | Search current README and inventory for stale singular paths | passed |
| AC-R001-004 | `git diff --check` and `website/package.json#verify` | passed |

## Verification results

- Requirement and approval SHA-256 digests match.
- Repository structure and current-reference checks passed.
- Structural acceptance: 16/16 passed.
- Canonical link targets: 1/1 passed.
- React behavior: 8/8 passed.
- TypeScript and production build passed.
- Playwright browser, accessibility, responsive, and no-JavaScript checks:
  22/22 passed.

## Residual risk

Any unpublished consumer that referenced the former `skill/` directory must use
`skills/sleepy-hollow/`. No released runtime or public URL is affected.

## Result

Passed for implementation revision `a31961a6a4073032ca540b5425a973bd2812aac5`.
The revision is eligible for the authorized promotion through `development` to
`main`.
