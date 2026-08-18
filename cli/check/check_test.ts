import assert from "node:assert/strict";

import type { ContractChange } from "../generate/mod.ts";
import {
  exitCodeForCheck,
  renderHumanCheckResult,
  renderJsonCheckResult,
  verifyProject,
} from "./mod.ts";
import type { CheckResult, VerificationInventory } from "./types.ts";

function inventory(): VerificationInventory {
  return {
    projectRootDisplay: ".",
    requestedScope: { kind: "full" },
    requirements: [
      {
        id: "REQ-BASE",
        path: "requirements/application.req.md",
        status: "approved",
        governedContentDigest: "base-digest",
        criteria: [{ id: "AC-BASE-001" }],
        approval: {
          valid: true,
          digest: "base-digest",
          criteria: ["AC-BASE-001"],
        },
        redStateValid: true,
      },
      {
        id: "REQ-ITEMS",
        path: "api/items/items.req.md",
        routePath: "/items",
        methods: ["GET"],
        requiresAuthorization: true,
        status: "approved",
        governedContentDigest: "items-digest",
        dependsOn: ["REQ-BASE"],
        criteria: [{ id: "AC-ITEMS-001" }],
        approval: {
          valid: true,
          digest: "items-digest",
          criteria: ["AC-ITEMS-001"],
        },
        redStateValid: true,
      },
    ],
    dependencyGraph: [
      { id: "REQ-BASE", dependsOn: [] },
      { id: "REQ-ITEMS", dependsOn: ["REQ-BASE"] },
    ],
    testManifest: {
      schema: "sleepy-hollow-test-manifest/v1",
      tests: [
        {
          id: "test-base",
          requirementId: "REQ-BASE",
          criteria: ["AC-BASE-001"],
          name: "base",
          registeredName: "AC-BASE-001 · base",
          sourcePath: "tests/base_test.ts",
          sourceDigest: "base-test-digest",
        },
        {
          id: "test-items",
          requirementId: "REQ-ITEMS",
          criteria: ["AC-ITEMS-001"],
          name: "items",
          registeredName: "AC-ITEMS-001 · items",
          sourcePath: "tests/items_test.ts",
          sourceDigest: "items-test-digest",
        },
      ],
    },
    previousTestManifest: {
      schema: "sleepy-hollow-test-manifest/v1",
      tests: [
        {
          id: "test-base",
          requirementId: "REQ-BASE",
          criteria: ["AC-BASE-001"],
          name: "base",
          registeredName: "AC-BASE-001 · base",
          sourcePath: "tests/base_test.ts",
          sourceDigest: "base-test-digest",
        },
        {
          id: "test-items",
          requirementId: "REQ-ITEMS",
          criteria: ["AC-ITEMS-001"],
          name: "items",
          registeredName: "AC-ITEMS-001 · items",
          sourcePath: "tests/items_test.ts",
          sourceDigest: "items-test-digest",
        },
      ],
    },
    testResults: [
      { testId: "test-base", status: "passed" },
      { testId: "test-items", status: "passed" },
    ],
    routes: [{
      requirementId: "REQ-ITEMS",
      method: "GET",
      path: "/items",
      source: "api/items/route.ts",
      requestSchemaLocations: ["query"],
      requiredRequestLocations: ["query"],
      responseSchemaStatuses: [200, 403],
      requiredResponseStatuses: [200, 403],
      authentication: "required",
      authorizationRequirementId: "AC-ITEMS-001",
      authorizationGuard: "read-items",
    }],
    dataOperations: [{
      id: "list-items",
      requirementId: "REQ-ITEMS",
      source: "api/items/route.ts",
      resource: "items",
      kind: "query",
      index: "byOwner",
      declaredIndexes: ["byOwner"],
      limit: 25,
    }],
    typecheck: { status: "passed", evidence: "deno check passed" },
    testRunner: { status: "passed", evidence: "deno test passed" },
    configurationDiagnostics: [],
    generation: {
      ok: true,
      command: "generate",
      schema: "sleepy-hollow-generate-result/v1",
      serviceId: "application",
      inputDigest: "input-digest",
      artifacts: [
        { path: "generated/openapi.json", digest: "openapi", stale: false },
        { path: "generated/client.ts", digest: "client", stale: false },
      ],
      changes: [],
      diagnostics: [],
      wrote: false,
    },
    contractChanges: [],
    reviewedContractChangeCodes: [],
    pendingDataDecisions: [],
    sourceClaims: { passed: true, verified: true },
  };
}

function codes(result: CheckResult): string[] {
  return result.diagnostics.map((item) => item.code);
}

Deno.test("AC-F008-001 · conforming projects pass and required failures are nonzero", () => {
  const passing = verifyProject(inventory());
  assert.equal(passing.ok, true);
  assert.equal(exitCodeForCheck(passing), 0);
  const failing = verifyProject({
    ...inventory(),
    typecheck: { status: "failed", evidence: "type mismatch" },
  });
  assert.equal(failing.ok, false);
  assert.equal(exitCodeForCheck(failing), 1);
});

Deno.test("AC-F008-002 · human diagnostics name affected evidence", () => {
  const result = verifyProject({
    ...inventory(),
    routes: [{ ...inventory().routes[0], method: "POST" }],
  });
  const output = renderHumanCheckResult(result);
  assert.match(output, /SH_CHECK_ROUTE_DRIFT/);
  assert.match(output, /api\/items\/requirements\.md|REQ-ITEMS/);
  assert.match(output, /\/items/);
});

Deno.test("AC-F008-003 · JSON diagnostics use one versioned stable shape", () => {
  const result = verifyProject({
    ...inventory(),
    configurationDiagnostics: [{
      code: "SH_CONFIG_REQUIRED",
      key: "PUBLIC_ORIGIN",
      summary: "Required configuration is absent",
      correction: "Declare the key without placing its value in source.",
    }],
  });
  const parsed = JSON.parse(renderJsonCheckResult(result));
  assert.equal(parsed.schema, "sleepy-hollow-check-result/v1");
  assert.deepEqual(Object.keys(parsed).sort(), [
    "checks",
    "command",
    "diagnostics",
    "effectiveScope",
    "ok",
    "projectRoot",
    "requestedScope",
    "schema",
    "selectedRequirements",
    "selectedTests",
    "summary",
  ]);
  assert.deepEqual(Object.keys(parsed.diagnostics[0]).sort(), [
    "code",
    "correction",
    "evidence",
    "location",
    "phase",
    "severity",
    "summary",
  ]);
  assert.doesNotMatch(JSON.stringify(parsed), /secret-value/);
});

Deno.test("AC-F008-004 · approved route and method drift fails", () => {
  const result = verifyProject({
    ...inventory(),
    routes: [{ ...inventory().routes[0], method: "POST", path: "/renamed" }],
  });
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("SH_CHECK_ROUTE_DRIFT"));
  assert.equal(
    result.diagnostics.find((item) => item.code === "SH_CHECK_ROUTE_DRIFT")
      ?.location.requirementId,
    "REQ-ITEMS",
  );
});

Deno.test("AC-F008-005 · uncovered request and response boundaries fail", () => {
  const result = verifyProject({
    ...inventory(),
    routes: [{
      ...inventory().routes[0],
      requestSchemaLocations: [],
      responseSchemaStatuses: [200],
    }],
  });
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("SH_CHECK_REQUEST_SCHEMA_MISSING"));
  assert.ok(codes(result).includes("SH_CHECK_RESPONSE_SCHEMA_MISSING"));
});

Deno.test("AC-F008-006 · missing mappings and failed tests block eligibility", () => {
  const missing = verifyProject({
    ...inventory(),
    testManifest: { schema: "sleepy-hollow-test-manifest/v1", tests: [] },
    previousTestManifest: undefined,
    testResults: [],
  });
  assert.ok(codes(missing).includes("SH_CHECK_CRITERION_UNMAPPED"));
  const failed = verifyProject({
    ...inventory(),
    testResults: [
      { testId: "test-base", status: "passed" },
      { testId: "test-items", status: "failed", evidence: "assertion failed" },
    ],
  });
  assert.ok(codes(failed).includes("SH_CHECK_CRITERION_FAILED"));
  assert.equal(failed.ok, false);
});

Deno.test("AC-F008-007 · unsafe data operations identify their operation", () => {
  const result = verifyProject({
    ...inventory(),
    dataOperations: [
      {
        ...inventory().dataOperations[0],
        id: "unbounded",
        index: "missing",
        limit: undefined,
      },
      {
        ...inventory().dataOperations[0],
        id: "unsafe-update",
        kind: "read-modify-write",
        versionstampCheck: false,
        atomic: false,
      },
    ],
  });
  assert.ok(codes(result).includes("SH_CHECK_QUERY_UNBOUNDED"));
  assert.ok(codes(result).includes("SH_CHECK_INDEX_INCOMPATIBLE"));
  assert.ok(codes(result).includes("SH_CHECK_RMW_UNSAFE"));
  assert.ok(
    result.diagnostics.every((item) =>
      item.phase !== "data" || item.location.operation
    ),
  );
});

Deno.test("AC-F008-008 · missing declared authorization guard fails", () => {
  const result = verifyProject({
    ...inventory(),
    routes: [{
      ...inventory().routes[0],
      authorizationGuard: undefined,
      authorizationRequirementId: undefined,
    }],
  });
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("SH_CHECK_AUTHORIZATION_MISSING"));
});

Deno.test("AC-F008-009 · stale artifacts and breaking changes fail before release", () => {
  const change: ContractChange = {
    code: "SH_CONTRACT_ROUTE_REMOVED",
    severity: "breaking",
    serviceId: "application",
    operationId: "getItems",
    method: "GET",
    path: "/items",
    element: "route",
    guidance: "Restore or version the route.",
  };
  const base = inventory();
  const result = verifyProject({
    ...base,
    generation: {
      ...base.generation!,
      ok: false,
      artifacts: base.generation!.artifacts.map((item) => ({
        ...item,
        stale: true,
      })),
    },
    contractChanges: [change],
  });
  assert.ok(codes(result).includes("SH_CHECK_GENERATED_STALE"));
  assert.ok(codes(result).includes("SH_CHECK_BREAKING_CHANGE_UNREVIEWED"));
});

Deno.test("AC-F008-010 · targeted scope closes dependencies or escalates safely", () => {
  const targeted = verifyProject({
    ...inventory(),
    requestedScope: { kind: "requirement", requirementId: "REQ-ITEMS" },
  });
  assert.equal(targeted.effectiveScope, "targeted");
  assert.deepEqual(targeted.selectedRequirements, ["REQ-BASE", "REQ-ITEMS"]);
  assert.deepEqual(targeted.selectedTests, ["test-base", "test-items"]);
  const escalated = verifyProject({
    ...inventory(),
    requestedScope: { kind: "route", method: "GET", path: "/items" },
    hasUnownedSharedChange: true,
  });
  assert.equal(escalated.effectiveScope, "full");
  assert.ok(codes(escalated).includes("SH_CHECK_SCOPE_ESCALATED"));
});

Deno.test("AC-F008-011 · source self-certification cannot override fixed failures", () => {
  const result = verifyProject({
    ...inventory(),
    sourceClaims: { passed: true, checks: "all-green", verified: true },
    testRunner: { status: "failed", evidence: "native runner failed" },
  });
  assert.equal(result.ok, false);
  assert.equal(
    result.checks.find((item) => item.id === "SH_CHECK_RUNNERS")?.status,
    "failed",
  );
  assert.ok(codes(result).includes("SH_CHECK_TEST_RUNNER_FAILED"));
});

function captured(
  overrides: Partial<VerificationInventory["capture"] & object> = {},
): VerificationInventory {
  const base = inventory();
  return {
    ...base,
    routes: base.routes.map((route) => ({ ...route, captured: true })),
    capture: { present: true, uncapturedRoutes: [], ...overrides },
  };
}

Deno.test("AC-F008-012 · an unobserved route with approved criteria fails", () => {
  const base = captured();
  const result = verifyProject({
    ...base,
    routes: base.routes.map((route) => ({ ...route, captured: false })),
    capture: {
      present: true,
      uncapturedRoutes: [{
        method: base.routes[0].method,
        path: base.routes[0].path,
        requirementId: base.routes[0].requirementId,
      }],
    },
  });
  assert.equal(result.ok, false);
  const diagnostic = result.diagnostics.find((item) =>
    item.code === "SH_CHECK_ROUTE_UNOBSERVED"
  );
  assert.ok(diagnostic);
  assert.match(renderHumanCheckResult(result), /SH_CHECK_ROUTE_UNOBSERVED/);
});

Deno.test("AC-F008-013 · a criterion verified below the transport boundary does not fail", () => {
  const result = verifyProject(captured());
  assert.equal(result.ok, true);
  assert.ok(
    !result.diagnostics.some((item) =>
      item.code === "SH_CHECK_ROUTE_UNOBSERVED"
    ),
  );
});

Deno.test("AC-F008-014 · a recorded justification accepts an unobserved route", () => {
  const base = captured();
  const result = verifyProject({
    ...base,
    routes: base.routes.map((route) => ({ ...route, captured: false })),
    capture: {
      present: true,
      uncapturedRoutes: [{
        method: base.routes[0].method,
        path: base.routes[0].path,
        requirementId: base.routes[0].requirementId,
        justification: "covered by a contract test outside the transport layer",
      }],
    },
  });
  assert.equal(result.ok, true);
  assert.match(
    renderHumanCheckResult(result),
    /covered by a contract test outside the transport layer/,
  );
});

Deno.test("AC-F008-015 · a missing or stale capture artifact fails verification", () => {
  for (
    const capture of [
      { present: false, uncapturedRoutes: [] },
      { present: true, stale: true, uncapturedRoutes: [] },
      { present: true, unreadable: true, uncapturedRoutes: [] },
    ]
  ) {
    const result = verifyProject({ ...captured(), capture });
    assert.equal(result.ok, false, JSON.stringify(capture));
    assert.ok(
      result.diagnostics.some((item) =>
        item.code === "SH_CHECK_CAPTURE_UNUSABLE"
      ),
    );
  }
});
