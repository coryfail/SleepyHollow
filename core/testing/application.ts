import { openEmbeddedSqlite } from "../database/mod.ts";
import type { NormalizedRoute } from "../routing/mod.ts";
import { composeProjectSecurity } from "../security/mod.ts";
import { testingDiagnostic, TestingError } from "./error.ts";
import type {
  JsonTestResponse,
  ProblemDetails,
  ProblemExpectation,
  TestApplication,
  TestApplicationContext,
  TestApplicationFactory,
  TestApplicationOptions,
  TestApplicationSecurityOptions,
} from "./types.ts";

function equal(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length &&
      left.every((value, index) => equal(value, right[index]));
  }
  if (
    left !== null && right !== null && typeof left === "object" &&
    typeof right === "object"
  ) {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    return equal(leftKeys, rightKeys) &&
      leftKeys.every((key) => equal(leftRecord[key], rightRecord[key]));
  }
  return false;
}

export async function problem(
  response: Response,
  expectation: ProblemExpectation,
): Promise<ProblemDetails> {
  const diagnostics = [];
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/problem+json")) {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_PROBLEM_CONTENT_TYPE",
      `Expected application/problem+json but received ${
        contentType || "no content type"
      }.`,
      "Return RFC 9457 Problem Details with the problem JSON media type.",
    ));
  }
  if (response.status !== expectation.status || response.ok) {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_PROBLEM_STATUS",
      `Expected failing status ${expectation.status} but received ${response.status}.`,
      "Return the approved non-success HTTP status in both the response and problem body.",
    ));
  }
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_PROBLEM_JSON",
      "Problem response body is not valid JSON.",
      "Return one RFC 9457 JSON object.",
    ));
  }
  const body = value !== null && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  if (
    typeof body.type !== "string" || typeof body.title !== "string" ||
    typeof body.status !== "number" || body.status !== response.status
  ) {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_PROBLEM_SHAPE",
      "Problem response lacks matching type, title, and numeric status members.",
      "Return the required RFC 9457 members and match the HTTP status.",
    ));
  }
  if (expectation.type !== undefined && body.type !== expectation.type) {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_PROBLEM_TYPE",
      `Expected problem type ${expectation.type}.`,
      "Return the approved stable problem type URI.",
    ));
  }
  if (expectation.title !== undefined && body.title !== expectation.title) {
    diagnostics.push(testingDiagnostic(
      "SH_TEST_PROBLEM_TITLE",
      `Expected problem title ${expectation.title}.`,
      "Return the approved safe problem title.",
    ));
  }
  for (const [key, expected] of Object.entries(expectation.extensions ?? {})) {
    if (!equal(body[key], expected)) {
      diagnostics.push(testingDiagnostic(
        "SH_TEST_PROBLEM_EXTENSION",
        `Problem extension ${key} does not match its expected value.`,
        "Return the approved safe extension value.",
        key,
      ));
    }
  }
  if (diagnostics.length > 0) throw new TestingError(diagnostics);
  return body as ProblemDetails;
}

/**
 * The options union already makes "neither factory nor routes" a type error.
 * This guard exists for callers that reach the runtime without that checking,
 * such as JavaScript or a value cast through `any`.
 */
function required<Principal, Credentials>(
  create: TestApplicationFactory<Principal, Credentials> | undefined,
): TestApplicationFactory<Principal, Credentials> {
  if (create === undefined) {
    throw new TestingError([testingDiagnostic(
      "SH_TEST_APPLICATION_SOURCE_REQUIRED",
      "A test application needs either an application factory or a route inventory.",
      "Supply create or routes.",
    )]);
  }
  return create;
}

async function secured(
  routes: readonly NormalizedRoute[],
  security: TestApplicationSecurityOptions | undefined,
): Promise<TestApplication> {
  const router = await composeProjectSecurity(routes, {
    mode: "test",
    root: security?.root ?? ".",
    ...(security?.securityModule === undefined
      ? {}
      : { securityModule: security.securityModule }),
    ...(security?.load === undefined ? {} : { load: security.load }),
  });
  return { fetch: (request) => router.fetch(request) };
}

export async function testApplication<Principal, Credentials>(
  options: TestApplicationOptions<Principal, Credentials>,
): Promise<TestApplicationContext> {
  const database = openEmbeddedSqlite({ filename: ":memory:" });
  let closed = false;
  const cleanup = async () => {
    if (closed) return;
    closed = true;
    try {
      await options.cleanup?.();
    } finally {
      database.close();
    }
  };
  try {
    const application = options.routes === undefined
      ? await required(options.create)({
        database,
        principal: options.principal === undefined
          ? undefined
          : structuredClone(options.principal),
        credentials: options.credentials === undefined
          ? undefined
          : structuredClone(options.credentials),
      })
      : await secured(options.routes, options.security);
    await options.seed?.({ database, application });
    const origin = new URL(options.origin ?? "http://sleepy-hollow.test");
    const fetchApplication = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const request = input instanceof Request
        ? new Request(input, init)
        : new Request(new URL(String(input), origin), init);
      return await application.fetch(request);
    };
    const context: TestApplicationContext = {
      database,
      application,
      fetch: fetchApplication,
      async request<RequestBody = undefined, ResponseBody = unknown>(
        requestOptions: {
          readonly method?: string;
          readonly path: string;
          readonly headers?: HeadersInit;
          readonly body?: RequestBody;
        },
      ): Promise<JsonTestResponse<ResponseBody>> {
        const headers = new Headers(requestOptions.headers);
        let body: string | undefined;
        if (requestOptions.body !== undefined) {
          headers.set("content-type", "application/json");
          body = JSON.stringify(requestOptions.body);
        }
        const response = await fetchApplication(requestOptions.path, {
          method: requestOptions.method ??
            (body === undefined ? "GET" : "POST"),
          headers,
          body,
        });
        const text = await response.clone().text();
        const parsed = text === "" ? undefined : JSON.parse(text);
        return { response, body: parsed as ResponseBody };
      },
      assertProblem: problem,
      close: cleanup,
      [Symbol.asyncDispose]: cleanup,
    };
    return Object.freeze(context);
  } catch (error) {
    await cleanup();
    throw error;
  }
}
