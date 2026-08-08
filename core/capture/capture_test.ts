import assert from "node:assert/strict";

import type { NormalizedRoute } from "../routing/mod.ts";
import {
  captureCriterionTest,
  captureRepository,
  captureRoute,
  createCaptureSession,
  persistCaptureSession,
} from "./mod.ts";
import type { CaptureSession } from "./types.ts";

function newSession(): CaptureSession {
  return createCaptureSession({
    runner: "deno test",
    revision: "916d706",
  });
}

interface FakeRepository {
  readonly metadata: { readonly resource: string };
  get(id: string): Promise<{ id: string; versionstamp: string } | null>;
  list(options: { index: string; value: string; limit: number }): Promise<
    { items: readonly string[]; cursor: string | null }
  >;
  update(
    id: string,
    value: string,
    versionstamp: string,
  ): Promise<{ ok: boolean; versionstamp?: string }>;
  raw(justification: string): Promise<string>;
  boom(): Promise<never>;
}

function fakeRepository(): FakeRepository {
  return {
    metadata: { resource: "bookmarks" },
    get(id) {
      return Promise.resolve({ id, versionstamp: "v1" });
    },
    list(_options) {
      return Promise.resolve({ items: ["a", "b"], cursor: null });
    },
    update(_id, _value, versionstamp) {
      return Promise.resolve({ ok: true, versionstamp });
    },
    raw(_justification) {
      return Promise.resolve("raw-result");
    },
    boom() {
      return Promise.reject(new RangeError("kv exploded"));
    },
  };
}

function fakeRoute(
  handler: (context: Record<string, unknown>) => Promise<Response>,
): NormalizedRoute {
  return {
    method: "POST",
    path: "/bookmarks",
    source: "api/bookmarks/route.ts",
    parameterNames: [],
    operation: {
      schemas: {},
      security: {},
      contract: {},
      handler: handler as unknown as NormalizedRoute["operation"]["handler"],
    },
  } as NormalizedRoute;
}

function context(): Record<string, unknown> {
  return {
    request: new Request("https://example.test/bookmarks", { method: "POST" }),
    params: {},
    query: { page: 1 },
    headers: { accept: "application/json" },
    body: { url: "https://example.test" },
  };
}

async function invoke(
  route: NormalizedRoute,
  ctx: Record<string, unknown> = context(),
): Promise<Response> {
  return await route.operation.handler(
    ctx as unknown as Parameters<NormalizedRoute["operation"]["handler"]>[0],
  );
}

Deno.test("AC-F019-001 · a wrapped repository preserves values, errors, and versionstamps", async () => {
  const active = newSession();
  const target = fakeRepository();
  const wrapped = captureRepository(target, active);

  assert.deepEqual(await wrapped.get("one"), { id: "one", versionstamp: "v1" });
  assert.deepEqual(await wrapped.update("one", "value", "v1"), {
    ok: true,
    versionstamp: "v1",
  });
  assert.equal(wrapped.metadata.resource, "bookmarks");

  await assert.rejects(
    () => wrapped.boom(),
    (error: unknown) =>
      error instanceof RangeError &&
      error.message === "kv exploded",
  );
});

Deno.test("AC-F019-002 · a wrapped route returns the handler response unchanged", async () => {
  const active = newSession();
  const expected = new Response('{"ok":true}', {
    status: 201,
    headers: { "content-type": "application/json" },
  });
  const wrapped = captureRoute(
    fakeRoute(() => Promise.resolve(expected)),
    active,
  );
  const actual = await invoke(wrapped);
  assert.equal(actual.status, 201);
  assert.equal(actual.headers.get("content-type"), "application/json");
  assert.equal(await actual.text(), '{"ok":true}');
});

Deno.test("AC-F019-003 · a bounded indexed query records resource, index, and limit", async () => {
  const active = newSession();
  const wrapped = captureRepository(fakeRepository(), active);
  await wrapped.list({ index: "owner", value: "u1", limit: 25 });
  const recorded = active.artifact().dataOperations;
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].resource, "bookmarks");
  assert.equal(recorded[0].kind, "query");
  assert.equal(recorded[0].index, "owner");
  assert.equal(recorded[0].limit, 25);
});

Deno.test("AC-F019-004 · a read-modify-write records versionstamp and atomicity", async () => {
  const active = newSession();
  const wrapped = captureRepository(fakeRepository(), active);
  await wrapped.update("one", "value", "v1");
  const recorded = active.artifact().dataOperations;
  assert.equal(recorded[0].kind, "read-modify-write");
  assert.equal(recorded[0].versionstampCheck, true);
  assert.equal(recorded[0].atomic, true);
});

Deno.test("AC-F019-005 · a raw operation records its caller justification", async () => {
  const active = newSession();
  const wrapped = captureRepository(fakeRepository(), active);
  await wrapped.raw("bulk migration outside declared primitives");
  const recorded = active.artifact().dataOperations;
  assert.equal(recorded[0].kind, "raw");
  assert.equal(
    recorded[0].rawJustification,
    "bulk migration outside declared primitives",
  );
});

Deno.test("AC-F019-006 · only locations the handler reads are recorded", async () => {
  const active = newSession();
  const wrapped = captureRoute(
    fakeRoute((ctx) => {
      const body = ctx.body as { url: string };
      return Promise.resolve(new Response(body.url, { status: 200 }));
    }),
    active,
  );
  await invoke(wrapped);
  const [request] = active.artifact().requests;
  assert.deepEqual(request.readLocations, ["body"]);
});

Deno.test("AC-F019-007 · the returned response status is recorded as observed", async () => {
  const active = newSession();
  const wrapped = captureRoute(
    fakeRoute(() => Promise.resolve(new Response(null, { status: 422 }))),
    active,
  );
  await invoke(wrapped);
  assert.equal(active.artifact().requests[0].responseStatus, 422);
});

Deno.test("AC-F019-008 · records inside a criterion test carry its attribution", async () => {
  const active = newSession();
  const wrapped = captureRepository(fakeRepository(), active);
  active.enter({
    requirementId: "EP-BOOKMARKS-CREATE",
    criterionId: "AC-EP-001",
  });
  await wrapped.get("one");
  active.exit();
  const [recorded] = active.artifact().dataOperations;
  assert.deepEqual(recorded.attribution, {
    requirementId: "EP-BOOKMARKS-CREATE",
    criterionId: "AC-EP-001",
  });
});

Deno.test("AC-F019-009 · records outside a criterion test are retained unattributed", async () => {
  const active = newSession();
  const wrapped = captureRepository(fakeRepository(), active);
  await wrapped.get("one");
  active.enter({
    requirementId: "EP-BOOKMARKS-CREATE",
    criterionId: "AC-EP-001",
  });
  await wrapped.get("two");
  active.exit();
  const recorded = active.artifact().dataOperations;
  assert.equal(recorded.length, 2);
  assert.equal(recorded[0].attribution, undefined);
  assert.equal(recorded[1].attribution?.criterionId, "AC-EP-001");
});

Deno.test("AC-F019-010 · an unexercised route is reported as uncaptured", async () => {
  const active = newSession();
  active.declareRoute({ method: "POST", path: "/bookmarks" });
  active.declareRoute({ method: "GET", path: "/bookmarks" });
  const wrapped = captureRoute(
    fakeRoute(() => Promise.resolve(new Response(null, { status: 201 }))),
    active,
  );
  await invoke(wrapped);
  const artifact = active.artifact();
  assert.deepEqual(artifact.uncapturedRoutes, [{
    method: "GET",
    path: "/bookmarks",
  }]);
  assert.equal(artifact.requests.length, 1);
});

Deno.test("AC-F019-011 · identical runs produce byte-identical artifacts", async () => {
  const run = async () => {
    const active = newSession();
    active.declareRoute({ method: "POST", path: "/bookmarks" });
    const repo = captureRepository(fakeRepository(), active);
    const routed = captureRoute(
      fakeRoute(() => Promise.resolve(new Response(null, { status: 201 }))),
      active,
    );
    active.enter({
      requirementId: "EP-BOOKMARKS-CREATE",
      criterionId: "AC-EP-001",
    });
    await repo.list({ index: "owner", value: "u1", limit: 25 });
    await repo.get("one");
    await invoke(routed);
    active.exit();
    return JSON.stringify(active.artifact());
  };
  assert.equal(await run(), await run());
});

Deno.test("AC-F019-012 · the artifact records its runner and revision", () => {
  const artifact = newSession().artifact();
  assert.equal(artifact.schema, "sleepy-hollow-capture/v1");
  assert.equal(artifact.runner, "deno test");
  assert.equal(artifact.revision, "916d706");
});

Deno.test("AC-F019-013 · persisting writes the complete artifact to the supplied location", async () => {
  const active = newSession();
  active.declareRoute({ method: "POST", path: "/bookmarks" });
  const repo = captureRepository(fakeRepository(), active);
  await repo.list({ index: "owner", value: "u1", limit: 25 });
  const directory = await Deno.makeTempDir({ prefix: "sh-capture-" });
  const target = `${directory}/capture.json`;

  await persistCaptureSession(active, target);

  const written = await Deno.readTextFile(target);
  assert.deepEqual(
    JSON.parse(written),
    JSON.parse(JSON.stringify(active.artifact())),
  );
  await Deno.remove(directory, { recursive: true });
});

Deno.test("AC-F019-014 · a persistence failure leaves no partial artifact", async () => {
  const active = newSession();
  const directory = await Deno.makeTempDir({ prefix: "sh-capture-" });
  const target = `${directory}/missing/capture.json`;

  await assert.rejects(() => persistCaptureSession(active, target));

  let present = true;
  try {
    await Deno.stat(target);
  } catch {
    present = false;
  }
  assert.equal(present, false);
  assert.deepEqual([...Deno.readDirSync(directory)].map((e) => e.name), []);
  await Deno.remove(directory, { recursive: true });
});

Deno.test("AC-F019-015 · criterion tests attribute records without a caller-managed scope", async () => {
  const active = newSession();
  const repo = captureRepository(fakeRepository(), active);
  const spec = captureCriterionTest({
    id: "T-BOOKMARKS-001",
    requirementId: "EP-BOOKMARKS-CREATE",
    criteria: ["AC-EP-001"],
    name: "creates a bookmark",
    sourcePath: "api/bookmarks/route_test.ts",
    fn: async () => {
      await repo.get("one");
    },
  }, active);

  await spec.fn({} as Parameters<typeof spec.fn>[0]);
  await repo.get("outside");

  const recorded = active.artifact().dataOperations;
  assert.equal(recorded.length, 2);
  assert.deepEqual(recorded[0].attribution, {
    requirementId: "EP-BOOKMARKS-CREATE",
    criterionId: "AC-EP-001",
  });
  assert.equal(recorded[1].attribution, undefined);
});
