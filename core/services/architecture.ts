import { isAbsolute, posix } from "path";

import { ServiceArchitectureError } from "./errors.ts";
import type {
  ServiceArchitecture,
  ServiceDefinition,
  ServiceDiagnostic,
} from "./types.ts";

const identifier = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const criterion = /^AC-[A-Z0-9]+(?:-[A-Z0-9]+)+$/;

function diagnostic(
  code: string,
  summary: string,
  correction: string,
  serviceId?: string,
  target?: string,
): ServiceDiagnostic {
  return {
    code,
    summary,
    correction,
    ...(serviceId ? { serviceId } : {}),
    ...(target ? { target } : {}),
  };
}

export function safeRelative(path: string): boolean {
  return path.length > 0 && !isAbsolute(path) && !path.includes("\\") &&
    !path.split("/").includes("..") && posix.normalize(path) === path &&
    path !== ".";
}

function validateService(
  service: ServiceDefinition,
  diagnostics: ServiceDiagnostic[],
): void {
  if (!identifier.test(service.id)) {
    diagnostics.push(diagnostic(
      "SH_SERVICE_ID_INVALID",
      `Service ID ${JSON.stringify(service.id)} is unsafe`,
      "Use a stable lowercase identifier with single hyphens.",
      service.id,
    ));
  }
  const paths = [
    service.root,
    service.requirementsPath,
    service.configPath,
    service.apiRoot,
    service.testsRoot,
    service.generatedRoot,
    service.deploymentConfigPath,
  ];
  for (const path of paths) {
    if (
      !safeRelative(path) ||
      (path !== service.root && !path.startsWith(`${service.root}/`))
    ) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_PATH_INVALID",
        `${service.id} declares an unsafe or out-of-root path`,
        "Use normalized relative paths contained by the service root.",
        service.id,
        path,
      ));
    }
  }
  if (!service.requirementsPath.endsWith(".req.md")) {
    diagnostics.push(diagnostic(
      "SH_SERVICE_PATH_INVALID",
      `${service.id} declares a noncanonical requirement path`,
      "Use a meaningful named .req.md file inside the service root.",
      service.id,
      service.requirementsPath,
    ));
  }
  if (!identifier.test(service.databaseBinding)) {
    diagnostics.push(diagnostic(
      "SH_SERVICE_DATABASE_BINDING_INVALID",
      `${service.id} declares an unsafe database binding`,
      "Use a unique stable lowercase database binding identifier.",
      service.id,
      service.databaseBinding,
    ));
  }
  const dependencyIds = new Set<string>();
  for (const dependency of service.dependencies) {
    if (
      dependencyIds.has(dependency.serviceId) ||
      dependency.serviceId === service.id
    ) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_DEPENDENCY_INVALID",
        `${service.id} has a duplicate or self dependency`,
        "Declare each external service dependency once.",
        service.id,
        dependency.serviceId,
      ));
    }
    dependencyIds.add(dependency.serviceId);
    const criteria = Object.values(dependency.failureCriteria);
    if (
      !safeRelative(dependency.requirementsPath) ||
      !dependency.requirementsPath.endsWith(".req.md") ||
      !dependency.authenticationRequirementId.trim() ||
      criteria.some((value) => !criterion.test(value)) ||
      dependency.partialFailure.atomic !== false
    ) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_DEPENDENCY_EVIDENCE_INVALID",
        `${service.id} lacks approved dependency failure or authentication evidence`,
        "Declare safe caller-owned requirements, criterion IDs, neutral authentication, and atomic: false.",
        service.id,
        dependency.serviceId,
      ));
    }
  }
}

function cycle(services: readonly ServiceDefinition[]): string[] | undefined {
  const graph = new Map(
    services.map((item) => [
      item.id,
      item.dependencies.map((dependency) => dependency.serviceId),
    ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];
  const visit = (id: string): string[] | undefined => {
    if (visiting.has(id)) return [...path.slice(path.indexOf(id)), id];
    if (visited.has(id)) return undefined;
    visiting.add(id);
    path.push(id);
    for (const target of graph.get(id) ?? []) {
      const found = visit(target);
      if (found) return found;
    }
    path.pop();
    visiting.delete(id);
    visited.add(id);
    return undefined;
  };
  for (const service of services) {
    const found = visit(service.id);
    if (found) return found;
  }
  return undefined;
}

export function normalizeArchitecture(
  architecture: ServiceArchitecture,
): ServiceArchitecture {
  const diagnostics: ServiceDiagnostic[] = [];
  const expectedCount = architecture.choice === "multi-service" ? 2 : 1;
  if (
    (architecture.choice === "multi-service" &&
      architecture.services.length < expectedCount) ||
    (architecture.choice !== "multi-service" &&
      architecture.services.length !== expectedCount)
  ) {
    diagnostics.push(diagnostic(
      "SH_SERVICE_COUNT_INVALID",
      `${architecture.choice} is inconsistent with its service count`,
      architecture.choice === "multi-service"
        ? "Declare at least two independently owned services."
        : "Declare exactly one deployed application service.",
    ));
  }
  if (
    architecture.choice !== "single-service" && !architecture.rationale?.trim()
  ) {
    diagnostics.push(diagnostic(
      "SH_SERVICE_RATIONALE_REQUIRED",
      `${architecture.choice} has no reviewed justification`,
      "Record a concrete ownership, scale, deployment, isolation, regulatory, or lifecycle need.",
    ));
  }
  if (
    architecture.choice === "extraction-ready" &&
    (!architecture.boundaries?.length ||
      architecture.boundaries.some((item) =>
        !identifier.test(item.id) || !item.owner.trim() || !item.evidence.trim()
      ))
  ) {
    diagnostics.push(diagnostic(
      "SH_SERVICE_BOUNDARY_EVIDENCE_REQUIRED",
      "Extraction-ready architecture lacks approved logical boundaries",
      "Record each stable boundary, owner, and reviewed evidence without adding a deployment unit.",
    ));
  }
  const ids = new Set<string>();
  const bindings = new Set<string>();
  for (const service of architecture.services) {
    validateService(service, diagnostics);
    if (ids.has(service.id)) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_ID_DUPLICATED",
        `Service ID ${service.id} is duplicated`,
        "Assign every service a unique stable ID.",
        service.id,
      ));
    }
    if (bindings.has(service.databaseBinding)) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_DATABASE_BINDING_DUPLICATED",
        `Database binding ${service.databaseBinding} is shared`,
        "Assign a unique database binding to every service.",
        service.id,
        service.databaseBinding,
      ));
    }
    ids.add(service.id);
    bindings.add(service.databaseBinding);
  }
  for (let left = 0; left < architecture.services.length; left++) {
    for (let right = left + 1; right < architecture.services.length; right++) {
      const a = architecture.services[left].root;
      const b = architecture.services[right].root;
      if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)) {
        diagnostics.push(diagnostic(
          "SH_SERVICE_ROOT_OVERLAP",
          `${architecture.services[left].id} and ${
            architecture.services[right].id
          } have overlapping roots`,
          "Assign disjoint workspace roots.",
          architecture.services[left].id,
          b,
        ));
      }
    }
  }
  for (const service of architecture.services) {
    for (const dependency of service.dependencies) {
      if (!ids.has(dependency.serviceId)) {
        diagnostics.push(diagnostic(
          "SH_SERVICE_DEPENDENCY_UNRESOLVED",
          `${service.id} depends on undeclared service ${dependency.serviceId}`,
          "Add the target service to the approved architecture or remove the dependency.",
          service.id,
          dependency.serviceId,
        ));
      }
    }
  }
  const dependencyCycle = cycle(architecture.services);
  if (dependencyCycle) {
    diagnostics.push(diagnostic(
      "SH_SERVICE_DEPENDENCY_CYCLE",
      `Service dependency cycle detected: ${dependencyCycle.join(" -> ")}`,
      "Remove the cycle or return to requirements review with explicit cycle evidence.",
    ));
  }
  if (diagnostics.length) throw new ServiceArchitectureError(diagnostics);
  return {
    choice: architecture.choice,
    ...(architecture.rationale?.trim()
      ? { rationale: architecture.rationale.trim() }
      : {}),
    ...(architecture.boundaries
      ? {
        boundaries: [...architecture.boundaries].map((item) => ({ ...item }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      }
      : {}),
    services: [...architecture.services].map((service) => ({
      ...service,
      dependencies: [...service.dependencies].map((item) => ({
        ...item,
        failureCriteria: { ...item.failureCriteria },
        partialFailure: { ...item.partialFailure },
      })).sort((a, b) => a.serviceId.localeCompare(b.serviceId)),
    })).sort((a, b) => a.id.localeCompare(b.id)),
  };
}
