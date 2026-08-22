import { platform } from "#platform";
import type { CaptureArtifact } from "../../core/capture/mod.ts";
import { discoverRoutes } from "../../core/routing/mod.ts";
import { relative, sep } from "path";
import { EvidenceError } from "./evidence_error.ts";
import type {
  EvidenceCaptureOptions,
  EvidenceRoute,
  LoadedRequirement,
  ProjectLocations,
} from "./types.ts";

const CAPTURE_FILE = "capture.json";

export async function capture(
  project: ProjectLocations,
  options: EvidenceCaptureOptions,
): Promise<CaptureArtifact> {
  const path =
    `${project.projectRoot}/${project.generatedDirectory}/${CAPTURE_FILE}`;
  const read = options.readTextFile ??
    ((target: string) => platform.readTextFile(target));
  let source: string;
  try {
    source = await read(path);
  } catch {
    throw new EvidenceError([{
      code: "SH_EVIDENCE_CAPTURE_MISSING",
      path: `${project.generatedDirectory}/${CAPTURE_FILE}`,
      summary: "No capture artifact exists for this project.",
      correction:
        "Run the mapped tests with capture enabled before verifying behavior.",
    }]);
  }
  let parsed: CaptureArtifact;
  try {
    parsed = JSON.parse(source) as CaptureArtifact;
  } catch {
    throw new EvidenceError([{
      code: "SH_EVIDENCE_CAPTURE_INVALID",
      path: `${project.generatedDirectory}/${CAPTURE_FILE}`,
      summary: "The capture artifact is not valid JSON.",
      correction: "Regenerate the capture artifact from a test run.",
    }]);
  }
  if (parsed.schema !== "sleepy-hollow-capture/v1") {
    throw new EvidenceError([{
      code: "SH_EVIDENCE_CAPTURE_INVALID",
      path: `${project.generatedDirectory}/${CAPTURE_FILE}`,
      summary: "The capture artifact declares an unknown schema.",
      correction: "Regenerate the capture artifact with a supported runner.",
    }]);
  }
  if (parsed.revision !== options.revision) {
    throw new EvidenceError([{
      code: "SH_EVIDENCE_CAPTURE_STALE",
      path: `${project.generatedDirectory}/${CAPTURE_FILE}`,
      summary:
        `The capture artifact records revision ${parsed.revision}, but verification targets ${options.revision}.`,
      correction: "Rerun the mapped tests against the current revision.",
    }]);
  }
  return parsed;
}

function declaredLocations(schemas: unknown): readonly string[] {
  if (typeof schemas !== "object" || schemas === null) return [];
  return ["params", "query", "headers", "body"].filter((location) =>
    location in (schemas as Record<string, unknown>)
  );
}

function declaredStatuses(schemas: unknown): readonly number[] {
  if (typeof schemas !== "object" || schemas === null) return [];
  const responses = (schemas as { responses?: unknown }).responses;
  if (typeof responses !== "object" || responses === null) return [];
  return Object.keys(responses).map(Number).filter(Number.isSafeInteger).sort((
    left,
    right,
  ) => left - right);
}

function authenticationOf(security: unknown): "none" | "required" {
  if (typeof security !== "object" || security === null) return "none";
  const declared = (security as { authentication?: unknown }).authentication;
  if (typeof declared !== "object" || declared === null) return "none";
  return (declared as { mode?: unknown }).mode === "required"
    ? "required"
    : "none";
}

function normalizedRequirementPath(path: string): string {
  return path.replace(/\[([A-Za-z_][A-Za-z0-9_]*)\]/g, ":$1");
}

function ownerOf(
  route: { readonly method: string; readonly path: string },
  requirements: readonly LoadedRequirement[],
): string | undefined {
  const owners = requirements.filter((requirement) =>
    requirement.routePath !== undefined &&
    normalizedRequirementPath(requirement.routePath) === route.path &&
    requirement.methods?.includes(route.method)
  );
  return owners.length === 1 ? owners[0].id : undefined;
}

export async function routes(
  project: ProjectLocations,
  artifact: CaptureArtifact,
  requirements: readonly LoadedRequirement[] = [],
): Promise<readonly EvidenceRoute[]> {
  const roots = project.services.length > 0
    ? project.services.map((service) => ({
      absolute: `${project.projectRoot}/${service.apiRoot}`,
      display: service.apiRoot,
    }))
    : [{
      absolute: `${project.projectRoot}/${project.apiDirectory}`,
      display: project.apiDirectory,
    }];

  const found: EvidenceRoute[] = [];
  for (const root of roots) {
    let discovered;
    try {
      discovered = await discoverRoutes(root.absolute);
    } catch (error) {
      throw new EvidenceError([{
        code: "SH_EVIDENCE_ROUTE_DISCOVERY_FAILED",
        path: root.display,
        summary: error instanceof Error
          ? error.message
          : "Route discovery failed.",
        correction: "Repair the reported route modules and reload evidence.",
      }]);
    }
    for (const route of discovered) {
      const observed = artifact.requests.filter((request) =>
        request.method === route.method && request.path === route.path
      );
      const readLocations = new Set<string>();
      const statuses = new Set<number>();
      for (const request of observed) {
        for (const location of request.readLocations) {
          readLocations.add(location);
        }
        statuses.add(request.responseStatus);
      }
      const source = route.source.startsWith("/")
        ? relative(root.absolute, route.source).split(sep).join("/")
        : route.source;
      found.push({
        requirementId: ownerOf(route, requirements),
        method: route.method,
        path: route.path,
        source: `${root.display}/${source}`,
        requestSchemaLocations: declaredLocations(route.operation.schemas),
        requiredRequestLocations: [...readLocations].sort(),
        responseSchemaStatuses: declaredStatuses(route.operation.schemas),
        requiredResponseStatuses: [...statuses].sort((a, b) => a - b),
        authentication: authenticationOf(route.operation.security),
        captured: observed.length > 0,
      });
    }
  }
  return found.sort((left, right) =>
    left.path.localeCompare(right.path) ||
    left.method.localeCompare(right.method)
  );
}
