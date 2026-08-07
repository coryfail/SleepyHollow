# Discovery and application planning

Inspect before asking. Read the existing project's configuration, routes,
requirements, and tests, and treat anything already declared there as resolved.
Re-asking a resolved question wastes the developer's attention and invites a
contradictory answer.

## Material topics

Ask about a topic only when the answer changes behavior or architecture.

| Topic                | Ask when unresolved                                          | Why it is material                            |
| -------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Resources            | What does the application own, and what identifies one?      | Determines routes, keys, and contracts        |
| Persistence          | What outlives a request, and for how long?                   | Determines the storage and retention model    |
| Authentication       | Who calls this, and how do they prove identity?              | Changes every protected route                 |
| Authorization        | Who may act on data they do not own?                         | Changes handler and data-access behavior      |
| Consumers            | Which clients consume this, and do they need a typed client? | Changes generated contracts and compatibility |
| Operations           | Which failures must be observable in production?             | Changes configuration and logging             |
| Deployment           | Where does this run, and what must exist first?              | Changes verification and delivery evidence    |
| Service architecture | Must any part deploy independently?                          | Changes service and transport design          |

## Questions not worth asking

- Anything the inspected project already declares.
- Preferences with no behavioral consequence, such as internal file naming.
- Implementation details the framework already decides, such as the router.
- Hypotheticals beyond the stated scope.

## Unresolved decisions

When an answer is genuinely unknown, record it as an open question with a stable
identifier, the decision it blocks, and what would resolve it. Never substitute
an invented answer for a missing one. An application requirement with three
honest open questions is more useful than one with three fabricated decisions.

## Authentication planning

When the application requires authentication, record every element below.
Missing elements block approval:

- Actors and the trust boundary each credential crosses
- Credential kind: session, token, API key, or external identity
- Expiration and revocation
- Transport on each request
- Cross-site request implications, or why none exist
- `401` behavior for a missing or invalid credential
- `403` behavior for an authenticated but disallowed call

An application that needs no authentication records that as an explicit
decision, not as an omission.
