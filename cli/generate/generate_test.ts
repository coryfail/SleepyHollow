import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  analyzeContractChanges,
  type ContractInventory,
  generateContracts,
  renderContractArtifacts,
} from "./mod.ts";

const problemSchema = {
  type: "object",
  additionalProperties: true,
  required: ["type", "title", "status"],
  properties: {
    type: { type: "string" },
    title: { type: "string" },
    status: { type: "integer" },
    detail: { type: "string" },
  },
} as const;

const bookmarkSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
  },
} as const;

function inventory(
  serviceId = "bookmarks",
  authenticated = false,
): ContractInventory {
  return {
    serviceId,
    title: `${serviceId} service`,
    version: "1.0.0",
    description: "A deterministic fixture service.",
    securitySchemes: authenticated
      ? {
        projectAuth: {
          type: "apiKey",
          in: "header",
          name: "authorization",
        },
      }
      : {},
    operations: [{
      operationId: "getBookmark",
      method: "GET",
      path: "/bookmarks/:id",
      source: "api/bookmarks/[id]/route.ts",
      summary: "Get one bookmark",
      request: {
        params: {
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["id"],
            properties: { id: { type: "string" } },
          },
        },
      },
      responses: {
        200: {
          description: "The matching bookmark",
          schema: bookmarkSchema,
        },
        404: {
          description: "Bookmark not found",
          schema: problemSchema,
          contentType: "application/problem+json",
          error: true,
        },
      },
      security: authenticated
        ? { mode: "required", scheme: "projectAuth" }
        : { mode: "none" },
    }],
  };
}

function artifact(
  rendered: ReturnType<typeof renderContractArtifacts>,
  path: string,
): string {
  const match = rendered.artifacts.find((item) => item.path === path);
  assert.ok(match, path);
  return match.content;
}

let importSequence = 0;
async function importClient(source: string): Promise<Record<string, unknown>> {
  const directory = await Deno.makeTempDir({ prefix: "sleepy-hollow-client-" });
  const path = join(directory, "client.ts");
  await Deno.writeTextFile(path, source);
  importSequence += 1;
  return await import(`${pathToFileURL(path).href}?fixture=${importSequence}`);
}

Deno.test("AC-F010-001 · OpenAPI contains every normalized route and method", () => {
  const rendered = renderContractArtifacts({
    ...inventory(),
    operations: [
      ...inventory().operations,
      {
        ...inventory().operations[0],
        operationId: "createBookmark",
        method: "POST",
        path: "/bookmarks",
      },
    ],
  });
  const openapi = JSON.parse(artifact(rendered, "openapi.json"));
  assert.equal(openapi.openapi, "3.1.1");
  assert.equal(openapi.paths["/bookmarks/{id}"].get.operationId, "getBookmark");
  assert.equal(openapi.paths["/bookmarks"].post.operationId, "createBookmark");
});

Deno.test("AC-F010-002 · OpenAPI schemas and security match normalized runtime contracts", () => {
  const openapi = JSON.parse(
    artifact(
      renderContractArtifacts(inventory("bookmarks", true)),
      "openapi.json",
    ),
  );
  const operation = openapi.paths["/bookmarks/{id}"].get;
  assert.deepEqual(
    operation.responses["200"].content["application/json"].schema,
    bookmarkSchema,
  );
  assert.deepEqual(
    operation.responses["404"].content["application/problem+json"].schema,
    problemSchema,
  );
  assert.deepEqual(operation.security, [{ projectAuth: [] }]);
  assert.deepEqual(openapi.components.securitySchemes.projectAuth, {
    type: "apiKey",
    in: "header",
    name: "authorization",
  });
});

Deno.test("AC-F010-003 · local API documentation is self-contained and read-only", () => {
  const docs = artifact(renderContractArtifacts(inventory()), "api-docs.html");
  assert.match(docs, /<!doctype html>/i);
  assert.match(docs, /Get one bookmark/);
  assert.match(docs, /application\/problem\+json/);
  assert.match(docs, /<nav/i);
  assert.doesNotMatch(docs, /<script[^>]+src=|https?:\/\/(?!www\.w3\.org)/i);
  assert.doesNotMatch(docs, /try it|fetch\s*\(/i);
});

Deno.test("AC-F010-004 · generated clients expose typed inputs, successes, and errors", () => {
  const client = artifact(renderContractArtifacts(inventory()), "client.ts");
  assert.match(client, /export interface GetBookmarkInput/);
  assert.match(client, /export type GetBookmarkSuccess/);
  assert.match(client, /export type GetBookmarkProblem/);
  assert.match(client, /class ApiError/);
  assert.match(client, /getBookmark/);
});

Deno.test("AC-F010-005 · generated client accepts base URL and injected fetch", async () => {
  const module = await importClient(
    artifact(renderContractArtifacts(inventory()), "client.ts"),
  );
  const requests: Request[] = [];
  const createClient = module.createClient as (
    options: Record<string, unknown>,
  ) => {
    getBookmark(
      input: Record<string, unknown>,
    ): Promise<{ status: number; body: unknown }>;
  };
  const client = createClient({
    baseUrl: "https://example.test/api/v1/",
    fetch: (request: Request) => {
      requests.push(request);
      return Promise.resolve(Response.json({ id: "b1", title: "Fixture" }));
    },
    responseValidation: "error",
  });
  const result = await client.getBookmark({ path: { id: "b1" } });
  assert.equal(result.status, 200);
  assert.equal(requests[0].url, "https://example.test/api/v1/bookmarks/b1");
});

Deno.test("AC-F010-006 · authentication injection remains identity-model neutral", async () => {
  const module = await importClient(
    artifact(
      renderContractArtifacts(inventory("bookmarks", true)),
      "client.ts",
    ),
  );
  let authorization = "";
  const createClient = module.createClient as (
    options: Record<string, unknown>,
  ) => {
    getBookmark(input: Record<string, unknown>): Promise<unknown>;
  };
  const client = createClient({
    baseUrl: "https://example.test",
    authenticate: ({ request }: { request: Request }) => {
      const headers = new Headers(request.headers);
      headers.set("authorization", "Project fixture proof");
      return new Request(request, { headers });
    },
    fetch: (request: Request) => {
      authorization = request.headers.get("authorization") ?? "";
      return Promise.resolve(Response.json({ id: "b1", title: "Fixture" }));
    },
  });
  await client.getBookmark({ path: { id: "b1" } });
  assert.equal(authorization, "Project fixture proof");
});

Deno.test("AC-F010-007 · response validation rejects contract violations", async () => {
  const module = await importClient(
    artifact(renderContractArtifacts(inventory()), "client.ts"),
  );
  const createClient = module.createClient as (
    options: Record<string, unknown>,
  ) => {
    getBookmark(input: Record<string, unknown>): Promise<unknown>;
  };
  const ResponseContractError = module.ResponseContractError as new (
    ...args: unknown[]
  ) => Error;
  const client = createClient({
    baseUrl: "https://example.test",
    responseValidation: "error",
    fetch: () => Promise.resolve(Response.json({ id: "b1", title: 42 })),
  });
  await assert.rejects(
    () => client.getBookmark({ path: { id: "b1" } }),
    ResponseContractError,
  );
});

Deno.test("AC-F010-008 · output is deterministic and check mode detects edited artifacts", async () => {
  const first = renderContractArtifacts(inventory());
  const second = renderContractArtifacts(inventory());
  assert.deepEqual(second, first);
  const projectRoot = await Deno.makeTempDir({
    prefix: "sleepy-hollow-generate-",
  });
  const written = await generateContracts({
    inventory: inventory(),
    projectRoot,
  });
  assert.equal(written.ok, true);
  assert.equal(written.wrote, true);
  const current = await generateContracts({
    inventory: inventory(),
    projectRoot,
    check: true,
  });
  assert.equal(current.ok, true);
  await Deno.writeTextFile(
    join(projectRoot, "generated", "client.ts"),
    "// user edit\n",
  );
  const stale = await generateContracts({
    inventory: inventory(),
    projectRoot,
    check: true,
  });
  assert.equal(stale.ok, false);
  assert.ok(
    stale.artifacts.some((item) =>
      item.path === "generated/client.ts" && item.stale
    ),
  );
});

Deno.test("AC-F010-009 · breaking analysis reports every supported category actionably", () => {
  const rendered = renderContractArtifacts(inventory("bookmarks", true));
  const current = JSON.parse(artifact(rendered, "openapi.json"));
  const previous = structuredClone(current);
  previous.paths["/removed"] = {
    get: {
      operationId: "removedRoute",
      responses: { 200: { description: "old" } },
      security: [],
    },
  };
  previous.paths["/bookmarks/{id}"].get.parameters = [{
    name: "optional",
    in: "query",
    required: false,
    schema: { type: "string" },
  }];
  previous.paths["/bookmarks/{id}"].get.responses["200"]
    .content["application/json"].schema = {
      ...bookmarkSchema,
      properties: { ...bookmarkSchema.properties, legacy: { type: "string" } },
    };
  previous.paths["/bookmarks/{id}"].get.responses["400"] = {
    description: "Old error",
    content: { "application/problem+json": { schema: problemSchema } },
  };
  previous.paths["/bookmarks/{id}"].get.security = [];
  previous.paths["/bookmarks/{id}"].get["x-sleepy-hollow-pagination"] = {
    cursor: "after",
    limit: "limit",
    envelope: "items",
  };
  current.paths["/bookmarks/{id}"].get.parameters = [{
    name: "optional",
    in: "query",
    required: true,
    schema: { type: "string", enum: ["narrow"] },
  }];
  current.paths["/bookmarks/{id}"].get["x-sleepy-hollow-pagination"] = {
    cursor: "cursor",
    limit: "pageSize",
    envelope: "data",
  };
  const changes = analyzeContractChanges(previous, current);
  for (
    const code of [
      "SH_CONTRACT_ROUTE_REMOVED",
      "SH_CONTRACT_INPUT_REQUIRED",
      "SH_CONTRACT_RESPONSE_PROPERTY_REMOVED",
      "SH_CONTRACT_TYPE_NARROWED",
      "SH_CONTRACT_ERROR_CHANGED",
      "SH_CONTRACT_AUTH_CHANGED",
      "SH_CONTRACT_PAGINATION_CHANGED",
    ]
  ) {
    const change = changes.find((item) => item.code === code);
    assert.ok(change, code);
    assert.ok(change.operationId);
    assert.ok(change.element);
    assert.ok(change.guidance);
  }
});

Deno.test("AC-F010-010 · service clients expose HTTP contracts without persistence access", async () => {
  const users = renderContractArtifacts(inventory("users"));
  const projects = renderContractArtifacts(inventory("projects"));
  const usersClient = artifact(users, "client.ts");
  const projectsClient = artifact(projects, "client.ts");
  assert.doesNotMatch(
    usersClient + projectsClient,
    /Deno\.openKv|core\/kv|repository/i,
  );
  const module = await importClient(usersClient);
  const createClient = module.createClient as (
    options: Record<string, unknown>,
  ) => {
    getBookmark(input: Record<string, unknown>): Promise<unknown>;
  };
  const client = createClient({
    baseUrl: "https://users.internal",
    fetch: () => Promise.resolve(Response.json({ id: "u1", title: "User" })),
  });
  await client.getBookmark({ path: { id: "u1" } });
});
