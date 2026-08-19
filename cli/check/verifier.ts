import { platform } from "#platform";
import { createTraceabilityReport } from "../../core/testing/mod.ts";
import type { TestManifest } from "../../core/testing/mod.ts";
import { resolveScope } from "./scope.ts";
import type {
  CheckDiagnostic,
  CheckLocation,
  CheckPhase,
  CheckResult,
  VerificationCheck,
  VerificationInventory,
} from "./types.ts";

const phaseOrder: readonly CheckPhase[] = [
  "governance",
  "runner",
  "traceability",
  "routes",
  "schemas",
  "security",
  "data",
  "configuration",
  "generated",
  "changes",
  "eligibility",
];

const checkDefinitions: readonly [string, CheckPhase][] = [
  ["SH_CHECK_GOVERNANCE", "governance"],
  ["SH_CHECK_RUNNERS", "runner"],
  ["SH_CHECK_TRACEABILITY", "traceability"],
  ["SH_CHECK_ROUTES", "routes"],
  ["SH_CHECK_SCHEMAS", "schemas"],
  ["SH_CHECK_SECURITY", "security"],
  ["SH_CHECK_DATA", "data"],
  ["SH_CHECK_CONFIGURATION", "configuration"],
  ["SH_CHECK_GENERATED", "generated"],
  ["SH_CHECK_CHANGES", "changes"],
  ["SH_CHECK_ELIGIBILITY", "eligibility"],
];

function safeRunnerEvidence(value: string): string {
  return value.slice(0, 4096).replace(
    /(authorization|token|secret|password|api[-_]?key|cookie|credential)\s*[:=]\s*[^\s,;]+/gi,
    "$1=[REDACTED]",
  );
}

function diagnostic(
  code: string,
  phase: CheckPhase,
  summary: string,
  location: CheckLocation,
  evidence: Readonly<Record<string, unknown>>,
  correction: string,
  severity: "error" | "warning" = "error",
): CheckDiagnostic {
  return { code, severity, phase, summary, location, evidence, correction };
}

function manifestFor(
  manifest: TestManifest | undefined,
  testIds: ReadonlySet<string>,
): TestManifest | undefined {
  return manifest
    ? {
      schema: "sleepy-hollow-test-manifest/v1",
      tests: manifest.tests.filter((test) => testIds.has(test.id)),
    }
    : undefined;
}

function locationKey(location: CheckLocation): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(location).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}

function sortedDiagnostics(
  values: readonly CheckDiagnostic[],
): CheckDiagnostic[] {
  return [...values].sort((left, right) =>
    phaseOrder.indexOf(left.phase) - phaseOrder.indexOf(right.phase) ||
    left.code.localeCompare(right.code) ||
    locationKey(left.location).localeCompare(locationKey(right.location)) ||
    left.summary.localeCompare(right.summary)
  );
}

export function verify(inventory: VerificationInventory): CheckResult {
  const scope = resolveScope(inventory);
  const requirementIds = new Set(scope.requirementIds);
  const testIds = new Set(scope.testIds);
  const requirements = inventory.requirements.filter((item) =>
    requirementIds.has(item.id)
  );
  const routes = inventory.routes.filter((item) =>
    requirementIds.has(item.requirementId)
  );
  const diagnostics: CheckDiagnostic[] = [...scope.diagnostics];

  const allRequirementIds = new Set(
    inventory.requirements.map((item) => item.id),
  );
  if (allRequirementIds.size !== inventory.requirements.length) {
    diagnostics.push(diagnostic(
      "SH_CHECK_REQUIREMENT_DUPLICATE",
      "governance",
      "Requirement IDs are not globally unique",
      { path: inventory.projectRootDisplay },
      { requirementIds: inventory.requirements.map((item) => item.id).sort() },
      "Give every current requirement one globally unique stable ID.",
    ));
  }
  for (const requirement of inventory.dependencyGraph) {
    for (const dependency of requirement.dependsOn) {
      if (allRequirementIds.has(dependency)) continue;
      diagnostics.push(diagnostic(
        "SH_CHECK_DEPENDENCY_UNRESOLVED",
        "governance",
        `${requirement.id} depends on missing requirement ${dependency}`,
        { requirementId: requirement.id },
        { dependency },
        "Restore or correct the approved dependency before verification.",
      ));
    }
  }

  for (const requirement of requirements) {
    const approved = new Set(requirement.approval?.criteria ?? []);
    if (
      requirement.status === "draft" || !requirement.approval?.valid ||
      requirement.approval.digest !== requirement.governedContentDigest ||
      requirement.criteria.some((criterion) => !approved.has(criterion.id))
    ) {
      diagnostics.push(diagnostic(
        "SH_CHECK_APPROVAL_INVALID",
        "governance",
        `${requirement.id} does not have exact current bounded approval`,
        { path: requirement.path, requirementId: requirement.id },
        {
          status: requirement.status,
          currentDigest: requirement.governedContentDigest,
          approvalDigest: requirement.approval?.digest ?? null,
        },
        "Return the current exact requirement and bounded criteria to authorized review.",
      ));
    }
    if (!requirement.redStateValid) {
      diagnostics.push(diagnostic(
        "SH_CHECK_RED_STATE_INVALID",
        "governance",
        `${requirement.id} lacks current credible red-state evidence`,
        { path: requirement.path, requirementId: requirement.id },
        { requirementDigest: requirement.governedContentDigest },
        "Capture missing-behavior red evidence against a healthy baseline before implementation.",
      ));
    }
  }

  if (inventory.typecheck.status === "failed") {
    diagnostics.push(diagnostic(
      "SH_CHECK_TYPECHECK_FAILED",
      "runner",
      "The bounded platform type-check runner failed",
      { path: inventory.projectRootDisplay },
      {
        runner: "tsc",
        result: safeRunnerEvidence(inventory.typecheck.evidence),
      },
      "Correct the reported type errors and rerun the complete applicable check.",
    ));
  }
  if (inventory.testRunner.status === "failed") {
    diagnostics.push(diagnostic(
      "SH_CHECK_TEST_RUNNER_FAILED",
      "runner",
      "The native platform test runner failed",
      { path: inventory.projectRootDisplay },
      {
        runner: "vitest",
        result: safeRunnerEvidence(inventory.testRunner.evidence),
      },
      "Correct the runner or test failure without weakening governed tests.",
    ));
  }

  const currentManifest = manifestFor(inventory.testManifest, testIds)!;
  const trace = createTraceabilityReport({
    requirements,
    manifest: currentManifest,
    results: inventory.testResults.filter((result) =>
      testIds.has(result.testId)
    ),
    previousManifest: manifestFor(inventory.previousTestManifest, testIds),
    reviewedTestIds: inventory.reviewedTestIds,
  });
  for (const criterionId of trace.unmappedCriteria) {
    const requirement = requirements.find((item) =>
      item.criteria.some((criterion) => criterion.id === criterionId)
    );
    diagnostics.push(diagnostic(
      "SH_CHECK_CRITERION_UNMAPPED",
      "traceability",
      `Acceptance criterion ${criterionId} has no governed test`,
      { path: requirement?.path, requirementId: requirement?.id, criterionId },
      { criterionId },
      "Map the approved criterion to at least one stable native test.",
    ));
  }
  for (const criterionId of trace.failingCriteria) {
    const requirement = requirements.find((item) =>
      item.criteria.some((criterion) => criterion.id === criterionId)
    );
    diagnostics.push(diagnostic(
      "SH_CHECK_CRITERION_FAILED",
      "traceability",
      `Acceptance criterion ${criterionId} has a failing mapped test`,
      { path: requirement?.path, requirementId: requirement?.id, criterionId },
      {
        testIds: trace.criteria.find((item) =>
          item.criterionId === criterionId
        )?.testIds ?? [],
      },
      "Fix the implementation while preserving the approved test semantics.",
    ));
  }
  for (const criterionId of trace.skippedCriteria) {
    diagnostics.push(diagnostic(
      "SH_CHECK_CRITERION_SKIPPED",
      "traceability",
      `Acceptance criterion ${criterionId} did not execute successfully`,
      { criterionId },
      { criterionId },
      "Run every selected governed test under its approved bounded permissions.",
    ));
  }
  for (
    const [code, values] of [
      ["SH_CHECK_TEST_UNMAPPED", trace.unmappedTests],
      ["SH_CHECK_TEST_REMOVED", trace.removedTests],
      ["SH_CHECK_TEST_CHANGED", trace.changedTests],
      ["SH_CHECK_TEST_MAPPING_WEAKENED", trace.weakenedMappings],
    ] as const
  ) {
    for (const testId of values) {
      diagnostics.push(diagnostic(
        code,
        "traceability",
        `Governed test evidence is invalid for ${testId}`,
        {
          path: currentManifest.tests.find((item) => item.id === testId)
            ?.sourcePath,
        },
        { testId },
        "Restore the approved mapping or obtain review and fresh red evidence for the changed test.",
      ));
    }
  }

  for (
    const requirement of requirements.filter((item) =>
      item.routePath && item.methods
    )
  ) {
    const expected = new Set(
      requirement.methods!.map((method) =>
        `${method.toUpperCase()} ${requirement.routePath}`
      ),
    );
    const actual = new Set(
      routes.filter((route) => route.requirementId === requirement.id).map((
        route,
      ) => `${route.method} ${route.path}`),
    );
    for (const identity of new Set([...expected, ...actual])) {
      if (expected.has(identity) === actual.has(identity)) continue;
      diagnostics.push(diagnostic(
        "SH_CHECK_ROUTE_DRIFT",
        "routes",
        `${identity} differs between approved requirements and implementation`,
        {
          path: requirement.path,
          route: identity,
          requirementId: requirement.id,
        },
        { expected: expected.has(identity), implemented: actual.has(identity) },
        "Restore the approved route and method or return the requirement to review.",
      ));
    }
  }
  for (const route of inventory.routes) {
    if (allRequirementIds.has(route.requirementId)) continue;
    diagnostics.push(diagnostic(
      "SH_CHECK_ROUTE_DRIFT",
      "routes",
      `${route.method} ${route.path} has no owning approved requirement`,
      { path: route.source, route: `${route.method} ${route.path}` },
      { requirementId: route.requirementId },
      "Add and approve the owning endpoint requirement or remove the implementation-only route.",
    ));
  }
  for (const route of routes) {
    const requestSchemas = new Set(route.requestSchemaLocations);
    for (const field of route.requiredRequestLocations) {
      if (requestSchemas.has(field)) continue;
      diagnostics.push(diagnostic(
        "SH_CHECK_REQUEST_SCHEMA_MISSING",
        "schemas",
        `${route.method} ${route.path} lacks its required ${field} schema`,
        {
          path: route.source,
          route: `${route.method} ${route.path}`,
          requirementId: route.requirementId,
          field,
        },
        { boundary: field },
        "Declare the normalized SH-F003 input schema used by the runtime.",
      ));
    }
    const responseSchemas = new Set(route.responseSchemaStatuses);
    for (const status of route.requiredResponseStatuses) {
      if (responseSchemas.has(status)) continue;
      diagnostics.push(diagnostic(
        "SH_CHECK_RESPONSE_SCHEMA_MISSING",
        "schemas",
        `${route.method} ${route.path} lacks its required ${status} response schema`,
        {
          path: route.source,
          route: `${route.method} ${route.path}`,
          requirementId: route.requirementId,
          field: `responses.${status}`,
        },
        { status },
        "Declare the normalized SH-F003 response schema used by the runtime.",
      ));
    }
    const requirement = requirements.find((item) =>
      item.id === route.requirementId
    );
    if (
      requirement?.requiresAuthorization &&
      (route.authentication !== "required" || !route.authorizationGuard ||
        !route.authorizationRequirementId)
    ) {
      diagnostics.push(diagnostic(
        "SH_CHECK_AUTHORIZATION_MISSING",
        "security",
        `${route.method} ${route.path} lacks its approved authorization guard`,
        {
          path: route.source,
          route: `${route.method} ${route.path}`,
          requirementId: route.requirementId,
        },
        {
          authentication: route.authentication,
          authorizationGuard: route.authorizationGuard ?? null,
          authorizationRequirementId: route.authorizationRequirementId ?? null,
        },
        "Bind the declared neutral authorization guard and requirement ID before the handler.",
      ));
    }
  }

  const capture = inventory.capture;
  if (capture) {
    if (!capture.present || capture.stale || capture.unreadable) {
      diagnostics.push(diagnostic(
        "SH_CHECK_CAPTURE_UNUSABLE",
        "traceability",
        capture.unreadable
          ? "The capture artifact could not be read"
          : capture.stale
          ? "The capture artifact is stale for the revision under verification"
          : "No capture artifact exists for this project",
        { path: "generated/capture.json" },
        {
          present: capture.present,
          stale: capture.stale ?? false,
          unreadable: capture.unreadable ?? false,
        },
        "Run hollow test with capture enabled against the current revision.",
      ));
    }
    for (const route of capture.uncapturedRoutes) {
      if (route.requirementId && !requirementIds.has(route.requirementId)) {
        continue;
      }
      if (route.justification) {
        diagnostics.push(diagnostic(
          "SH_CHECK_ROUTE_UNOBSERVED_ACCEPTED",
          "routes",
          `${route.method} ${route.path} was never observed and is accepted by a recorded justification: ${route.justification}`,
          {
            route: `${route.method} ${route.path}`,
            ...(route.requirementId
              ? { requirementId: route.requirementId }
              : {}),
          },
          { justification: route.justification },
          "Remove the justification once a mapped test exercises the route.",
          "warning",
        ));
        continue;
      }
      diagnostics.push(diagnostic(
        "SH_CHECK_ROUTE_UNOBSERVED",
        "routes",
        `${route.method} ${route.path} carries approved criteria but runtime capture never observed it`,
        {
          route: `${route.method} ${route.path}`,
          ...(route.requirementId
            ? { requirementId: route.requirementId }
            : {}),
        },
        { method: route.method, path: route.path },
        "Exercise the route from a mapped test, or record a justification for the exception.",
      ));
    }
  }

  for (
    const operation of inventory.dataOperations.filter((item) =>
      requirementIds.has(item.requirementId)
    )
  ) {
    const location = {
      path: operation.source,
      requirementId: operation.requirementId,
      operation: operation.id,
    };
    if (operation.kind === "query") {
      if (
        !Number.isSafeInteger(operation.limit) || Number(operation.limit) <= 0
      ) {
        diagnostics.push(diagnostic(
          "SH_CHECK_QUERY_UNBOUNDED",
          "data",
          `${operation.id} has no positive bounded query limit`,
          location,
          { resource: operation.resource, limit: operation.limit ?? null },
          "Use a declared indexed SH-F004 query with a positive bounded limit.",
        ));
      }
      if (
        !operation.index || !operation.declaredIndexes.includes(operation.index)
      ) {
        diagnostics.push(diagnostic(
          "SH_CHECK_INDEX_INCOMPATIBLE",
          "data",
          `${operation.id} does not use a declared compatible index`,
          location,
          {
            index: operation.index ?? null,
            declaredIndexes: operation.declaredIndexes,
          },
          "Declare and use the matching SH-F004 resource index.",
        ));
      }
    }
    if (
      operation.kind === "read-modify-write" &&
      (operation.versionstampCheck !== true || operation.atomic !== true)
    ) {
      diagnostics.push(diagnostic(
        "SH_CHECK_RMW_UNSAFE",
        "data",
        `${operation.id} has unsafe read-modify-write semantics`,
        location,
        {
          atomic: operation.atomic ?? false,
          versionstampCheck: operation.versionstampCheck ?? false,
        },
        "Use one atomic SH-F004 mutation with the observed versionstamp check.",
      ));
    }
    if (operation.kind === "raw" && !operation.rawJustification?.trim()) {
      diagnostics.push(diagnostic(
        "SH_CHECK_RAW_KV_UNJUSTIFIED",
        "data",
        `${operation.id} uses raw KV without approved justification`,
        location,
        { resource: operation.resource },
        "Use the canonical repository or bind raw access to an approved requirement and reason.",
      ));
    }
    if (
      operation.ownerServiceId && operation.requesterServiceId &&
      operation.ownerServiceId !== operation.requesterServiceId
    ) {
      diagnostics.push(diagnostic(
        "SH_CHECK_FOREIGN_KV_ACCESS",
        "data",
        `${operation.requesterServiceId} accesses ${operation.ownerServiceId}'s persistence`,
        location,
        {
          owner: operation.ownerServiceId,
          requester: operation.requesterServiceId,
        },
        "Use the owning service's generated HTTP client.",
      ));
    }
  }

  for (const item of inventory.configurationDiagnostics) {
    diagnostics.push(diagnostic(
      item.code,
      "configuration",
      item.summary,
      { configKey: item.key },
      { key: item.key ?? null },
      item.correction,
    ));
  }
  if (inventory.generation) {
    if (
      !inventory.generation.ok &&
      !inventory.generation.artifacts.some((artifact) => artifact.stale)
    ) {
      diagnostics.push(diagnostic(
        "SH_CHECK_GENERATION_FAILED",
        "generated",
        "Deterministic generated-artifact verification failed",
        { path: "generated" },
        {
          diagnostics: inventory.generation.diagnostics.map((item) => item.code)
            .sort(),
        },
        "Correct the generation diagnostics and rerun hollow generate --check.",
      ));
    }
    for (
      const item of inventory.generation.artifacts.filter((artifact) =>
        artifact.stale
      )
    ) {
      diagnostics.push(diagnostic(
        "SH_CHECK_GENERATED_STALE",
        "generated",
        `${item.path} does not match deterministic regeneration`,
        { path: item.path },
        {
          expectedDigest: item.digest,
          actualDigest: item.actualDigest ?? null,
        },
        "Run hollow generate, review the change, and rerun hollow check.",
      ));
    }
  }
  const reviewedChanges = new Set(
    (inventory.reviewedContractChanges ?? []).filter((item) =>
      item.previousContractDigest === inventory.previousContractDigest &&
      item.currentContractDigest === inventory.currentContractDigest
    ).map((item) => `${item.code}\0${item.operationId}\0${item.element}`),
  );
  for (
    const change of inventory.contractChanges ??
      inventory.generation?.changes ?? []
  ) {
    if (
      change.severity !== "breaking" ||
      reviewedChanges.has(
        `${change.code}\0${change.operationId}\0${change.element}`,
      )
    ) {
      continue;
    }
    diagnostics.push(diagnostic(
      "SH_CHECK_BREAKING_CHANGE_UNREVIEWED",
      "changes",
      `${change.code} affects ${change.method} ${change.path}`,
      {
        path: change.source,
        route: `${change.method} ${change.path}`,
        operation: change.operationId,
      },
      { changeCode: change.code, element: change.element },
      change.guidance,
    ));
  }
  for (const decision of inventory.pendingDataDecisions ?? []) {
    diagnostics.push(diagnostic(
      "SH_CHECK_DATA_DECISION_PENDING",
      "changes",
      decision.summary,
      { requirementId: decision.requirementId },
      { status: "pending" },
      "Review and bind the exact data change before release.",
    ));
  }

  const ordered = sortedDiagnostics(diagnostics);
  const errorsBeforeEligibility =
    ordered.filter((item) => item.severity === "error").length;
  const checks: VerificationCheck[] = checkDefinitions.map(([id, phase]) => {
    const applicable = !(
      (phase === "generated" && !inventory.generation) ||
      (phase === "changes" && !inventory.contractChanges?.length &&
        !inventory.generation?.changes.length &&
        !inventory.pendingDataDecisions?.length)
    );
    const phaseErrors = ordered.filter((item) =>
      item.phase === phase && item.severity === "error"
    );
    return {
      id,
      phase,
      status: phase === "eligibility"
        ? errorsBeforeEligibility === 0 ? "passed" : "failed"
        : !applicable
        ? "skipped"
        : phaseErrors.length
        ? "failed"
        : "passed",
      evidence: phaseErrors.map((item) => item.code).sort(),
    };
  });
  const resultDiagnostics = ordered;
  const ok = resultDiagnostics.every((item) => item.severity !== "error");
  return {
    schema: "sleepy-hollow-check-result/v1",
    ok,
    command: "check",
    projectRoot: inventory.projectRootDisplay,
    requestedScope: inventory.requestedScope,
    effectiveScope: scope.effectiveScope,
    selectedRequirements: scope.requirementIds,
    selectedTests: scope.testIds,
    checks,
    diagnostics: resultDiagnostics,
    summary: {
      passed: checks.filter((item) => item.status === "passed").length,
      failed: checks.filter((item) => item.status === "failed").length,
      skipped: checks.filter((item) => item.status === "skipped").length,
      errors:
        resultDiagnostics.filter((item) => item.severity === "error").length,
      warnings:
        resultDiagnostics.filter((item) => item.severity === "warning").length,
    },
  };
}
