---
id: SH-R001
title: Project-boundary organization
status: approved
depends_on: []
open_decisions: []
---

# Project-boundary organization

## Purpose

Keep framework-independent SGAD assets, Sleepy Hollow product assets, and the
website's design-tool metadata separated by their actual ownership boundaries.

## Scope

- Treat `website/` as the Hallmark-managed frontend project root.
- Store the Sleepy Hollow application skill under the shared `skills/`
  namespace without combining it with the standalone SGAD workflow skill.
- Update current canonical documentation to match the resulting paths.
- Preserve historical evidence verbatim when it describes an earlier path or
  red state.

## Acceptance criteria

- AC-R001-001: Hallmark project metadata lives under `website/.hallmark/`, and
  the repository root does not retain a second `.hallmark/` directory.
- AC-R001-002: Sleepy Hollow application-skill requirements live under
  `skills/sleepy-hollow/`, while the independent methodology skill remains
  under `skills/sgad-workflow/`.
- AC-R001-003: Current README and requirement-inventory references use the new
  canonical paths, while historical evidence remains unchanged.
- AC-R001-004: Repository reference checks and the complete website verifier
  pass after the move.

## Risk and impact

Risk is low. This feature changes repository paths and current documentation but
does not change runtime behavior, public URLs, requirement identities, or skill
behavior. Consumers of unpublished `skill/` paths must update to the canonical
`skills/sleepy-hollow/` path.

## Approval

The human project owner authorized this exact bounded change in the governing
Codex conversation on August 6, 2026, including promotion through `development`
to `main` after verification.
