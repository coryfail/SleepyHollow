---
schema: sgad-component/v0.2
id: SH-F015
title: Local development command
status: verified
risk: standard
source_sections:
  - "12"
  - "14"
depends_on:
  - SH-F001
  - SH-F002
  - SH-F012
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# Local development command

## Purpose

Run a Sleepy Hollow application locally with fast, deterministic feedback while
routes, schemas, and configuration change.

## In scope

- `hollow dev` startup and shutdown.
- Development-mode configuration.
- Route and configuration change handling.
- Human and structured lifecycle diagnostics.

## Requirements

### Invocation and startup

The exact first-release grammar is:

```text
hollow dev [--port <1-65535>] [--json]
```

The default port is `8000` and the only first-release bind host is
`127.0.0.1`. Each option may appear once. Unknown, positional, duplicated,
missing, non-integer, or out-of-range values return usage status `2` before
loading project code, opening a watcher, or binding a listener.

The command shall resolve one project-contained `sleepyhollow.config.ts` from
the invocation directory and use its canonical API directory. The project file,
API directory, and any declared development environment file must remain inside
that project after real-path resolution; symlink escape, malformed project
configuration, unreadable input, route discovery failure, normalized validation
failure, or an unavailable port shall fail closed with a stable diagnostic that
names each safe project-relative file, route, or configuration key that can be
identified. A newly created project with no custom endpoint shall be valid and
shall serve the canonical not-found response.

Before accepting traffic, the runtime loader shall set the mode explicitly to
`development`, resolve the SH-F012 development configuration, discover the
complete SH-F002 route inventory, and construct the canonical validated runtime
pipeline. It shall not fall back to preview or production configuration, load a
preview or production environment file, or expose configuration values in an
event. Only keys accepted by the development schema and its explicitly declared
local environment file may enter resolved application configuration; process
environment metadata may identify a key's source but never its value.

The listener is active only after all preparation succeeds and the bind is
confirmed. The initial active event shall identify the loopback URL, port, mode,
route count, and generation `1`. Startup failure returns nonzero, emits no active
event, closes any partially created runtime or watcher, and releases the port.

### Watched restart lifecycle

After startup, the command shall watch the canonical project configuration,
project-contained TypeScript or TSX application sources, the API directory, and
the explicitly declared development environment file. Repository metadata,
generated contracts, dependency caches, editor temporaries, and paths outside
the project are excluded. Watch input is normalized to sorted unique
project-relative paths and debounced into one generation attempt; unsupported or
unsafe watcher paths fail closed rather than widening the watched scope.

Each change attempt prepares a fresh runtime generation and re-runs the same
configuration, discovery, normalization, and runtime construction used at
startup. Preparation shall use a generation-specific module boundary so changed
route modules and their local dependencies cannot be reused from a prior module
cache. If preparation fails, the current valid generation remains active, one
rejected diagnostic event identifies the changed paths and safe cause, and a
later change may retry without manual cleanup. If preparation succeeds, the
supervisor stops the prior listener, starts the candidate on the same URL, and
emits an active reload event only after the replacement bind succeeds. A bind or
activation failure is reported as rejected and never described as active; the
supervisor may restore the prior prepared generation when the runtime adapter
supports it, but shall not claim that restoration succeeded until it is bound.

The watcher and runtime adapters shall accept abort signals. SIGINT, SIGTERM, an
injected cancellation, or a terminal supervisor failure shall stop accepting
new work, close the watcher, abort an in-progress preparation, stop the active
runtime exactly once, await resource release, and emit one terminal shutdown
event. A normal interrupt returns zero; startup, supervisor, cleanup, or
unexpected watcher failure returns nonzero. Signal handlers and timers shall be
removed before return so a later invocation in the same host does not retain
state.

### Lifecycle output

The canonical command API shall produce one ordered lifecycle stream. Every
event has this common envelope:

```ts
interface DevEvent {
  readonly schema: "sleepy-hollow-dev-event/v1";
  readonly command: "dev";
  readonly sequence: number;
  readonly type: "startup" | "reload" | "diagnostic" | "shutdown";
  readonly state: "active" | "rejected" | "stopped";
  readonly generation: number;
  readonly mode: "development";
  readonly url?: string;
  readonly routeCount?: number;
  readonly changedFiles?: readonly string[];
  readonly reason?: "interrupt" | "termination" | "cancelled" | "failure";
  readonly diagnostics: readonly DevDiagnostic[];
}
```

Sequence numbers are contiguous from one and events, diagnostics, and changed
paths use deterministic ordering. Startup and successful reload events are
`active`; rejected startup or reload attempts are `diagnostic`; shutdown is
`stopped`. Human mode renders each event immediately as bounded prose. JSON mode
renders the same events immediately as newline-delimited JSON, one complete
event object per line, so automation never parses human text. Invalid invocation
still uses the shared one-object CLI usage result because no lifecycle started.

Diagnostics use stable codes and corrections. Output shall redact credentials,
configuration values, authorization material, request or response bodies,
absolute host paths, internal stacks, and control characters. The command shall
not modify requirements, approvals, generated artifacts, or verification state.

## Acceptance criteria

- AC-F015-001: Running `hollow dev` in a valid newly created project starts the
  local application and reports its listening URL.
- AC-F015-002: The command uses development-mode configuration and does not load
  production-only credentials implicitly.
- AC-F015-003: A valid route change becomes active through the documented reload
  or restart behavior without requiring an undocumented manual cleanup step.
- AC-F015-004: An invalid route or configuration change produces an actionable
  diagnostic and is never reported as successfully active.
- AC-F015-005: Startup failure returns nonzero and identifies the affected route,
  file, or configuration key.
- AC-F015-006: An interrupt stops the server cleanly and releases its listening
  resources.
- AC-F015-007: Structured mode emits versioned startup, reload, diagnostic, and
  shutdown events without requiring automation to parse human prose.

## Out of scope

- Production process supervision.
- A browser-based development dashboard.
- Model invocation or skill orchestration.

## Dependencies and assumptions

SH-F001 supplies the runtime fetch boundary, SH-F002 supplies deterministic
route discovery, and SH-F012 supplies explicit mode-aware configuration and
redaction. SH-F011 already reserves the shared `dev` command adapter and remains
an integration boundary rather than a semantic prerequisite. The development
supervisor owns restart orchestration and generation-specific module
invalidation; it may use a fresh subprocess or an equivalently isolated loader,
provided the observable lifecycle above and the same canonical runtime pipeline
are preserved.

Runtime, watcher, signal, clock, and lifecycle-sink boundaries are injectable so
tests can exercise startup, reload, rejection, restoration, and cleanup without
leaking listeners or depending on wall-clock races. Production adapters remain
the authority for actual filesystem watching, signal registration, and loopback
binding.

## Acceptance evidence map

| Criterion | Executable evidence required before implementation |
| --- | --- |
| AC-F015-001 | Empty canonical scaffold plus injected real listener probe proving validated startup, loopback URL, route count zero, and generation one. |
| AC-F015-002 | Development/preview/production schema and environment fixtures proving only development configuration is resolved and no value enters output. |
| AC-F015-003 | Debounced multi-file change proving one fresh generation, invalidated local imports, ordered replacement, same URL, and no manual cleanup. |
| AC-F015-004 | Invalid route and configuration changes proving the prior generation stays active, rejection is actionable, and no active event is emitted for the candidate. |
| AC-F015-005 | Project, route, configuration, bind, and watcher startup failures proving nonzero status, safe locations, no false active event, and complete partial cleanup. |
| AC-F015-006 | SIGINT, SIGTERM, cancellation, and repeated-stop probes proving idempotent ordered watcher/runtime cleanup and resource reuse. |
| AC-F015-007 | Mixed startup, reload, diagnostic, and shutdown fixtures proving immediate human/NDJSON parity, contiguous sequencing, stable schema, deterministic ordering, and redaction. |

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T20:17:24Z.
- Approved criteria: AC-F015-001 through AC-F015-007.
- Governed-content digest:
  `sha256:bd02aceb3ee878b11e5150dd0bfb2663f30ee1f7f0cdd0f41d3c520774d92892`.
- Decision source: Codex conversation; direct response `Approve` after review of
  the requirement path, bounded criteria, standard-risk classification,
  verified SH-F001, SH-F002, and SH-F012 dependencies, loopback-only startup,
  validated fresh-generation restart lifecycle, prior-generation retention,
  clean shutdown, immediate human/NDJSON events, and exact governed-content
  digest.

### Criterion mapping

- Status: mapped to executable tests before implementation.
- AC-F015-001 through AC-F015-007 map one-to-one to the correspondingly named
  tests in `cli/dev/dev_test.ts`.
- Governed test digest:
  `sha256:615502b26885394ae4a453636385bba10023a5b6586ddc2b20d8bdecc3f1914f`.

### Red-state evidence

- Status: credible red state captured.
- Captured at: 2026-08-07T20:20:56Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F015 requirement, mapped development-command tests, Deno task
  configuration, and the previously verified working tree.
- Test digest:
  `sha256:615502b26885394ae4a453636385bba10023a5b6586ddc2b20d8bdecc3f1914f`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- `deno task check:dev` passed.
- `deno task test:dev` ran all seven mapped tests with loopback access; all
  seven failed only at the explicit `SH_DEV_COMMAND_NOT_IMPLEMENTED` boundary
  in `cli/dev/mod.ts`, with no fixture, compilation, dependency, permission, or
  unrelated infrastructure failure.

### Verification

- Status: implementation complete; pending final independent loopback
  verification.
- Current test digest remains
  `sha256:615502b26885394ae4a453636385bba10023a5b6586ddc2b20d8bdecc3f1914f`.
- Format, production lint, type checking, `git diff --check`, shared CLI 9/9,
  independent checking 11/11, planning 10/10, creation 9/9, test command 7/7,
  the complete framework 77/77 with fifteen nested steps, and repository
  governance 9/9 pass with the implementation present.
- A fresh generated empty scaffold passes the production worker's isolated
  validation protocol with `routeCount: 0`. The restricted-sandbox production
  probe then reaches listener activation and fails closed with
  `SH_DEV_BIND_FAILED`, proving that project preparation completed before the
  host denied loopback binding.
- Five non-socket mapped tests pass in the restricted sandbox. AC-F015-001 and
  AC-F015-006 stop before exercising product behavior because the host rejects
  `Deno.listen` with operating-system `PermissionDenied`. The same two probes
  previously reached the explicit implementation boundary when loopback access
  was available during red-state capture.
- Blocker: the environment declined the required post-implementation loopback
  verifier because its approval quota is exhausted. SH-F015 remains `approved`,
  not `verified`; no implementation digest or passing verification claim is
  sealed until both real-listener probes run successfully.

### Verification, loopback closure

- Status: passed. The blocker recorded above is resolved.
- Verified at: 2026-08-08T14:40:47Z.
- Command: `deno task verify:dev` using Deno `2.9.5` on macOS arm64, in an
  environment that permits loopback binding.
- Result: `7 passed | 0 failed`. AC-F015-001 and AC-F015-006 bound real
  listeners rather than stopping at the sandbox denial, reporting
  `Listening on http://127.0.0.1:<port>/` for each. Both real-listener probes
  the prior entry required have now run successfully.
- Lint-scope correction: `verify:dev` enumerated production files individually
  and omitted `cli/dev/dev_test.ts`, so two real lint errors in the mapped test
  file were invisible to the component gate and to CI. An unused `DevDiagnostic`
  import was removed, `unusedPort` was made synchronous because it awaited
  nothing, and the lint invocation now covers `cli/dev/*.ts`. No test assertion
  was weakened and no mapped behavior changed.
- Regression scope: `verify:framework`, `verify:create`, `verify:planning`,
  `verify:check`, `verify:cli`, `verify:test-command`, `verify:skill`,
  `verify:deploy`, and `verify:evidence` all passed at the same revision.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
