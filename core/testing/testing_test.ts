import { platform } from "#platform";
import assert from "assert/strict";
import { z } from "zod";

import type { NormalizedRoute, RouteOperation } from "../routing/mod.ts";
import { defineSecurity, type RouteSecurity } from "../security/mod.ts";
import {
  classifyRedState,
  createCriterionRegistry,
  createTestApplication,
  createTestManifest,
  createTraceabilityReport,
  type RequirementEvidence,
  selectAffectedTests,
  TestingError,
  type TestManifest,
} from "./mod.ts";

function requirement(
  id: string,
  criteria: readonly string[],
  status: "draft" | "approved" | "verified" = "approved",
  dependsOn: readonly string[] = [],
): RequirementEvidence {
  const digest = `${id}-digest`;
  return {
    id,
    status,
    governedContentDigest: digest,
    dependsOn,
    criteria: criteria.map((criterionId) => ({ id: criterionId })),
    approval: status === "draft"
      ? undefined
      : { valid: true, digest, criteria },
  };
}

const approved = requirement("bookmarks", [
  "AC-BOOKMARKS-001",
  "AC-BOOKMARKS-002",
]);

function descriptorFixture() {
  const registered: platform.TestDefinition[] = [];
  const registry = createCriterionRegistry({
    requirements: [approved],
    register: (definition) => registered.push(definition),
  });
  const first = registry.criterionTest({
    id: "bookmarks.list",
    requirementId: "bookmarks",
    criteria: ["AC-BOOKMARKS-001"],
    name: "lists bookmarks",
    sourcePath: "api/bookmarks/route.test.ts",
    fn: () => {},
  });
  const second = registry.criterionTest({
    id: "bookmarks.create",
    requirementId: "bookmarks",
    criteria: ["AC-BOOKMARKS-002"],
    name: "creates a bookmark",
    sourcePath: "api/bookmarks/route.test.ts",
    fn: () => {},
  });
  return { registered, registry, first, second };
}

test("AC-F007-001 · draft and stale approvals refuse criterion tests", () => {
  for (
    const candidate of [
      requirement("draft-bookmarks", ["AC-DRAFT-001"], "draft"),
      {
        ...requirement("stale-bookmarks", ["AC-STALE-001"]),
        approval: {
          valid: false,
          digest: "old-digest",
          criteria: ["AC-STALE-001"],
        },
      },
    ]
  ) {
    const registry = createCriterionRegistry({
      requirements: [candidate],
      register: () => {},
    });
    assert.throws(
      () =>
        registry.criterionTest({
          id: `${candidate.id}.test`,
          requirementId: candidate.id,
          criteria: [candidate.criteria[0].id],
          name: "must not register",
          sourcePath: "route.test.ts",
          fn: () => {},
        }),
      (error) =>
        error instanceof TestingError &&
        error.diagnostics.some((item) =>
          item.code === "SH_TEST_REQUIREMENT_NOT_APPROVED" &&
          item.message.includes(candidate.status)
        ),
    );
  }
});

test("AC-F007-002 · native names and manifests expose every mapping", () => {
  const { registered, registry, first } = descriptorFixture();
  assert.match(registered[0].name, /AC-BOOKMARKS-001.*lists bookmarks/);
  assert.deepEqual(first.criteria, ["AC-BOOKMARKS-001"]);
  assert.equal(Object.isFrozen(first), true);
  const manifest = createTestManifest({
    descriptors: registry.descriptors(),
    sources: {
      "api/bookmarks/route.test.ts": "criterionTest({ id: 'bookmarks' })\n",
    },
  });
  assert.deepEqual(
    manifest.tests.flatMap((test) => test.criteria).sort(),
    ["AC-BOOKMARKS-001", "AC-BOOKMARKS-002"],
  );
  assert.match(manifest.tests[0].sourceDigest, /^[a-f0-9]{64}$/);
});

test("AC-F007-003 · reports all trace states and selects affected tests safely", async (test) => {
  await test.step("traceability categories", () => {
    const { registry } = descriptorFixture();
    const extraRequirement = requirement("collections", ["AC-COLLECTIONS-001"]);
    const manifest = createTestManifest({
      descriptors: registry.descriptors(),
      sources: { "api/bookmarks/route.test.ts": "current test source" },
    });
    const report = createTraceabilityReport({
      requirements: [approved, extraRequirement],
      manifest: {
        ...manifest,
        tests: [...manifest.tests, {
          ...manifest.tests[0],
          id: "unknown.behavior",
          requirementId: "bookmarks",
          criteria: ["AC-UNKNOWN-001"],
        }],
      },
      results: [
        { testId: "bookmarks.list", status: "passed" },
        { testId: "bookmarks.create", status: "failed" },
        { testId: "unknown.behavior", status: "skipped" },
      ],
    });
    assert.deepEqual(report.passingCriteria, ["AC-BOOKMARKS-001"]);
    assert.deepEqual(report.failingCriteria, ["AC-BOOKMARKS-002"]);
    assert.deepEqual(report.unmappedCriteria, ["AC-COLLECTIONS-001"]);
    assert.deepEqual(report.unmappedTests, ["unknown.behavior"]);
  });

  await test.step("targeting closes both dependency directions", () => {
    const selection = selectAffectedTests({
      targets: ["bookmarks"],
      requirements: [
        { id: "model", dependsOn: [] },
        { id: "bookmarks", dependsOn: ["model"] },
        { id: "collections", dependsOn: ["bookmarks"] },
      ],
      tests: [
        { id: "model.test", requirementId: "model" },
        { id: "bookmarks.test", requirementId: "bookmarks" },
        { id: "collections.test", requirementId: "collections" },
      ],
    });
    assert.equal(selection.mode, "targeted");
    assert.deepEqual(selection.requirementIds, [
      "bookmarks",
      "collections",
      "model",
    ]);
    assert.deepEqual(selection.testIds, [
      "bookmarks.test",
      "collections.test",
      "model.test",
    ]);
    const escalated = selectAffectedTests({
      targets: ["bookmarks"],
      requirements: [{ id: "bookmarks", dependsOn: ["missing-model"] }],
      tests: [{ id: "bookmarks.test", requirementId: "bookmarks" }],
    });
    assert.equal(escalated.mode, "full");
  });
});

test("AC-F007-004 · expected missing behavior produces bounded red evidence", () => {
  const result = classifyRedState({
    requirement: approved,
    baselineChecks: [
      { id: "typecheck", kind: "type", status: "passed" },
      { id: "startup", kind: "startup", status: "passed" },
    ],
    tests: [
      {
        testId: "bookmarks.list",
        criterionIds: ["AC-BOOKMARKS-001"],
        testDigest: "test-digest-1",
        status: "failed",
        failureKind: "missing-behavior",
        evidence: "Expected 200 but received 404",
        expectedReason: "The bookmarks route is not implemented.",
      },
      {
        testId: "bookmarks.create",
        criterionIds: ["AC-BOOKMARKS-002"],
        testDigest: "test-digest-2",
        status: "failed",
        failureKind: "missing-behavior",
        evidence: "Expected stored value but none exists",
        expectedReason: "Bookmark persistence is not implemented.",
      },
    ],
    baselineRevision: "baseline-revision",
    runner: "node 24",
    environment: "test/macos-arm64",
  });
  assert.equal(result.kind, "expected-red");
  assert.equal(result.valid, true);
  assert.equal(result.requirementDigest, "bookmarks-digest");
  assert.deepEqual(result.criteria, ["AC-BOOKMARKS-001", "AC-BOOKMARKS-002"]);
});

test("AC-F007-005 · unrelated baseline failure cannot become red evidence", () => {
  const result = classifyRedState({
    requirement: approved,
    baselineChecks: [{
      id: "startup",
      kind: "startup",
      status: "failed",
      evidence: "Configuration is malformed.",
    }],
    tests: [],
    baselineRevision: "broken-revision",
    runner: "node 24",
    environment: "test/macos-arm64",
  });
  assert.equal(result.kind, "broken-baseline");
  assert.equal(result.valid, false);
  assert.ok(
    result.diagnostics.some((item) => item.code === "SH_TEST_BASELINE_BROKEN"),
  );
});

test("AC-F007-006 · test applications isolate SQLite and clean up deterministically", async () => {
  let cleanupCount = 0;
  const first = await createTestApplication({
    create: () => ({
      fetch: () => new Response("ok"),
    }),
    seed: async ({ database }) => {
      database.client.exec("CREATE TABLE state (value TEXT NOT NULL)");
      database.client.prepare("INSERT INTO state (value) VALUES (?)").run("first");
    },
    cleanup: () => {
      cleanupCount += 1;
    },
  });
  const second = await createTestApplication({
    create: () => ({ fetch: () => new Response("ok") }),
  });
  assert.equal(first.database.client.prepare("SELECT value FROM state").get()?.value, "first");
  assert.throws(() => second.database.client.prepare("SELECT value FROM state").get(), /no such table/);
  await first.close();
  await first.close();
  await second.close();
  assert.equal(cleanupCount, 1);

  // Setup failure must close every resource it already opened. Supplying
  // neither an application factory nor a route inventory fails after the SQLite
  // context is open but before any application exists. platform's resource
  // sanitizer fails this test if that context is not closed on the way out.
  await assert.rejects(
    () =>
      createTestApplication(
        {} as unknown as Parameters<typeof createTestApplication>[0],
      ),
    (error: unknown) =>
      error instanceof TestingError &&
      error.diagnostics.some((item) =>
        item.code === "SH_TEST_APPLICATION_SOURCE_REQUIRED"
      ),
  );
});

test("AC-F007-007 · typed requests, fixtures, seeding, and Problem Details compose", async () => {
  const context = await createTestApplication({
    principal: { id: "user-1" },
    credentials: { token: "fixture-token" },
    create: ({ principal, credentials }) => ({
      fetch: async (request) => {
        if (new URL(request.url).pathname === "/problem") {
          return Response.json({
            type: "https://sleepyhollow.dev/problems/invalid",
            title: "Invalid request",
            status: 400,
            field: "url",
          }, {
            status: 400,
            headers: { "content-type": "application/problem+json" },
          });
        }
        const body = await request.json();
        return Response.json({ body, principal, credentials });
      },
    }),
  });
  const result = await context.request<
    { title: string },
    {
      body: { title: string };
      principal: { id: string };
      credentials: { token: string };
    }
  >({ path: "/echo", method: "POST", body: { title: "Typed" } });
  assert.equal(result.body.body.title, "Typed");
  assert.equal(result.body.principal.id, "user-1");
  assert.equal(result.body.credentials.token, "fixture-token");
  const problem = await context.assertProblem(
    await context.fetch("/problem"),
    {
      status: 400,
      type: "https://sleepyhollow.dev/problems/invalid",
      title: "Invalid request",
      extensions: { field: "url" },
    },
  );
  assert.equal(problem.field, "url");
  await context.close();
});

test("AC-F007-008 · generated clients use the in-process application transport", async () => {
  const context = await createTestApplication({
    create: () => ({
      fetch: (request) =>
        Response.json({ path: new URL(request.url).pathname }),
    }),
  });
  const generatedClient = async (transport: typeof context.fetch) => {
    const response = await transport("/client/bookmarks");
    return await response.json() as { path: string };
  };
  assert.deepEqual(await generatedClient(context.fetch), {
    path: "/client/bookmarks",
  });
  await context.close();
});

test("AC-F007-009 · removed, changed, or weakened tests invalidate silent verification", () => {
  const { registry } = descriptorFixture();
  const current = createTestManifest({
    descriptors: registry.descriptors().slice(0, 1),
    sources: { "api/bookmarks/route.test.ts": "weakened source" },
  });
  const previous: TestManifest = {
    schema: "sleepy-hollow-test-manifest/v1",
    tests: [
      { ...current.tests[0], sourceDigest: "prior-digest" },
      {
        ...current.tests[0],
        id: "bookmarks.create",
        criteria: ["AC-BOOKMARKS-002"],
        sourceDigest: "prior-create-digest",
      },
    ],
  };
  const report = createTraceabilityReport({
    requirements: [approved],
    manifest: current,
    previousManifest: previous,
    results: [{ testId: "bookmarks.list", status: "passed" }],
  });
  assert.deepEqual(report.removedTests, ["bookmarks.create"]);
  assert.deepEqual(report.changedTests, ["bookmarks.list"]);
  assert.equal(report.eligibleForVerification, false);
});

test("AC-F007-010 · verification eligibility requires every criterion to pass", () => {
  const { registry } = descriptorFixture();
  const manifest = createTestManifest({
    descriptors: registry.descriptors(),
    sources: { "api/bookmarks/route.test.ts": "complete source" },
  });
  const incomplete = createTraceabilityReport({
    requirements: [approved],
    manifest,
    results: [{ testId: "bookmarks.list", status: "passed" }],
  });
  assert.equal(incomplete.eligibleForVerification, false);
  const complete = createTraceabilityReport({
    requirements: [approved],
    manifest,
    results: [
      { testId: "bookmarks.list", status: "passed" },
      { testId: "bookmarks.create", status: "passed" },
    ],
  });
  assert.equal(complete.eligibleForVerification, true);
});

const okSchema = z.strictObject({ ok: z.boolean() });
const problemSchema = z.strictObject({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  instance: z.string(),
});

function securedRoute(
  security: RouteSecurity,
  handler: () => Response,
  responses: Readonly<Record<number, z.ZodType | null>> = { 200: okSchema },
): NormalizedRoute {
  return {
    method: "GET",
    path: "/bookmarks",
    source: "api/bookmarks/route.ts",
    parameterNames: [],
    operation: {
      schemas: { responses },
      security,
      contract: { summary: "List bookmarks" },
      handler: handler as RouteOperation["handler"],
    },
  };
}

test("AC-F007-011 · a protected route rejects an uncredentialed test request", async () => {
  let handlerCalls = 0;
  const context = await createTestApplication({
    routes: [
      securedRoute({
        authentication: {
          mode: "required",
          provider: "project-auth",
          requirementId: "AC-APP-014",
        },
      }, () => {
        handlerCalls += 1;
        return Response.json({ ok: true });
      }, { 200: okSchema, 401: problemSchema }),
    ],
    security: {
      root: "/projects/bookmarks",
      securityModule: "security.ts",
      load: () =>
        Promise.resolve({
          default: defineSecurity({
            providers: {
              "project-auth": {
                challenge: "Bearer realm=project",
                authenticate: (request: Request) =>
                  Promise.resolve(
                    request.headers.get("authorization") === "Bearer good"
                      ? { id: "user-1", type: "project-user" }
                      : null,
                  ),
              },
            },
          }),
        }),
    },
  });

  const rejected = await context.fetch("/bookmarks");
  await context.assertProblem(rejected, { status: 401 });
  assert.equal(
    rejected.headers.get("www-authenticate"),
    "Bearer realm=project",
  );
  assert.equal(handlerCalls, 0);

  const accepted = await context.fetch("/bookmarks", {
    headers: { authorization: "Bearer good" },
  });
  assert.equal(accepted.status, 200);
  assert.equal(handlerCalls, 1);
  await context.close();
});

test("AC-F007-012 · an undeclared security module serves open routes unchanged", async () => {
  let handlerCalls = 0;
  const context = await createTestApplication({
    routes: [
      securedRoute({ authentication: { mode: "none" } }, () => {
        handlerCalls += 1;
        return Response.json({ ok: true });
      }),
    ],
    security: { root: "/projects/bookmarks" },
  });

  const response = await context.fetch("/bookmarks");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(handlerCalls, 1);
  await context.close();
});
