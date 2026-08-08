export { EvidenceError } from "./evidence_error.ts";
import { locations } from "./project.ts";
import { requirements } from "./requirements.ts";
import { checkLoader, deployLoader, inventory } from "./inventory.ts";
import type {
  EvidenceCaptureOptions,
  EvidenceLoadOptions,
  EvidenceVerificationInventory,
  ProjectLocations,
  RequirementInventory,
} from "./types.ts";

export * from "./types.ts";

export function resolveProjectLocations(
  options: EvidenceLoadOptions,
): Promise<ProjectLocations> {
  return locations(options);
}

export function loadRequirementEvidence(
  project: ProjectLocations,
  options: EvidenceLoadOptions,
): Promise<RequirementInventory> {
  return requirements(project, options);
}

export function loadVerificationInventory(
  project: ProjectLocations,
  options: EvidenceCaptureOptions,
): Promise<EvidenceVerificationInventory> {
  return inventory(project, options);
}

export function createCheckInventoryLoader(
  options: { readonly revision: string | (() => string) },
) {
  return (
    request: { readonly projectRoot: string; readonly scope?: unknown },
  ) =>
    checkLoader(
      request.projectRoot,
      typeof options.revision === "function"
        ? options.revision()
        : options.revision,
      request.scope,
    );
}

export function createTestInventoryLoader() {
  return async (
    request: { readonly projectRoot: string; readonly scope?: unknown },
  ) => {
    const project = await locations({ projectRoot: request.projectRoot });
    return await requirements(project, { projectRoot: request.projectRoot });
  };
}

export function createDeployInventoryLoader(options: {
  readonly revision: string;
  readonly target: { readonly kind: "deno-deploy"; readonly project: string };
}) {
  return (request: { readonly projectRoot: string }) =>
    deployLoader(request.projectRoot, options);
}
