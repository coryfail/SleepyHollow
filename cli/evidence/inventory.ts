import { capture, routes } from "./behavior.ts";
import { requirements } from "./requirements.ts";
import type {
  EvidenceCaptureOptions,
  EvidenceVerificationInventory,
  ProjectLocations,
} from "./types.ts";

export async function inventory(
  project: ProjectLocations,
  options: EvidenceCaptureOptions,
): Promise<EvidenceVerificationInventory> {
  const artifact = await capture(project, options);
  const governed = await requirements(project, options);
  const discovered = await routes(project, artifact);
  return {
    projectRootDisplay: project.projectRoot,
    requirements: governed.requirements,
    routes: discovered,
    uncapturedRoutes: [...artifact.uncapturedRoutes]
      .map((route) => ({ method: route.method, path: route.path }))
      .sort((left, right) =>
        left.path.localeCompare(right.path) ||
        left.method.localeCompare(right.method)
      ),
    dataOperations: artifact.dataOperations.map((operation) => ({
      id: `OP-${operation.sequence}`,
      requirementId: operation.attribution?.requirementId ?? "",
      source: operation.attribution
        ? `${operation.attribution.requirementId}/${operation.attribution.criterionId}`
        : "unattributed",
      resource: operation.resource,
      kind: operation.kind,
      ...(operation.index ? { index: operation.index } : {}),
      ...(typeof operation.limit === "number"
        ? { limit: operation.limit }
        : {}),
      ...(typeof operation.versionstampCheck === "boolean"
        ? { versionstampCheck: operation.versionstampCheck }
        : {}),
      ...(typeof operation.atomic === "boolean"
        ? { atomic: operation.atomic }
        : {}),
      ...(operation.rawJustification
        ? { rawJustification: operation.rawJustification }
        : {}),
    })),
  };
}
