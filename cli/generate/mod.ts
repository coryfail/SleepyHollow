import { generate, renderArtifacts } from "./artifacts.ts";
import { analyzeChanges } from "./changes.ts";
import type {
  ContractChange,
  ContractInventory,
  GeneratedArtifacts,
  GenerateOptions,
  GenerationResult,
} from "./types.ts";

export * from "./types.ts";
export { GenerationError } from "./error.ts";
export { inventoryFromRoutes } from "./inventory.ts";

export function renderContractArtifacts(
  inventory: ContractInventory,
): GeneratedArtifacts {
  return renderArtifacts(inventory);
}

export function analyzeContractChanges(
  previous: Readonly<Record<string, unknown>>,
  current: Readonly<Record<string, unknown>>,
): readonly ContractChange[] {
  return analyzeChanges(
    previous as Record<string, unknown>,
    current as Record<string, unknown>,
  );
}

export function generateContracts(
  options: GenerateOptions,
): Promise<GenerationResult> {
  return generate(options);
}
