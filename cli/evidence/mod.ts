export { EvidenceError } from "./evidence_error.ts";
import { locations } from "./project.ts";
import { requirements } from "./requirements.ts";
import { standards } from "./standards.ts";
import {
  checkLoader,
  inventory,
  testLoader,
} from "./inventory.ts";
import type {
  EvidenceCaptureOptions,
  EvidenceLoadOptions,
  EvidenceVerificationInventory,
  ProjectLocations,
  RequirementInventory,
  CodeStandardsEvidence,
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

/** Loads independent source evidence for the enforced project standards. */
export function loadCodeStandards(
  project: ProjectLocations,
): Promise<CodeStandardsEvidence> {
  return standards(project);
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
  return (request: { readonly projectRoot: string }) =>
    testLoader(request.projectRoot);
}
