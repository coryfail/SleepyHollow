import { platform } from "#platform";
import assert from "assert/strict";

import type { CheckResult } from "../../cli/check/mod.ts";
import type { RedStateResult } from "../../core/testing/mod.ts";
import {
  auditSkillInstructions,
  authorizeArtifactCreation,
  authorizeDeployment,
  authorizeImplementation,
  authorizeRepair,
  buildCompletionReport,
  concludeVerification,
  deriveDiscoveryQuestions,
  MANDATORY_CONSTRAINTS,
  SkillError,
  validateAuthenticationPlan,
  validateCodeQualityVerification,
  validatePersistencePlan,
} from "./mod.ts";
import type {
  AuthenticationPlan,
  CodeQualityVerification,
  EndpointWorkRequest,
  PersistencePlan,
  ProjectInspection,
} from "./types.ts";

function inspection(
  overrides: Partial<ProjectInspection> = {},
): ProjectInspection {
  return {
    path: "./bookmarks",
    exists: true,
    resolvedTopics: [],
    declaredServices: [],
    ...overrides,
  };
}

function redState(overrides: Partial<RedStateResult> = {}): RedStateResult {
  return {
    kind: "expected-red",
    valid: true,
    requirementId: "EP-BOOKMARKS-CREATE",
    requirementDigest: "sha256:abc",
    baselineRevision: "96670b3",
    runner: "vitest",
    environment: "node 24 macos-arm64",
    criteria: ["AC-EP-001"],
    tests: [],
    diagnostics: [],
    ...overrides,
  };
}

function work(
  overrides: Partial<EndpointWorkRequest> = {},
): EndpointWorkRequest {
  return {
    requirementId: "EP-BOOKMARKS-CREATE",
    path: "api/bookmarks",
    status: "approved",
    approvalValid: true,
    approvedCriteria: ["AC-EP-001"],
    mappedCriteria: ["AC-EP-001"],
    ...overrides,
  };
}

function checkResult(ok: boolean): CheckResult {
  return {
    schema: "sleepy-hollow-check-result/v1",
    ok,
    command: "check",
    projectRoot: "./bookmarks",
    requestedScope: { kind: "full" },
    effectiveScope: "full",
    selectedRequirements: ["EP-BOOKMARKS-CREATE"],
    selectedTests: ["T-001"],
    checks: [],
    diagnostics: [],
    summary: {
      passed: ok ? 11 : 10,
      failed: ok ? 0 : 1,
      skipped: 0,
      errors: ok ? 0 : 1,
      warnings: 0,
    },
  };
}

function authenticationPlan(
  overrides: Partial<AuthenticationPlan> = {},
): AuthenticationPlan {
  return {
    required: true,
    actors: ["bookmark owner"],
    trustBoundaries: ["public internet"],
    credential: "token",
    expiration: "24 hours",
    revocation: "token deny list",
    transport: "HTTPS only",
    csrf: "not applicable to bearer tokens",
    unauthenticatedBehavior: "401 with RFC 9457 problem details",
    unauthorizedBehavior: "403 with RFC 9457 problem details",
    ...overrides,
  };
}

function persistencePlan(
  overrides: Partial<PersistencePlan> = {},
): PersistencePlan {
  return {
    durableData: true,
    orm: "drizzle",
    adapter: "postgres",
    ...overrides,
  };
}

function codeQuality(
  overrides: Partial<CodeQualityVerification> = {},
): CodeQualityVerification {
  return {
    formatter: "passed",
    linter: "passed",
    ...overrides,
  };
}

function codes(error: unknown): readonly string[] {
  assert.ok(error instanceof SkillError);
  return error.diagnostics.map((diagnostic) => diagnostic.code);
}

function caught(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  assert.fail("Expected the call to throw a SkillError.");
}

test("AC-F009-001 · discovery asks only unresolved material questions", () => {
  const asked = deriveDiscoveryQuestions(
    inspection({ resolvedTopics: ["persistence", "authentication"] }),
    "A service that saves bookmarks for signed-in people.",
  );
  const topics = asked.map((question) => question.topic);
  assert.ok(topics.length > 0);
  assert.ok(!topics.includes("persistence"));
  assert.ok(!topics.includes("authentication"));
  assert.ok(topics.includes("authorization"));
  for (const question of asked) {
    assert.ok(question.rationale.length > 0);
  }
});

test("AC-F009-002 · endpoint artifacts require completed application review", () => {
  assert.throws(
    () =>
      authorizeArtifactCreation("discovery", [
        "api/bookmarks/bookmarks.req.md",
      ]),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_APPLICATION_REVIEW_REQUIRED"),
  );
  authorizeArtifactCreation("decomposition", [
    "api/bookmarks/bookmarks.req.md",
  ]);
});

test("AC-F009-003 · decomposition proposes requirements without endpoint code", () => {
  assert.throws(
    () =>
      authorizeArtifactCreation("decomposition", [
        "api/bookmarks/bookmarks.req.md",
        "api/bookmarks/route.ts",
      ]),
    (error: unknown) => codes(error).includes("SH_SKILL_PREMATURE_CODE"),
  );
});

test("AC-F009-004 · one endpoint approval does not authorize another", () => {
  assert.throws(
    () =>
      authorizeImplementation(
        work({ requirementId: "EP-BOOKMARKS-LIST", approvalValid: false }),
        redState({ requirementId: "EP-BOOKMARKS-LIST" }),
      ),
    (error: unknown) => codes(error).includes("SH_SKILL_APPROVAL_REQUIRED"),
  );
});

test("AC-F009-005 · implementation requires approval and expected red state", () => {
  authorizeImplementation(work(), redState());
  assert.throws(
    () => authorizeImplementation(work(), undefined),
    (error: unknown) => codes(error).includes("SH_SKILL_RED_STATE_REQUIRED"),
  );
  assert.throws(
    () => authorizeImplementation(work({ mappedCriteria: [] }), redState()),
    (error: unknown) => codes(error).includes("SH_SKILL_CRITERION_UNMAPPED"),
  );
});

test("AC-F009-006 · broken baseline is reported instead of treated as red", () => {
  const reported = codes(caught(() =>
    authorizeImplementation(
      work(),
      redState({ kind: "broken-baseline", valid: false }),
    )
  ));
  assert.ok(reported.includes("SH_SKILL_BASELINE_BROKEN"));
  assert.ok(!reported.includes("SH_SKILL_RED_STATE_REQUIRED"));
});

test("AC-F009-007 · bounded repair rejects approved-behavior change", () => {
  authorizeRepair({
    requirementId: "EP-BOOKMARKS-CREATE",
    changedFiles: ["api/bookmarks/route.ts"],
    changesApprovedBehavior: false,
    weakensMappedTests: false,
  });
  assert.throws(
    () =>
      authorizeRepair({
        requirementId: "EP-BOOKMARKS-CREATE",
        changedFiles: ["api/bookmarks/route.ts"],
        changesApprovedBehavior: true,
        weakensMappedTests: false,
      }),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_BEHAVIOR_CHANGE_REQUIRES_REVIEW"),
  );
  assert.throws(
    () =>
      authorizeRepair({
        requirementId: "EP-BOOKMARKS-CREATE",
        changedFiles: ["api/bookmarks/route_test.ts"],
        changesApprovedBehavior: false,
        weakensMappedTests: true,
      }),
    (error: unknown) => codes(error).includes("SH_SKILL_TEST_WEAKENED"),
  );
});

test("AC-F009-008 · verification requires passing independent check evidence", () => {
  assert.equal(
    concludeVerification(checkResult(true), codeQuality()),
    "verified",
  );
  assert.throws(
    () => concludeVerification(undefined, codeQuality()),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_CHECK_EVIDENCE_REQUIRED"),
  );
  assert.throws(
    () => concludeVerification(checkResult(false), codeQuality()),
    (error: unknown) => codes(error).includes("SH_SKILL_CHECK_FAILED"),
  );
});

test("AC-F009-013 · durable persistence defaults to Drizzle", () => {
  validatePersistencePlan(persistencePlan());
  validatePersistencePlan(persistencePlan({
    durableData: false,
    orm: "none",
    adapter: undefined,
  }));
  assert.throws(
    () => validatePersistencePlan(persistencePlan({ orm: "alternative" })),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_DRIZZLE_REQUIRED"),
  );
  assert.throws(
    () =>
      validatePersistencePlan(persistencePlan({
        orm: "alternative",
        humanApprovedAlternative: true,
      })),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_PERSISTENCE_APPROVAL_SOURCE_REQUIRED"),
  );
  validatePersistencePlan(persistencePlan({
    orm: "alternative",
    humanApprovedAlternative: true,
    approvalSource: "Owner explicitly approved Prisma for this application.",
  }));
});

test("AC-F009-014 · verification requires formatter and linter evidence", () => {
  validateCodeQualityVerification(codeQuality());
  assert.throws(
    () => validateCodeQualityVerification(codeQuality({ formatter: "not-run" })),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_FORMAT_CHECK_REQUIRED"),
  );
  assert.throws(
    () => concludeVerification(checkResult(true), codeQuality({ linter: "failed" })),
    (error: unknown) => codes(error).includes("SH_SKILL_LINT_FAILED"),
  );
});

test("AC-F009-015 AC-F009-016 AC-F009-017 · model ownership standards are primary", () => {
  assert.ok(MANDATORY_CONSTRAINTS.includes(
    "Put every model in `models/<model>/` with its own governed `<model>.req.md`, `schema.ts`, `repository.ts`, and `types.ts`.",
  ));
  assert.ok(MANDATORY_CONSTRAINTS.includes(
    "Keep database access inside model repositories and out of route handlers.",
  ));
});

test("AC-F009-018 · AI and human application code share one engineering standard", async () => {
  assert.ok(MANDATORY_CONSTRAINTS.includes(
    "Apply the same application engineering standard to AI-generated and human-authored code.",
  ));
  const standard = await platform.readTextFile(
    new URL("./references/code-quality.md", import.meta.url),
  );
  assert.match(standard, /canonical code standard/);
  assert.match(standard, /no more than four parameters/);
  assert.match(standard, /no more\s+than 40 executable lines/);
  assert.match(standard, /cyclomatic complexity no greater than 10/);
  assert.match(standard, /control\s+flow nested no deeper than three levels/);
  assert.match(standard, /structured logger rather than `console`/);
});

test("AC-F009-009 · authentication planning records every mandatory element", () => {
  validateAuthenticationPlan(authenticationPlan());
  validateAuthenticationPlan({
    required: false,
    actors: ["anonymous reader"],
    trustBoundaries: ["public internet"],
    credential: "none",
  });
  const reported = codes(
    caught(() =>
      validateAuthenticationPlan(authenticationPlan({
        expiration: undefined,
        revocation: undefined,
        unauthorizedBehavior: undefined,
      }))
    ),
  );
  assert.ok(reported.includes("SH_SKILL_AUTH_EXPIRATION_MISSING"));
  assert.ok(reported.includes("SH_SKILL_AUTH_REVOCATION_MISSING"));
  assert.ok(reported.includes("SH_SKILL_AUTH_FORBIDDEN_BEHAVIOR_MISSING"));
});

test("AC-F009-010 · first external deployment requires explicit confirmation", () => {
  authorizeDeployment({
    target: "fly:bookmarks",
    firstExternalDeployment: true,
    materiallyRisky: false,
    confirmed: true,
    confirmationSource: "owner approval in session",
  });
  assert.throws(
    () =>
      authorizeDeployment({
        target: "fly:bookmarks",
        firstExternalDeployment: true,
        materiallyRisky: false,
        confirmed: false,
      }),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_DEPLOY_CONFIRMATION_REQUIRED"),
  );
  assert.throws(
    () =>
      authorizeDeployment({
        target: "fly:bookmarks",
        firstExternalDeployment: false,
        materiallyRisky: true,
        confirmed: true,
      }),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_DEPLOY_CONFIRMATION_SOURCE_REQUIRED"),
  );
});

test("AC-F009-011 · completion reporting covers criteria, evidence, and risks", () => {
  const report = buildCompletionReport({
    requirementId: "EP-BOOKMARKS-CREATE",
    changedFiles: ["api/bookmarks/route.ts", "api/bookmarks/route_test.ts"],
    approvedCriteria: ["AC-EP-001", "AC-EP-002"],
    mappedCriteria: ["AC-EP-001"],
    redState: redState(),
    check: checkResult(true),
    contractArtifacts: ["generated/openapi.json"],
    deployment: {
      target: "fly:bookmarks",
      url: "https://bookmarks.fly.dev",
      revision: "96670b3",
    },
    residualRisks: ["Retention duration remains unresolved."],
  });
  assert.equal(report.schema, "sleepy-hollow-completion-report/v1");
  assert.deepEqual(report.changedFiles, [
    "api/bookmarks/route.ts",
    "api/bookmarks/route_test.ts",
  ]);
  assert.deepEqual(report.criterionCoverage, [
    { criterionId: "AC-EP-001", covered: true },
    { criterionId: "AC-EP-002", covered: false },
  ]);
  assert.equal(report.verification.status, "passed");
  assert.ok(report.verification.evidence.length > 0);
  assert.deepEqual(report.contractArtifacts, ["generated/openapi.json"]);
  assert.equal(report.deployment?.url, "https://bookmarks.fly.dev");
  assert.deepEqual(report.residualRisks, [
    "Retention duration remains unresolved.",
  ]);
});

test("AC-F009-012 · mandatory constraints stay in the primary skill instructions", async () => {
  const primary = {
    path: "skills/sleepy-hollow/SKILL.md",
    source: await platform.readTextFile(
      new URL("./SKILL.md", import.meta.url),
    ),
  };
  const referencePaths = [
    "planning.md",
    "requirement-format.md",
    "persistence.md",
    "models.md",
    "code-quality.md",
    "tdd.md",
    "security.md",
    "service-design.md",
    "deployment.md",
  ];
  const references = await Promise.all(
    referencePaths.map(async (name) => ({
      path: `skills/sleepy-hollow/references/${name}`,
      source: await platform.readTextFile(
        new URL(`./references/${name}`, import.meta.url),
      ),
    })),
  );
  const audit = auditSkillInstructions(primary, references);
  assert.deepEqual(audit.mandatoryConstraints, MANDATORY_CONSTRAINTS);
  assert.deepEqual(audit.referencePaths, references.map((reference) => reference.path));

  const moved = {
    path: "skills/sleepy-hollow/SKILL.md",
    source: primary.source.replace(MANDATORY_CONSTRAINTS[0], ""),
  };
  assert.throws(
    () => auditSkillInstructions(moved, references),
    (error: unknown) =>
      codes(error).includes("SH_SKILL_CONSTRAINT_NOT_PRIMARY"),
  );
});
