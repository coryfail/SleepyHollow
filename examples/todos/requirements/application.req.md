---
schema: sleepy-hollow-application/v0.1
title: todos
status: approved
---

# Todo application

## Purpose and user goals

Let a signed-in person keep a private list of todos: capture one quickly, see
what is outstanding, mark one done, and remove one that no longer matters.

## Actors and API consumers

One actor: an authenticated person acting only on their own todos. One consumer:
a first-party client that holds a session and calls this API directly. No
machine-to-machine consumer in this release.

## In scope and out of scope

In scope: creating, listing, reading, updating, and deleting a todo owned by the
caller. Out of scope: sharing, assignment to another person, due dates,
reminders, attachments, and search.

## Resource and data model

One resource, `todos`, keyed by a generated UUID, holding a `title` of one to
two hundred characters, a boolean `done`, and an ISO-8601 `createdAt`.

## Proposed endpoints and methods

`POST /todos` and `GET /todos` for the collection. `GET`, `PATCH`, and `DELETE`
on `/todos/[id]` for one item.

## Relationships and indexes

No relationships between resources. One declared index, `owner`, over `ownerId`,
which is the only supported query path.

## Request and response conventions

JSON requests and responses. Identifiers appear as `id`. List responses carry an
`items` array and an opaque `cursor`.

## Error behavior

RFC 9457 problem details for every failure. `422` for invalid input, `404` for
an unknown identifier, `409` for a concurrent modification.

## Authentication and authorization

Authentication: **none**, recorded as an explicit decision. This example exists
to demonstrate routing, validation, data access, and verification, so it serves
one shared todo list with no caller identity.

Authorization: none. Every caller may act on every todo.

A real application would declare a provider here and record credential kind,
expiration, revocation, transport, cross-site implications, and its `401` and
`403` behavior.

## Security constraints

Every request location a handler reads is validated. List queries are bounded at
one hundred. Ownership failures reveal nothing about the todo's contents.

## Deployment model

One deployable API on Fly.io with embedded SQLite on a durable volume.

## Service architecture

One API. Nothing here justifies independent deployment.

## Cross-cutting acceptance criteria

- AC-APP-001: Every failure response uses RFC 9457 problem details.
- AC-APP-002: Every request location a handler reads is validated by a strict
  schema, and every list query is bounded.

## Endpoint inventory and dependencies

`EP-TODOS-COLLECTION` owns `/todos`. `EP-TODOS-ITEM` owns `/todos/[id]` and
depends on the collection for creation.

## Open questions, assumptions, and risks

- OPEN-TODO-001: Whether a soft-delete and restore is needed remains unresolved;
  this release deletes permanently.
- Assumption: the client holds a session and the provider yields a stable
  principal identifier.
- Risk: unbounded title length would allow storage abuse, mitigated by the two
  hundred character bound.

## Governance record

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-09T01:55:20Z.
- Approved criteria: AC-APP-001 and AC-APP-002.
- Governed-content digest:
  `sha256:793c3305c9f59d685638b281a9abfa712114a2ea2004fc6736b0be883eda714b`.
- Decision source: direct response confirming the presented digests after
  authentication was revised to an explicit none decision.

### Approval, Node/Bun platform migration

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-19T13:52:03Z.
- Approved criteria: all acceptance criteria currently owned by the todos example.
- Governed-content digest:
  `sha256:50ebc8b5a54c464650a09999aebe9b634c234df2daa2813700fb7e470fc467e7`.
- Decision source: owner direct response `approve it all`, immediately after
  review of manifest `sha256:efa3ea4203288b8ddf06e598787a4bcfea3125b77952381dd98fa34a8a75e710`.
