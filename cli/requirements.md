---
schema: sgad-component/v0.2
id: SH-F011
title: CLI and diagnostics
status: verified
risk: standard
source_sections:
  - "12"
depends_on:
  - SH-F001
  - SH-F007
  - SH-F008
  - SH-F010
open_decisions: []
owners:
  - Sleepy Hollow maintainers
---

# CLI and diagnostics

## Purpose

Provide one small, predictable command surface that humans, agents, and
automation can invoke without parsing unstable prose or accepting hidden changes.

## In scope

- `hollow create`, `dev`, `test`, `check`, `generate`, and `deploy`.
- Consistent help, exit status, human output, and `--json` output.
- Stable diagnostic codes and precise affected-object locations.
- Preview of data and contract changes before application.

## Requirements

### Fixed command surface

The first-release registry shall contain exactly these commands in this order:

| Command | Description | Canonical owner |
| --- | --- | --- |
| `create` | Create one deterministic Sleepy Hollow project. | SH-F001 `createProject` |
| `dev` | Run the project locally in development mode. | SH-F015 command API |
| `test` | Run full or safely targeted project tests. | SH-F016 command API |
| `check` | Independently verify project evidence. | SH-F008 `runCheckCommand` |
| `generate` | Generate or check owned API contracts. | SH-F010 `generateContracts` |
| `deploy` | Preview and deliver one verified Deno Deploy revision. | SH-F013 command API |

`hollow`, `hollow help`, and `hollow --help` shall render top-level help and
return zero. `hollow help <command>` and `hollow <command> --help` shall render
the same command-specific usage without invoking the command. Standalone
`hollow --version` and `hollow -V` shall render `hollow <semver>` and return
zero. Help and version invocations are informational results, not command
executions.

The registry is a compile-time application boundary rather than a runtime plugin
mechanism. An unknown command, an extra operand to help or version, a global
option in an invalid position, or an option rejected by the selected adapter
shall return usage status `2`. Usage rejection shall occur before filesystem,
network, process, environment, credential, or feature-command access. The
diagnostic shall use `SH_CLI_COMMAND_UNKNOWN` or `SH_CLI_USAGE_INVALID`, name the
invalid token without echoing a secret value, and provide the applicable usage.

### Dispatch and exit status

The dispatcher shall select one command once and pass its remaining arguments to
one command adapter. Each adapter shall validate its complete option grammar
before invoking the canonical public API named above. The adapter may normalize
a canonical feature result for presentation but shall not copy route discovery,
test selection, verification, contract analysis, development-runtime, or
deployment rules. A test-injected adapter registry may replace effects while
retaining the same fixed command names; production registration shall fail
closed when a canonical command API is unavailable rather than simulate success.

Exit status has one stable meaning across human and JSON modes:

- `0` means the requested operation, explicit preview, help, or version query
  completed successfully;
- `1` means valid usage reached a required operational, verification,
  confirmation, or feature-availability failure; and
- `2` means the invocation was invalid and no command operation ran.

Thrown or rejected feature errors shall be converted to a bounded diagnostic and
status `1`; they shall not escape the dispatcher or expose a stack trace in
normal output. An interrupt may retain the platform's nonzero interrupt status.
Rendering failures shall never convert a failed result into zero.

### One result and two renderers

Every invoked command shall first produce one normalized command result. Human
and JSON renderers shall consume that same object, preserve the same outcome and
ordered diagnostics, and perform no command effect. A result shall contain at
least `ok`, `command`, `diagnostics`, and a command-contract version discriminator.
Existing canonical command contracts may use their governed `schema` literal or,
for SH-F001, its governed semantic `version`; CLI-owned help, version, usage, and
dispatch failures shall use `sleepy-hollow-cli-result/v1`. JSON output shall be
one valid JSON object on the selected output stream and shall not require prose,
ANSI, timing text, or stack-trace parsing. Additive command-owned fields are
permitted, but the meaning or type of an existing field or diagnostic code shall
not change within its version.

Successful human output goes to standard output. A failed or invalid invocation
goes to standard error. JSON mode uses the same stream rule. A diagnostic shall
have a stable `SH_` code, severity, bounded summary, correction when known, and a
structured location object containing every applicable item from these sorted,
deduplicated collections:

- requirement IDs and acceptance-criterion IDs;
- method-and-path route identities and operation IDs;
- field paths and index names;
- project-relative file paths; and
- configuration keys.

An inapplicable collection may be absent. Absolute host paths, environment
values, credentials, authorization material, request bodies, and arbitrary
thrown values shall not enter either renderer. Diagnostics originating in a
canonical feature retain their feature code and context; adapters may add
location structure but shall not replace a specific failure with generic prose.

### Preview and confirmation boundary

A canonical feature that proposes destructive data work, an externally applied
contract change, or another irreversible external mutation shall return a
side-effect-free preview before exposing its apply continuation. The preview
shall describe affected objects, redact values, declare whether confirmation is
required, and include a deterministic confirmation digest bound to the complete
normalized plan. Without an explicit matching confirmation through that
command's documented automation-representable confirmation option, the adapter
shall not call the apply continuation and an apply-intended invocation shall
return `SH_CLI_CONFIRMATION_REQUIRED` with status `1`. A mismatched or stale
digest shall fail in the same way. An explicitly requested preview is a
successful operation and returns zero without applying anything.

Safe, bounded local operations that already guarantee no overwrite or atomic
replacement, such as SH-F001 project creation and SH-F010 owned-artifact
generation, retain their feature-governed behavior. The CLI shall not invent a
confirmation prompt after an operation or infer consent from interactive input.

### Non-agent boundary

The first-release CLI shall not contain an agent or model command, accept a model
name, read model-provider credentials, send prompts, route model requests, or
present itself as an agent runtime. Agent guidance and model interaction belong
to the official Sleepy Hollow skill and its host, outside this command registry.

## Acceptance criteria

- AC-F011-001: Top-level help lists exactly the supported first-release commands
  with concise descriptions and command-specific help.
- AC-F011-002: Each command returns zero only when its required operation
  succeeds and returns nonzero for a required failure.
- AC-F011-003: Each programmatically consumed command supports `--json` with a
  versioned result envelope and stable diagnostic codes.
- AC-F011-004: Human and JSON modes report the same underlying successes,
  warnings, and failures without requiring prose parsing for automation.
- AC-F011-005: A diagnostic identifies every applicable requirement, criterion,
  route, field, index, file, or configuration key involved in the failure.
- AC-F011-006: An unknown command or invalid option fails without changing the
  project and suggests valid usage.
- AC-F011-007: A pending destructive data or contract operation is shown as a
  preview and is not applied without the command's explicit confirmation path.
- AC-F011-008: The CLI dispatches test, check, generation, and deployment behavior
  to their canonical feature APIs rather than maintaining divergent rules.
- AC-F011-009: No first-release command accepts a model name, manages model
  credentials, or presents the CLI as an agent runtime.

## Out of scope

- Model invocation, routing, and token accounting.
- A universal plugin or extension marketplace.
- Interactive behavior that cannot be represented in structured automation.

## Dependencies and assumptions

Feature-specific command behavior remains governed by the corresponding feature
requirement. This feature owns only consistent selection, invocation, normalized
diagnostics, rendering, exit status, and the generic preview/confirmation guard.
SH-F001, SH-F007, SH-F008, and SH-F010 are verified inputs. SH-F013, SH-F015,
and SH-F016 may fill their predeclared adapters later without widening the fixed
command registry or weakening unavailable-command failure behavior.

The command surface is intentionally independent of shell parsing: `runCli`
accepts an argument vector and injected I/O, and command adapters receive the
already selected argument suffix. Tests shall use injected adapters and in-memory
I/O to prove selection, no-effect usage failure, rendering parity, canonical API
dispatch, and confirmation gating without starting servers or making external
deployments.

## Acceptance evidence map

| Criterion | Executable evidence required before implementation |
| --- | --- |
| AC-F011-001 | Exact registry order, top-level help, both command-help forms, version, and no handler invocation for help. |
| AC-F011-002 | Table-driven success, operational failure, usage failure, and thrown-handler exit statuses in both modes. |
| AC-F011-003 | Every registered adapter's JSON capability plus the CLI-owned v1 envelope and stable codes. |
| AC-F011-004 | Human/JSON projections from the same result with identical ordered diagnostic codes and locations. |
| AC-F011-005 | One multi-location diagnostic proving complete sorted requirement, criterion, route, field, index, file, and configuration context. |
| AC-F011-006 | Unknown command and invalid-option probes proving no injected command or mutation capability ran. |
| AC-F011-007 | Preview, missing confirmation, stale confirmation, and matching confirmation probes proving apply is gated exactly once. |
| AC-F011-008 | Spies at all six canonical command-adapter boundaries proving single dispatch and no copied feature rule. |
| AC-F011-009 | Registry, help, and parsing probes rejecting agent/model commands, model options, and model credential access. |

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T19:29:16Z.
- Approved criteria: AC-F011-001 through AC-F011-009.
- Governed-content digest:
  `sha256:cef13c72d91f09e8e3eb5007863dd4f938a17f6b0f6c0ffcb385f2c01bced04d`.
- Decision source: owner review; direct response `Approved` after review
  of the requirement path, bounded criteria, standard-risk classification,
  verified SH-F001, SH-F007, SH-F008, and SH-F010 dependencies, fixed six-command
  registry, exit semantics, structured diagnostic model, canonical dispatch,
  preview and confirmation boundary, non-agent boundary, and exact governed-
  content digest.

### Criterion mapping

- Status: mapped to executable tests before implementation.
- AC-F011-001 through AC-F011-009 map one-to-one to the correspondingly named
  tests in `cli/cli_test.ts`.
- Governed test digest:
  `sha256:64700b48ed4556c95710516e5baf0167eb9c8295295fad9e1d2b6eaae3e4ab6f`.

### Red-state evidence

- Status: credible red state captured.
- Captured at: 2026-08-07T19:32:05Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F011 requirement, mapped dispatcher tests, Deno task configuration, and the
  previously verified working tree.
- Test digest:
  `sha256:64700b48ed4556c95710516e5baf0167eb9c8295295fad9e1d2b6eaae3e4ab6f`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- `deno task check:cli` passed.
- `deno task test:cli` executed all nine mapped tests; all nine failed only at
  the explicit `SH_CLI_NOT_IMPLEMENTED` boundary in `cli/dispatcher.ts`, with
  no fixture, compilation, dependency, permission, or unrelated infrastructure
  failure.

### Verification

- Status: passed.
- Verified at: 2026-08-07T19:43:37Z.
- Requirement digest:
  `sha256:cef13c72d91f09e8e3eb5007863dd4f938a17f6b0f6c0ffcb385f2c01bced04d`.
- Implementation manifest digest:
  `sha256:8f78d19e44fa7888e2ee74d984d4dfa44902791993bc50dfdcbe326643014946`.
- Test digest:
  `sha256:64700b48ed4556c95710516e5baf0167eb9c8295295fad9e1d2b6eaae3e4ab6f`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Verifier: Deno `2.9.5` format, lint, type, test, standalone-compilation,
  framework, creation, planning, generation, and independent-check tasks plus
  the canonical repository and cross-browser website verifier on macOS arm64.
- Results: CLI dispatch and diagnostics passed 9/9; the complete framework
  passed 77/77 with fifteen nested steps; independent checking passed 11/11;
  planning passed 10/10; project creation passed 9/9; repository governance
  passed 9/9; website structure passed 16/16; links passed 1/1; React passed
  8/8; TypeScript and production build passed; Playwright and Axe passed 66/66
  across Chromium, Firefox, and WebKit; `git diff --check` passed.
- Residual risks: SH-F013, SH-F015, and SH-F016 remain unimplemented, so their
  predeclared `deploy`, `dev`, and `test` adapters fail closed with versioned
  diagnostics. The canonical SH-F008 `check` adapter requires a host-supplied
  normalized repository-evidence loader and fails closed when one is absent;
  it does not fabricate or trust self-certified verification evidence.

### Delivery

- Status: not applicable; no commit, push, publication, deployment, or external
  mutation was authorized or attempted.
