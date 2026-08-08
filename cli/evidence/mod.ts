export { EvidenceError } from "./evidence_error.ts";
import { locations } from "./project.ts";
import { requirements } from "./requirements.ts";
import type {
  EvidenceLoadOptions,
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
