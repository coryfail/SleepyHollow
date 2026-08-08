import { denoDeployAdapter, resolveToken } from "./adapter.ts";
import { deploy } from "./deployment.ts";
import { plan } from "./plan.ts";
import { human, json } from "./render.ts";
import type {
  DeployAdapter,
  DeployInventory,
  DeployPlan,
  DeployRequest,
  DeployResult,
} from "./types.ts";

export * from "./types.ts";

export function buildDeployPlan(inventory: DeployInventory): DeployPlan {
  return plan(inventory);
}

export function runDeployment(
  request: DeployRequest,
  adapter: DeployAdapter,
  now: () => string,
): Promise<DeployResult> {
  return deploy(request, adapter, now);
}

export function renderHumanDeployResult(result: DeployResult): string {
  return human(result);
}

export function renderJsonDeployResult(result: DeployResult): string {
  return json(result);
}

export function exitCodeForDeploy(result: DeployResult): 0 | 1 {
  return result.ok ? 0 : 1;
}

export function resolveDeployToken(
  env: { get(name: string): string | undefined } = Deno.env,
): string {
  return resolveToken(env);
}

export function createDenoDeployAdapter(options: {
  readonly apiOrigin?: string;
  readonly transport?: typeof globalThis.fetch;
}): DeployAdapter {
  return denoDeployAdapter({
    apiOrigin: options.apiOrigin ?? "https://api.deno.com",
    transport: options.transport ?? globalThis.fetch,
  });
}
