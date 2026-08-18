---
id: EP-TODOS-COLLECTION
path: /todos
status: approved
methods:
  - POST
  - GET
depends_on: []
service: api
---

# Todo collection

## Purpose

Create a todo, and list todos filtered by whether they are done.

## Source application sections

- Proposed endpoints and methods

## POST

Create one todo, which starts not done.

## GET

List todos matching a done state.

## Inputs

`POST` accepts a JSON body with a `title` of one to two hundred characters.
`GET` accepts an optional `done` boolean defaulting to false and an optional
`limit` from one to one hundred defaulting to twenty-five.

## Success responses

`POST` returns `201` with the created todo including its identifier. `GET`
returns `200` with an `items` array and an opaque `cursor`.

## Errors

`422` with RFC 9457 problem details for an invalid body or query.

## Security

Authentication: none, by explicit application decision. Every request location
read by a handler is validated by a strict schema, and the body declares a
maximum size.

## Data access and indexes

`POST` performs one create against the `todos` resource. `GET` performs one
bounded query against the declared `done` index.

## Side effects

`POST` persists one todo. `GET` has none.

## Abuse considerations

The list limit is bounded at one hundred and titles at two hundred characters.

## Dependencies and assumptions

None beyond the framework runtime.

## Acceptance criteria

- AC-TODOS-001: A valid create returns 201 with the stored todo, marked not
  done, carrying a generated identifier.
- AC-TODOS-002: Listing returns only todos matching the requested done state.
- AC-TODOS-003: Listing queries the declared done index with a bounded limit.

## Governance record

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T01:55:20Z.
- Approved criteria: AC-TODOS-001 through AC-TODOS-003.
- Governed-content digest:
  `sha256:2819468c2716740e67c8a17e0e478c0bf269b1ff77cf84bf7217e6f093fea768`.
- Decision source: direct response confirming the presented digests after
  authentication was revised to an explicit none decision.
