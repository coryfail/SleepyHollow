---
id: EP-TODOS-ITEM
path: /todos/[id]
status: approved
methods:
  - GET
  - PATCH
  - DELETE
depends_on:
  - EP-TODOS-COLLECTION
service: api
---

# Todo item

## Purpose

Read, update, and delete one todo by identifier.

## Source application sections

- Proposed endpoints and methods

## GET

Return one todo.

## PATCH

Update the title or done state of one todo.

## DELETE

Remove one todo.

## Inputs

Every method takes the todo identifier as a path parameter. `PATCH` accepts a
JSON body with an optional `title` and an optional `done`.

## Success responses

`GET` and `PATCH` return `200` with the todo. `DELETE` returns `204` with no
body.

## Errors

`404` for an unknown identifier and `409` for a concurrent modification, each
with RFC 9457 problem details.

## Security

Authentication: none, by explicit application decision. The identifier is
validated by a strict schema before any read.

## Data access and indexes

Each method performs one primary-key read. `PATCH` and `DELETE` additionally
perform one versionstamp-checked mutation.

## Side effects

`PATCH` replaces one todo. `DELETE` removes one. `GET` has none.

## Abuse considerations

An unknown identifier is reported without disclosing whether it ever existed.

## Dependencies and assumptions

Depends on the collection endpoint for creation.

## Acceptance criteria

- AC-TODOS-004: Reading an unknown identifier returns 404.
- AC-TODOS-005: An update replaces only the supplied fields and returns the
  stored result.
- AC-TODOS-006: A delete removes the todo, after which reading it returns 404.

## Governance record

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T01:55:20Z.
- Approved criteria: AC-TODOS-004 through AC-TODOS-006.
- Governed-content digest:
  `sha256:26659bec0c62e58bb5141e489af5081a35df4e90d48e1ff2a460a554f36db46f`.
- Decision source: direct response confirming the presented digests after
  authentication was revised to an explicit none decision.
