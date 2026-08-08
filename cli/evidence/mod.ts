export { EvidenceError } from "./evidence_error.ts";
import { locations } from "./project.ts";
import { requirements } from "./requirements.ts";
import { inventory } from "./inventory.ts";
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
