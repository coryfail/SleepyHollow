---
schema: sgad-component/v0.2
id: SH-F016
title: Test command
status: verified
risk: standard
source_sections:
  - "11"
  - "12"
depends_on:
  - SH-F006
  - SH-F007
  - SH-F019
open_decisions:
  - OPEN-006
owners:
  - Sleepy Hollow maintainers
---

# Test command

## Purpose

Give humans and agents one deterministic command for running Sleepy Hollow tests
and reporting their acceptance-criterion coverage.

## In scope

- `hollow test` for the complete application.
- Targeted endpoint or component test selection.
- Isolated test-mode application and Deno KV execution.
- Human and JSON results with criterion mapping.

## Requirements

### Capture during test execution

`hollow test` shall enable SH-F019 runtime evidence capture for the tests it
executes and shall persist the resulting artifact to the project's declared
generated location when the run completes.

Capture shall not change test selection, execution, or reported results. A run
whose tests all pass shall report success whether or not capture observed
anything, because interpreting captured evidence belongs to SH-F008 rather than
to the test command.

A persistence failure shall be reported as a command diagnostic and shall not
be silently discarded, because a missing artifact causes later verification to
fail closed for a reason unrelated to the code under test.

### Invocation and scope

The exact first-release grammar is:

```text
hollow test [--full | --requirement <id> | --route <METHOD> <path>] [--json]
```

No scope flag means full. The three scope forms are mutually exclusive and may
appear once. Requirement IDs shall use the repository's stable identifier
grammar; route methods shall normalize to uppercase and route paths shall be
absolute, must not contain traversal, query, or fragment text, and shall resolve
to exactly one normalized SH-F002 route owner. Unknown, malformed, duplicated,
or incomplete options return usage status `2` before reading the test inventory
or starting a process.

The command shall receive one normalized, versioned test inventory containing
current requirement evidence, the complete dependency graph, route ownership,
the SH-F007 test manifest, exact project-relative test source paths, and each
test's isolation policy. Full scope selects every manifest test. Requirement and
route scopes shall call SH-F007 `selectAffectedTests` and use its deterministic
bidirectional dependency and dependent closure. A valid target shall execute
only tests in that closure. Duplicate or missing identities, ambiguous ownership,
dependency cycles, unowned shared changes, unsafe paths, or incomplete mapping
shall escalate to the complete suite with `SH_TEST_SCOPE_ESCALATED`; targeted
execution shall never guess a narrower set.

### Native runner boundary

The production adapter shall invoke the current Deno executable directly through
`Deno.Command`, never a shell or package-script string. It shall pass sorted,
deduplicated, project-contained test files, frozen and cached dependency flags,
`--no-prompt`, TAP output, and only the bounded read, write, run, environment,
network, and unstable-KV permissions declared by normalized project test
configuration. Write permissions may not include a governed `requirements.md`,
generated contract, repository metadata, or a path outside the project. Test
mode shall be explicit and shall not load production-only credentials.

For a targeted selection, the adapter shall add one anchored escaped filter over
the selected manifest `registeredName` values so an unrelated test sharing a
source file does not run. An empty selection, duplicate registered name, unsafe
source path, oversized filter, unsupported TAP event, runner timeout,
cancellation, output overflow, malformed result, or selected test missing from
runner output shall fail closed with a stable diagnostic. Defaults are a ten-
minute maximum runtime, one MiB total process-output limit, and eight KiB of
redacted failure evidence per test; project configuration may lower but not
raise those limits.

The runner shall set `SLEEPY_HOLLOW_MODE=test` explicitly. Each selected test
shall declare either `isolated` or one named `shared-fixture:<stable-id>` policy.
Isolated tests use SH-F007's `createTestApplication`/in-memory Deno KV boundary
and close it after the test. Shared fixtures are opt-in, may be shared only among
tests with the same declared stable fixture ID, and shall be closed after that
group. Missing or inconsistent isolation metadata fails before execution. The
command shall not infer shared state from file placement or test order.

### Normalized result

The command shall normalize runner evidence before rendering this contract:

```ts
interface TestCommandResult {
  readonly schema: "sleepy-hollow-test-result/v1";
  readonly ok: boolean;
  readonly command: "test";
  readonly requestedScope: Full | Requirement | Route;
  readonly effectiveScope: "full" | "targeted";
  readonly selectedRequirements: readonly string[];
  readonly selectedTests: readonly string[];
  readonly tests: readonly {
    readonly id: string;
    readonly file: string;
    readonly name: string;
    readonly criteria: readonly string[];
    readonly status: "passed" | "failed" | "skipped" | "unmapped";
    readonly durationMs: number | null;
    readonly evidence?: string;
  }[];
  readonly criteria: readonly {
    readonly requirementId: string;
    readonly criterionId: string;
    readonly testIds: readonly string[];
    readonly status: "passing" | "failing" | "skipped" | "unmapped";
  }[];
  readonly diagnostics: readonly TestCommandDiagnostic[];
  readonly summary: {
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
    readonly unmapped: number;
    readonly passingCriteria: number;
    readonly failingCriteria: number;
    readonly skippedCriteria: number;
    readonly unmappedCriteria: number;
    readonly durationMs: number;
  };
  readonly verificationStateChanged: false;
}
```

Tests, criteria, selected IDs, and diagnostics shall have deterministic identity
ordering. An unregistered runner test shall appear as `unmapped`, preserve its
safe file and name, and fail the result. A mapped failure shall name its test ID,
project-relative file, registered name, every criterion ID, bounded redacted
failure evidence, and a correction. Skipped or missing required tests, unmapped
tests or criteria, a nonzero runner, or any failed selected test makes `ok`
false. Zero is returned only when every selected required test and mapped
criterion passes and the runner completed normally.

Human and JSON output shall derive from that same result. Human output shall
group passed, failed, skipped, and unmapped tests and summarize criterion
coverage. JSON output shall emit exactly one object with the schema above.
Credentials, environment values, request or response bodies, absolute host
paths, internal stacks, and unbounded TAP text shall not enter either form.

### Evidence-only lifecycle boundary

`hollow test` is read-only with respect to requirements, approvals, governance
records, generated artifacts, and verification state. A passing run returns test
evidence with `verificationStateChanged: false`; it does not edit a lifecycle
status, write an approval or verification record, or claim eligibility beyond
the reported test and criterion coverage. `hollow check` remains the independent
authority that evaluates test evidence with every other required control.

## Acceptance criteria

- AC-F016-001: `hollow test` runs the complete project test suite in test mode
  with isolated Deno KV state and returns zero only when all required tests pass.
- AC-F016-002: A documented target selects one endpoint or component and its
  required shared test dependencies without running unrelated independent tests.
- AC-F016-003: A failing test returns nonzero and reports its file, test name,
  mapped criterion IDs, and failure evidence.
- AC-F016-004: Human output distinguishes passing, failing, skipped, and unmapped
  tests and summarizes criterion coverage.
- AC-F016-005: `hollow test --json` emits a versioned result containing test
  status, duration, criterion mappings, and diagnostics.
- AC-F016-006: Repeated tests do not share application or Deno KV state unless a
  test explicitly declares a shared fixture.
- AC-F016-007: A passing test run alone does not change a requirement from
  `approved` to `verified`.
- AC-F016-008: `hollow test` persists an SH-F019 capture artifact to the declared
  generated location for a run that executes at least one test.
- AC-F016-009: Enabling capture changes neither test selection, execution, nor
  the reported criterion results for an otherwise identical run.
- AC-F016-010: A capture persistence failure is reported as a command diagnostic
  rather than discarded.

## Out of scope

- Replacing Deno's test runner with a proprietary runner.
- Silently generating or editing acceptance tests.
- Performing contract, security, or deployment verification owned by
  `hollow check`.

## Dependencies and assumptions

OPEN-006 is resolved by SH-F007's deterministic bidirectional dependency closure
and fail-closed full-suite escalation. SH-F006 supplies governed planning and
criterion identities; SH-F007 supplies registration, manifests, isolated test
applications, traceability, and selection. SH-F011 supplies shared CLI selection,
rendering, diagnostics, and exit semantics without owning test rules.

The normalized inventory loader is a host boundary: it may parse supported
repository evidence but may not accept source-authored claims that tests passed.
The native runner result is authoritative for execution status. TAP parsing is
limited to the output emitted by the pinned Deno runner contract and fails on
unknown structural events rather than silently discarding them.

## Acceptance evidence map

| Criterion | Executable evidence required before implementation |
| --- | --- |
| AC-F016-001 | Full-scope native-runner probe, explicit test mode, isolated KV lifecycle, and zero/nonzero outcome cases. |
| AC-F016-002 | Requirement and route targets proving bidirectional closure, exact registered-name filtering, and safe escalation without unrelated tests. |
| AC-F016-003 | Failed TAP test proving bounded evidence plus file, name, test ID, and complete criterion context. |
| AC-F016-004 | Mixed passed, failed, skipped, and unmapped fixture proving grouped human output and criterion totals. |
| AC-F016-005 | Stable v1 JSON shape, deterministic ordering, duration, mappings, diagnostics, and redaction probes. |
| AC-F016-006 | Repeated isolated contexts plus explicit same-fixture sharing and cleanup, with missing or mismatched policy rejection. |
| AC-F016-007 | Before/after governed-file digests proving a passing run cannot mutate approval or verification state. |

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter `status:` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-08T17:34:18Z.
- Approved criteria: AC-F016-001 through AC-F016-010.
- Governed-content digest:
  `sha256:86067cb8f7f84d73bc3a91f9b72390b05fa3efa20ab44bf4c3d4b78e8b75fb13`.
- Decision source: Claude conversation; direct response `Approve` after review
  of capture invocation and artifact persistence during test execution, and the exact governed-content digest.

### Superseded approval

- Status: approved.
- Approver: human-project-owner.
- Approved at: 2026-08-07T19:47:51Z.
- Approved criteria: AC-F016-001 through AC-F016-007.
- Governed-content digest:
  `sha256:71e754f966615cd4cbdee57653610f02aed94e1f85bb39d51909ee026c105d07`.
- Decision source: Codex conversation; direct response `Approve` after review of
  the requirement path, bounded criteria, standard-risk classification, verified
  SH-F006 and SH-F007 dependencies, resolved OPEN-006 closure, fixed command
  grammar, bounded native Deno runner, TAP result contract, isolation policy,
  evidence-only lifecycle boundary, and exact governed-content digest.

### Criterion mapping

- Status: mapped to executable tests before implementation.
- AC-F016-001 through AC-F016-007 map one-to-one to the correspondingly named
  tests in `cli/test/test_test.ts`.
- Governed test digest:
  `sha256:575610f9aa3a7196298adfdfd4f4ffe7efad165fe82c8b4383ef33084da01bc0`.

### Red-state evidence

- Status: credible red state captured.
- Captured at: 2026-08-07T19:51:13Z.
- Base revision: `71b3e4debe8e924b6c9d61d5cc663a5690de98be` plus the approved
  SH-F016 requirement, mapped test-command tests, Deno task configuration, and
  the previously verified working tree.
- Test digest:
  `sha256:575610f9aa3a7196298adfdfd4f4ffe7efad165fe82c8b4383ef33084da01bc0`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- `deno task check:test-command` passed.
- `deno task test:test-command` executed all seven mapped tests; all seven failed
  only at the explicit `SH_TEST_COMMAND_NOT_IMPLEMENTED` boundary in
  `cli/test/mod.ts`, with no fixture, compilation, dependency, permission, or
  unrelated infrastructure failure.

### Verification, capture amendment

- Status: passed for all ten approved criteria.
- Verified at: 2026-08-08T17:42:16Z.
- Command: `deno task verify:test-command`.
- Result: `10 passed | 0 failed`.
- Criterion mapping: AC-F016-008 -> capture-path persistence test;
  AC-F016-009 -> capture-invariance comparison test; AC-F016-010 -> missing
  artifact diagnostic test.
- Red state: `0 passed | 3 failed` for the three new criteria against a healthy
  typed baseline before implementation.
- Test correction: AC-F016-009 first asserted a specific exit code, which
  assumed a fixture outcome rather than testing the approved invariant. It was
  rewritten to compare a run whose artifact was persisted against one whose was
  not, asserting identical exit code, result, selection, criteria, and summary,
  and that the only difference is the capture diagnostic. The corrected test is
  strictly stronger.
- Interpretation recorded: `hollow test` runs tests in a subprocess, so the
  command cannot hold capture records itself. It resolves the artifact path,
  supplies it to the runner, and confirms persistence afterward, reporting a
  diagnostic when no artifact was written. Project test setup performs the
  write. This satisfies the approved intent that a run leaves observed evidence
  without abandoning subprocess isolation.
- Residual risk: a generated project does not yet scaffold capture-aware test
  setup, so a fresh `hollow create` project produces no artifact until SH-F001
  is amended to scaffold it.

### Verification, superseded

- Status: superseded. The verification recorded below predates the capture-invocation amendment approved at 2026-08-08T17:34:18Z and no
  longer covers the approved criteria. It must be re-run before this component
  is treated as verified again.

### Verification

- Status: passed.
- Verified at: 2026-08-07T20:04:23Z.
- Requirement digest:
  `sha256:71e754f966615cd4cbdee57653610f02aed94e1f85bb39d51909ee026c105d07`.
- Implementation manifest digest:
  `sha256:2ef18e0a87b35ed34b22b940fcf9a60032ae97c11c7846cff2ab6502820a6aad`
  across the sorted production files in `cli/test/`, `cli/adapters.ts`,
  `deno.json`, and `.github/workflows/website-pages.yml`.
- Test digest:
  `sha256:575610f9aa3a7196298adfdfd4f4ffe7efad165fe82c8b4383ef33084da01bc0`.
- Dependency-lock digest:
  `sha256:b7b0409bba98389242b2fb187b839350a508cc96e21e06b038e04ae0b053d340`.
- Verifier: Deno `2.9.5` format, lint, type, test, native TAP runner probe,
  framework, CLI, checking, planning, and creation tasks plus the canonical
  repository and cross-browser website verifier on macOS arm64.
- Results: the test command passed 7/7, including an exact selected-test probe
  through the native Deno TAP adapter; the complete framework passed 77/77
  with fifteen nested steps; shared CLI passed 9/9; independent checking passed
  11/11; planning passed 10/10; creation passed 9/9; repository governance
  passed 9/9; website structure passed 16/16; links passed 1/1; React passed
  8/8; TypeScript and the production build passed; Playwright and Axe passed
  66/66 across Chromium, Firefox, and WebKit; `git diff --check` passed.
- Residual risks: normalized inventory loading remains an explicit host
  boundary; the production command fails closed with
  `SH_TEST_INVENTORY_LOAD_FAILED` when the host does not supply it. TAP parsing
  intentionally accepts only the pinned Deno runner contract and rejects
  unknown structural events. A passing test result remains evidence-only;
  `hollow check` retains verification authority.

### Delivery

- Status: not applicable; no commit, push, publication, deployment, or external
  mutation was authorized or attempted.
