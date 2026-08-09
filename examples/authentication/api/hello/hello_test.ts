import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import { discoverRoutes } from "@sleepy-hollow/framework/routing";
import { createTestApplication } from "@sleepy-hollow/framework/testing";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const apiRoot = fileURLToPath(new URL("../", import.meta.url));

const CREDENTIAL = "Bearer sleepy-hollow-demo-token";

/**
 * Builds the application the way it is actually served: routes come from real
 * discovery, and security is composed from the module the project declares.
 * Calling a handler directly would prove nothing here, because the handler is
 * exactly the code that must not run for an unauthenticated caller.
 *
 * The discovered handler is wrapped in a counter so a test can observe whether
 * it was entered at all, rather than inferring it from the response body.
 */
async function application() {
  const discovered = await discoverRoutes(apiRoot);
  const calls = { handler: 0 };
  const routes = discovered.map((route) => ({
    ...route,
    operation: {
      ...route.operation,
      handler: (context: Parameters<typeof route.operation.handler>[0]) => {
        calls.handler += 1;
        return route.operation.handler(context);
      },
    },
  }));
  const context = await createTestApplication({
    routes,
    security: { root: projectRoot, securityModule: "security.ts" },
  });
  return { context, calls };
}

Deno.test("AC-HELLO-001 · a recognized credential is greeted by name", async () => {
  const { context, calls } = await application();
  try {
    const response = await context.fetch("/hello", {
      headers: { authorization: CREDENTIAL },
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { greeting: string };
    assert.match(body.greeting, /demo-caller/);
    assert.equal(calls.handler, 1);
  } finally {
    await context.close();
  }
});

Deno.test("AC-HELLO-002 · an anonymous request is refused before the handler", async () => {
  const { context, calls } = await application();
  try {
    const response = await context.fetch("/hello");
    await context.assertProblem(response, { status: 401 });
    assert.equal(
      response.headers.get("www-authenticate"),
      'Bearer realm="authentication-example"',
    );
    assert.equal(calls.handler, 0, "the handler must never be entered");
  } finally {
    await context.close();
  }
});

Deno.test("AC-HELLO-003 · an unrecognized credential is refused identically", async () => {
  const { context, calls } = await application();
  try {
    const anonymous = await context.fetch("/hello");
    const wrong = await context.fetch("/hello", {
      headers: { authorization: "Bearer not-the-demo-token" },
    });

    assert.equal(wrong.status, anonymous.status);
    assert.equal(
      wrong.headers.get("www-authenticate"),
      anonymous.headers.get("www-authenticate"),
    );
    assert.deepEqual(await wrong.json(), await anonymous.json());
    assert.equal(calls.handler, 0, "the handler must never be entered");

    // The rejection must not echo what was presented.
    assert.doesNotMatch(
      [...wrong.headers].flat().join(" "),
      /not-the-demo-token/,
    );
  } finally {
    await context.close();
  }
});
