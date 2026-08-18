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

## Body sections

An endpoint requirement includes purpose, supported methods, inputs, success and
error responses, authentication, authorization, data access and indexes, side
effects, abuse considerations, dependencies, assumptions, and acceptance
criteria. A derived requirement cites the applicable application sections and
must not contradict approved application behavior.

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
