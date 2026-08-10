import type { DeployAdapter, SmokeTestOutcome } from "./types.ts";

export const TOKEN_VARIABLE = "DENO_DEPLOY_TOKEN";

export function resolveToken(
  env: { get(name: string): string | undefined },
): string {
  const raw = env.get(TOKEN_VARIABLE);
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(
      `No Deno Deploy access token is available. Set ${TOKEN_VARIABLE} to a token for the target account before deploying.`,
    );
  }
  const token = raw.trim();
  if (/\s/.test(token)) {
    throw new Error(
      `The ${TOKEN_VARIABLE} value is malformed. Set ${TOKEN_VARIABLE} to a single token with no whitespace.`,
    );
  }
  return token;
}

function outcome(
  id: string,
  status: "passed" | "failed",
  observedStatus: number,
  evidence: string,
): SmokeTestOutcome {
  return { id, status, observedStatus, evidence };
}

export function denoDeployAdapter(options: {
  readonly apiOrigin: string;
  readonly transport: typeof globalThis.fetch;
}): DeployAdapter {
  const { apiOrigin, transport } = options;
  return {
    async upload(request) {
      const endpoint = new URL(
        `/v1/projects/${
          encodeURIComponent(request.target.project)
        }/deployments`,
        apiOrigin,
      );
      let response: Response;
      try {
        response = await transport(endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${request.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ revision: request.revision }),
        });
      } catch (error) {
        throw new Error(
          `Deno Deploy upload failed before a response was received: ${
            error instanceof Error ? error.message : "unknown transport error"
          }`,
        );
      }
      if (!response.ok) {
        throw new Error(
          `Deno Deploy refused the upload with status ${response.status}.`,
        );
      }
      const body = await response.json() as {
        url?: unknown;
        id?: unknown;
      };
      if (typeof body.url !== "string" || typeof body.id !== "string") {
        throw new Error(
          "Deno Deploy returned a deployment without a URL and revision.",
        );
      }
      return { url: body.url, revision: body.id };
    },

    async health(request) {
      try {
        const response = await transport(new URL("/", request.url));
        return outcome(
          "HEALTH",
          response.ok ? "passed" : "failed",
          response.status,
          `GET / returned ${response.status}`,
        );
      } catch (error) {
        return outcome(
          "HEALTH",
          "failed",
          0,
          `GET / failed: ${
            error instanceof Error ? error.message : "unknown transport error"
          }`,
        );
      }
    },

    async smoke(request) {
      const endpoint = new URL(request.test.path, request.url);
      try {
        const response = await transport(endpoint, {
          method: request.test.method,
        });
        const passed = response.status === request.test.expectedStatus;
        return outcome(
          request.test.id,
          passed ? "passed" : "failed",
          response.status,
          `${request.test.method} ${request.test.path} returned ${response.status}, expected ${request.test.expectedStatus}`,
        );
      } catch (error) {
        return outcome(
          request.test.id,
          "failed",
          0,
          `${request.test.method} ${request.test.path} failed: ${
            error instanceof Error ? error.message : "unknown transport error"
          }`,
        );
      }
    },
  };
}
