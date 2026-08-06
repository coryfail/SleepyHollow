---
schema: sgad-red-evidence/v0.1
requirement_id: SH-R001
requirement_digest: sha256:9ced44762c2fdcfc2e1e35f6e5414d55e76a43d8e13fe0cff71cd5f0c6210691
base_revision: eb5026d610c5eff535c00c200761a65e39537ef3
result: failed-as-expected
---

# SH-R001 expected-red evidence

Before implementation, direct filesystem checks reported exit status `1` for
all four requested boundary conditions:

- `website/.hallmark/` did not exist.
- `skills/sleepy-hollow/` did not exist.
- The root `.hallmark/` directory still existed.
- The singular root `skill/` directory still existed.

The failures directly demonstrate the missing approved organization. They are
not compilation, dependency, environment, or unrelated baseline failures.
