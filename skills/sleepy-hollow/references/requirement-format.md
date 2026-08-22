# Governed requirement format

Every requirement is UTF-8 Markdown with one leading YAML 1.2 frontmatter
document. Frontmatter is delimited by lines containing exactly `---`, and only
core scalar, sequence, and mapping types are accepted. Duplicate keys, aliases,
merge keys, custom tags, multiple documents, or text before the opening
delimiter are invalid.

## Placement

- `requirements/application.req.md` owns application-wide intent and is the only
  item in the top-level `requirements/` directory.
- A component or endpoint uses a meaningful named `*.req.md` file beside the
  behavior it owns. A directory may contain multiple named requirement files.

## Frontmatter

```yaml
---
# Endpoint requirements use this shape.
id: EP-BOOKMARKS-CREATE
path: /bookmarks
status: draft
methods:
  - POST
depends_on: []
service: api
---
```

`status` is a lifecycle projection for routing and human readability. It is
never evidence. Approval and verification come from the governance record.

The application requirement has a different, exact frontmatter contract:

```yaml
---
schema: sgad-application/v0.2
id: bookmarks-application
title: Bookmark application
status: draft
risk: standard
depends_on: []
owners:
  - bookmarks maintainers
---
```

The application parser requires `schema`, `id`, `title`, `risk`, `status`, a
`depends_on` sequence, and a non-empty `owners` sequence. The legacy
`sleepy-hollow-application/v0.1` scaffold is not accepted. For an existing
local project, replace that schema, add the missing identity/risk/ownership and
dependency fields, complete the application sections below, then return the
requirement to `draft` and obtain fresh exact-content approval. The migration
changes governed bytes; changing `status` alone cannot make the old approval
valid.

The framework 0.3.5 `hollow create` scaffold now emits a matching `tsconfig.json`
alongside its `tsc --noEmit` check script. A project created by an older CLI may
have the script without that file; add or migrate the TypeScript configuration
before treating a check failure as application behavior or red state.

## Body sections

An endpoint requirement includes purpose, supported methods, inputs, success and
error responses, authentication, authorization, data access and indexes, side
effects, abuse considerations, dependencies, assumptions, and acceptance
criteria. A derived requirement cites the applicable application sections and
must not contradict approved application behavior.

### Endpoint headings accepted by the parser

Section lookup is case-sensitive. Use these exact heading titles (normally as
level-two headings); where two titles are shown, either spelling is accepted:

| Required title | Accepted alternative |
| --- | --- |
| `Purpose` | — |
| `Inputs` | `Input` |
| `Success responses` | `Success response` |
| `Errors` | `Error responses` |
| `Security` | — |
| `Data access and indexes` | `Data access` |
| `Side effects` | — |
| `Abuse considerations` | `Rate-limit or abuse considerations` |
| `Dependencies and assumptions` | — |
| `Acceptance criteria` | — |

For every value in frontmatter `methods`, add a heading with that exact value;
for example, `methods: [GET, POST]` requires `## GET` and `## POST`. Method
values must be uppercase. `Purpose`, `Security`, and the other titles above are
not normalized for capitalization, so `## security` or `## Acceptance Criteria`
does not satisfy the required section lookup. The parser does accept
case-insensitive `Authentication:` and `Authorization:` labels inside the
exact `Security` section.

## Acceptance criteria

Give every criterion a stable, globally unique identifier:

```markdown
- AC-EP-001: A bookmark with no URL returns 422 with RFC 9457 problem details.
```

Criteria must be individually testable. A criterion that cannot fail is not a
criterion.

## Governance record

The `## Governance record` heading is reserved for the append-only record at the
end of the file. No level-two heading may follow it, and descriptive sections
must use another heading so a verifier cannot select the wrong boundary.

The governed-content digest covers the exact UTF-8 bytes before that heading
after omitting the single top-level frontmatter `status:` line and its line
ending. No other normalization is permitted, so changing any governed byte
invalidates approval while changing only `status` does not.

The record carries Approval, Criterion mapping, Red-state evidence,
Verification, and Delivery entries. Never edit a historical entry; append.

The parser selects the latest heading whose title starts with `### Approval`,
including named headings such as `### Approval, current implementation`. An
append-only invalidation followed by reapproval therefore works only when the
new approval is appended after the invalidation; do not edit the old record.
The current approval's `- Approved criteria:` line must explicitly contain
every approved criterion ID, such as:

```markdown
### Approval, current implementation

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-21T12:00:00Z.
- Approved criteria: AC-APP-001, AC-APP-002, AC-APP-003.
- Governed-content digest: sha256:<64 lowercase hex characters>.
```

Human shorthand such as `AC-APP-001 through AC-APP-010` is not sufficient for
the parser. Keep the complete list of IDs explicit in the current approval
record, and ensure the digest matches the governed content.
