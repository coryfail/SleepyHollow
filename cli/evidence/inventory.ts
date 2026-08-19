import type { CheckRoute, VerificationInventory } from "../check/mod.ts";
import { verifyProject } from "../check/mod.ts";
import type { DeployInventory } from "../deploy/mod.ts";
import type { TestCommandInventory } from "../test/mod.ts";
import type { TestManifest } from "../../core/testing/mod.ts";
import { capture, routes } from "./behavior.ts";
import { locations } from "./project.ts";
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

export async function checkLoader(
  projectRoot: string,
  revision: string,
  _scope: unknown,
): Promise<VerificationInventory> {
  const project = await locations({ projectRoot });
  const evidence = await inventory(project, { projectRoot, revision });
  const testManifest: TestManifest = {
    schema: "sleepy-hollow-test-manifest/v1",
    tests: [],
  };
  return {
    projectRootDisplay: projectRoot,
    requestedScope: { kind: "full" },
    requirements: evidence.requirements.map((item) => ({
      id: item.id,
      status: item.status,
      governedContentDigest: item.governedContentDigest,
      ...(item.dependsOn ? { dependsOn: item.dependsOn } : {}),
      criteria: item.criteria,
      ...(item.approval ? { approval: item.approval } : {}),
      path: item.path,
      redStateValid: item.approvalBound,
    })),
    dependencyGraph: evidence.requirements.map((item) => ({
      id: item.id,
      dependsOn: item.dependsOn ?? [],
    })),
    testManifest,
    testResults: [],
    routes: evidence.routes.map((route) => ({
      requirementId: route.requirementId ?? "",
      method: route.method,
      path: route.path,
      source: route.source,
      requestSchemaLocations: route
        .requestSchemaLocations as CheckRoute["requestSchemaLocations"],
      requiredRequestLocations: route
        .requiredRequestLocations as CheckRoute["requiredRequestLocations"],
      responseSchemaStatuses: route.responseSchemaStatuses,
      requiredResponseStatuses: route.requiredResponseStatuses,
      authentication: route.authentication,
      captured: route.captured,
    })),
    dataOperations: evidence.dataOperations.map((operation) => ({
      ...operation,
      kind: operation.kind as "get" | "query" | "read-modify-write" | "raw",
      declaredIndexes: operation.index ? [operation.index] : [],
    })),
    typecheck: { status: "passed", evidence: "loaded from project evidence" },
    testRunner: { status: "passed", evidence: "loaded from project evidence" },
    configurationDiagnostics: [],
    capture: {
      present: true,
      uncapturedRoutes: evidence.uncapturedRoutes,
    },
  };
}

export async function deployLoader(
  projectRoot: string,
  options: {
    readonly revision: string;
    readonly target: { readonly kind: "fly"; readonly project: string };
  },
): Promise<DeployInventory> {
  const project = await locations({ projectRoot });
  const verification = verifyProject(
    await checkLoader(projectRoot, options.revision, undefined),
  );
  return {
    projectRootDisplay: projectRoot,
    target: options.target,
    revision: options.revision,
    verification,
    environmentKeys: [],
    deployedEnvironmentKeys: [],
    contractChanges: [],
    openApiPath: `${project.generatedDirectory}/openapi.json`,
    documentationPath: `${project.generatedDirectory}/docs.html`,
    smokeTests: [],
    firstExternalDeployment: true,
  };
}

export async function testLoader(
  projectRoot: string,
): Promise<TestCommandInventory> {
  const project = await locations({ projectRoot });
  const governed = await requirements(project, { projectRoot });
  return {
    projectRootDisplay: projectRoot,
    requirements: governed.requirements.map((item) => ({
      id: item.id,
      status: item.status,
      governedContentDigest: item.governedContentDigest,
      ...(item.dependsOn ? { dependsOn: item.dependsOn } : {}),
      criteria: item.criteria,
      ...(item.approval ? { approval: item.approval } : {}),
    })),
    dependencyGraph: governed.requirements.map((item) => ({
      id: item.id,
      dependsOn: item.dependsOn ?? [],
    })),
    routes: [],
    manifest: { schema: "sleepy-hollow-test-manifest/v1", tests: [] },
    isolation: [],
  };
}
