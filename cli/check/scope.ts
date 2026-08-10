import { selectAffectedTests } from "../../core/testing/mod.ts";
import type {
  CheckDiagnostic,
  RequestedCheckScope,
  VerificationInventory,
} from "./types.ts";

export interface ResolvedScope {
  readonly effectiveScope: "full" | "targeted";
  readonly requirementIds: readonly string[];
  readonly testIds: readonly string[];
  readonly diagnostics: readonly CheckDiagnostic[];
}

const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

function full(inventory: VerificationInventory): ResolvedScope {
  return {
    effectiveScope: "full",
    requirementIds: sorted(inventory.requirements.map((item) => item.id)),
    testIds: sorted(inventory.testManifest.tests.map((item) => item.id)),
    diagnostics: [],
  };
}

function scopeTarget(
  requested: RequestedCheckScope,
  inventory: VerificationInventory,
): string[] {
  if (requested.kind === "requirement") return [requested.requirementId];
  if (requested.kind === "route") {
    return sorted(
      inventory.routes.filter((route) =>
        route.method === requested.method.toUpperCase() &&
        route.path === requested.path
      ).map((route) => route.requirementId),
    );
  }
  return [];
}

export function resolveScope(inventory: VerificationInventory): ResolvedScope {
  if (inventory.requestedScope.kind === "full") return full(inventory);
  const targets = scopeTarget(inventory.requestedScope, inventory);
  const selection = selectAffectedTests({
    targets,
    requirements: inventory.dependencyGraph,
    tests: inventory.testManifest.tests,
    hasUnownedSharedChange: inventory.hasUnownedSharedChange,
  });
  if (selection.mode === "targeted") {
    return {
      effectiveScope: "targeted",
      requirementIds: selection.requirementIds,
      testIds: selection.testIds,
      diagnostics: [],
    };
  }
  const reason = selection.diagnostics.map((item) => item.code).sort();
  return {
    ...full(inventory),
    diagnostics: [{
      code: "SH_CHECK_SCOPE_ESCALATED",
      severity: "warning",
      phase: "governance",
      summary:
        "Targeted verification escalated to the complete applicable check",
      location: inventory.requestedScope.kind === "requirement"
        ? { requirementId: inventory.requestedScope.requirementId }
        : {
          route:
            `${inventory.requestedScope.method.toUpperCase()} ${inventory.requestedScope.path}`,
        },
      evidence: { reasons: reason.length ? reason : ["target-unresolved"] },
      correction:
        "Review ownership and dependency diagnostics; full verification remains authoritative.",
    }],
  };
}
