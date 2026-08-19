import type { DeployAdapter, SmokeTestOutcome } from "./types.ts";

export const TOKEN_VARIABLE = "FLY_API_TOKEN";

export interface FlyCommandRunner {
  run(options: {
    readonly command: readonly string[];
    readonly environment: Readonly<Record<string, string>>;
  }): Promise<{ readonly stdout: string; readonly stderr: string }>;
}

export function resolveToken(
  env: Readonly<Record<string, string | undefined>>,
): string {
  const raw = env[TOKEN_VARIABLE];
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(
      `No Fly.io access token is available. Set ${TOKEN_VARIABLE} to an app-scoped token before deploying.`,
    );
  }
  const token = raw.trim();
  if (/\s/.test(token)) {
    throw new Error(`${TOKEN_VARIABLE} must be a single token with no whitespace.`);
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

/**
 * First provider adapter. Structured command arguments avoid a shell; the
 * token is injected only into the child environment and never into arguments,
 * plan output, or deployment artifacts.
 */
export function flyAdapter(options: {
  readonly runner: FlyCommandRunner;
  readonly transport: typeof globalThis.fetch;
}): DeployAdapter {
  return {
    async upload(request) {
      const result = await options.runner.run({
        command: ["flyctl", "deploy", "--app", request.target.project, "--remote-only"],
        environment: { [TOKEN_VARIABLE]: request.token },
      });
      const url = `https://${request.target.project}.fly.dev`;
      return {
        url,
        revision: result.stdout.trim() || request.revision,
      };
    },

    async health(request) {
      try {
        const response = await options.transport(new URL("/", request.url));
        return outcome("HEALTH", response.ok ? "passed" : "failed", response.status, `GET / returned ${response.status}`);
      } catch (error) {
        return outcome("HEALTH", "failed", 0, `GET / failed: ${error instanceof Error ? error.message : "unknown transport error"}`);
      }
    },

    async smoke(request) {
      try {
        const response = await options.transport(new URL(request.test.path, request.url), { method: request.test.method });
        return outcome(request.test.id, response.status === request.test.expectedStatus ? "passed" : "failed", response.status, `${request.test.method} ${request.test.path} returned ${response.status}, expected ${request.test.expectedStatus}`);
      } catch (error) {
        return outcome(request.test.id, "failed", 0, `${request.test.method} ${request.test.path} failed: ${error instanceof Error ? error.message : "unknown transport error"}`);
      }
    },
  };
}
