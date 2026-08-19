import { flyAdapter, resolveToken, type FlyCommandRunner } from "./adapter.ts";
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
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  return resolveToken(env);
}

export function createFlyAdapter(options: {
  readonly runner: FlyCommandRunner;
  readonly transport?: typeof globalThis.fetch;
}): DeployAdapter {
  return flyAdapter({
    runner: options.runner,
    transport: options.transport ?? globalThis.fetch,
  });
}
