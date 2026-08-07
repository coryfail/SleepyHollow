import type { DeployInventory, DeployPlan } from "./types.ts";

export function plan(inventory: DeployInventory): DeployPlan {
  const deployed = new Set(inventory.deployedEnvironmentKeys);
  const current = new Set(inventory.environmentKeys);
  const environmentKeyChanges = [
    ...inventory.environmentKeys.filter((key) => !deployed.has(key)).map((
      key,
    ) => ({ key, change: "added" as const })),
    ...inventory.deployedEnvironmentKeys.filter((key) => !current.has(key)).map(
      (key) => ({ key, change: "removed" as const }),
    ),
  ].sort((left, right) => left.key.localeCompare(right.key));
  const breaking = inventory.contractChanges.some((change) =>
    change.severity === "breaking"
  );
  const unchanged = inventory.deployedRevision === inventory.revision &&
    environmentKeyChanges.length === 0 &&
    inventory.contractChanges.length === 0;
  return {
    target: inventory.target,
    revision: inventory.revision,
    ...(inventory.deployedRevision
      ? { deployedRevision: inventory.deployedRevision }
      : {}),
    environmentKeyChanges,
    contractChanges: [...inventory.contractChanges],
    smokeTests: [...inventory.smokeTests],
    requiresConfirmation: !unchanged &&
      (inventory.firstExternalDeployment || breaking),
    unchanged,
  };
}
