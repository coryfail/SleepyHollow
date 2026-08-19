import assert from "assert/strict";

import { createRouter, discoverRoutes, RouteDiscoveryError } from "./mod.ts";

const fixture = (name: string) =>
  new URL(`./testdata/${name}/api/`, import.meta.url);

test("AC-F002-001 · discovers and dispatches a static route", async () => {
  const routes = await discoverRoutes(fixture("basic"));
  const response = await createRouter(routes).fetch(
    new Request("https://example.test/health"),
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "healthy");
});

test("AC-F002-002 · decodes a dynamic path parameter", async () => {
  const routes = await discoverRoutes(fixture("basic"));
  const response = await createRouter(routes).fetch(
    new Request("https://example.test/bookmarks/sleepy%20hollow"),
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "sleepy hollow");
});

test("AC-F002-001 AC-F002-004 · static paths shadow dynamic siblings", async () => {
  const routes = await discoverRoutes(fixture("precedence"));
  const response = await createRouter(routes).fetch(
    new Request("https://example.test/users/me", { method: "POST" }),
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
});

test("AC-F002-003 · returns Problem Details for an unknown path", async () => {
  const routes = await discoverRoutes(fixture("basic"));
  const response = await createRouter(routes).fetch(
    new Request("https://example.test/missing"),
  );

  assert.equal(response.status, 404);
  assert.equal(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  assert.deepEqual(await response.json(), {
    type: "about:blank",
    title: "Not Found",
    status: 404,
    instance: "/missing",
  });
});

test("AC-F002-004 · returns Allow and Problem Details for an unsupported method", async () => {
  const routes = await discoverRoutes(fixture("basic"));
  const response = await createRouter(routes).fetch(
    new Request("https://example.test/health", { method: "POST" }),
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
  assert.equal(
    response.headers.get("content-type"),
    "application/problem+json",
  );
  assert.equal((await response.json()).status, 405);
});

test("AC-F002-005 · reports every ambiguous dynamic route source", async () => {
  await assert.rejects(
    () => discoverRoutes(fixture("conflict")),
    (error: unknown) => {
      assert.ok(error instanceof RouteDiscoveryError);
      assert.equal(error.diagnostics[0]?.code, "SH_ROUTE_CONFLICT");
      assert.deepEqual(
        error.diagnostics[0]?.files.map((file) => file.split("/").at(-2))
          .sort(),
        ["[id]", "[slug]"],
      );
      assert.equal(error.diagnostics[0]?.route, "/users/:parameter");
      return true;
    },
  );
});

test("AC-F002-006 · preserves custom handler metadata and behavior", async () => {
  const routes = await discoverRoutes(fixture("custom"));
  const route = routes[0];

  assert.deepEqual(route.operation.contract, { summary: "Stream custom text" });
  assert.deepEqual(route.operation.security, { authentication: "none" });
  assert.deepEqual(route.operation.schemas, {
    responses: { 202: "text/plain" },
  });

  const response = await createRouter(routes).fetch(
    new Request("https://example.test/raw"),
  );
  assert.equal(response.status, 202);
  assert.equal(await response.text(), "custom");
});

test("AC-F002-007 · emits one deterministic normalized inventory", async () => {
  const first = await discoverRoutes(fixture("basic"));
  const second = await discoverRoutes(fixture("basic"));

  const project = (routes: typeof first) =>
    routes.map((route) => ({
      method: route.method,
      path: route.path,
      parameterNames: route.parameterNames,
      source: route.source.split("/testdata/").at(-1),
    }));

  assert.deepEqual(project(first), project(second));
  assert.deepEqual(project(first), [
    {
      method: "GET",
      path: "/bookmarks/:id",
      parameterNames: ["id"],
      source: "basic/api/bookmarks/[id]/route.ts",
    },
    {
      method: "GET",
      path: "/health",
      parameterNames: [],
      source: "basic/api/health/route.ts",
    },
  ]);
});

test("AC-F002-008 · rejects malformed modules and invalid segments", async (test) => {
  await test.step("malformed module", async () => {
    await assert.rejects(
      () => discoverRoutes(fixture("invalid-module")),
      (error: unknown) => {
        assert.ok(error instanceof RouteDiscoveryError);
        assert.equal(error.diagnostics[0]?.code, "SH_ROUTE_INVALID_MODULE");
        assert.match(
          error.diagnostics[0]?.files[0] ?? "",
          /broken\/route\.ts$/,
        );
        return true;
      },
    );
  });

  await test.step("invalid dynamic segment", async () => {
    await assert.rejects(
      () => discoverRoutes(fixture("invalid-segment")),
      (error: unknown) => {
        assert.ok(error instanceof RouteDiscoveryError);
        assert.equal(error.diagnostics[0]?.code, "SH_ROUTE_INVALID_SEGMENT");
        assert.match(
          error.diagnostics[0]?.files[0] ?? "",
          /\[bad-name\]\/route\.ts$/,
        );
        return true;
      },
    );
  });
});
