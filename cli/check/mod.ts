import { human, json } from "./render.ts";
import type { CheckResult, VerificationInventory } from "./types.ts";
import { verify } from "./verifier.ts";

export * from "./types.ts";
export { runCheckCommand } from "./command.ts";
export { runNodeVerification } from "./runner.ts";

export function verifyProject(inventory: VerificationInventory): CheckResult {
  return verify(inventory);
}

export function renderHumanCheckResult(result: CheckResult): string {
  return human(result);
}

export function renderJsonCheckResult(result: CheckResult): string {
  return json(result);
}

export function exitCodeForCheck(result: CheckResult): 0 | 1 {
  return result.ok ? 0 : 1;
}
