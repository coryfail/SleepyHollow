import { posix } from "node:path";

import { normalizeArchitecture } from "./architecture.ts";
import { ServiceBoundaryError } from "./errors.ts";
import type {
  BoundaryVerificationResult,
  ServiceArchitecture,
  ServiceCapabilityClaim,
  ServiceDiagnostic,
  ServiceSource,
} from "./types.ts";

const importSpecifier = /(?:from\s*|import\s*)["']([^"']+)["']/g;

function diagnostic(
  code: string,
  summary: string,
  correction: string,
  serviceId: string,
  source: string,
  target?: string,
): ServiceDiagnostic {
  return {
    code,
    summary,
    correction,
    serviceId,
    source,
    ...(target ? { target } : {}),
  };
}

function importedPath(source: string, specifier: string): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  return posix.resolve("/", posix.dirname(source), specifier).slice(1);
}

export function verifyBoundaries(options: {
  readonly architecture: ServiceArchitecture;
  readonly sources: readonly ServiceSource[];
  readonly capabilities?: readonly ServiceCapabilityClaim[];
}): BoundaryVerificationResult {
  const architecture = normalizeArchitecture(options.architecture);
  const services = new Map(
    architecture.services.map((item) => [item.id, item]),
  );
  const diagnostics: ServiceDiagnostic[] = [];
  for (const source of options.sources) {
    const owner = services.get(source.serviceId);
    if (
      !owner ||
      !(source.path === owner.root || source.path.startsWith(`${owner.root}/`))
    ) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_SOURCE_OWNER_INVALID",
        `${source.serviceId} source lies outside its declared root`,
        "Assign the source to its owning service root.",
        source.serviceId,
        source.path,
      ));
      continue;
    }
    if (/\bDeno\s*\.\s*openKv\s*\(/.test(source.content)) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_DIRECT_KV_FORBIDDEN",
        `${source.serviceId} directly opens Deno KV`,
        "Use the owner-bound SH-F004 service KV capability.",
        source.serviceId,
        source.path,
        owner.kvBinding,
      ));
    }
    for (const match of source.content.matchAll(importSpecifier)) {
      const targetPath = importedPath(source.path, match[1]);
      if (!targetPath) continue;
      const target = architecture.services.find((item) =>
        item.id !== source.serviceId &&
        (targetPath === item.root || targetPath.startsWith(`${item.root}/`))
      );
      if (target) {
        diagnostics.push(diagnostic(
          "SH_SERVICE_CROSS_ROOT_IMPORT",
          `${source.serviceId} imports ${target.id} implementation`,
          `Use ${target.id}'s generated typed HTTP client through a declared dependency.`,
          source.serviceId,
          source.path,
          targetPath,
        ));
      }
    }
  }
  for (const capability of options.capabilities ?? []) {
    const owner = services.get(capability.ownerServiceId);
    if (
      !owner || capability.requesterServiceId !== capability.ownerServiceId ||
      capability.bindingId !== owner.kvBinding
    ) {
      diagnostics.push(diagnostic(
        "SH_SERVICE_FOREIGN_KV_CAPABILITY",
        `${capability.requesterServiceId} received a foreign or invalid KV capability`,
        "Keep repository and raw-KV capabilities inside the owning service and use its generated client.",
        capability.requesterServiceId,
        capability.source,
        capability.bindingId,
      ));
    }
  }
  if (diagnostics.length) throw new ServiceBoundaryError(diagnostics);
  return {
    ok: true,
    checkedSources: options.sources.length,
    checkedCapabilities: options.capabilities?.length ?? 0,
  };
}

export async function openOwned<T>(options: {
  readonly architecture: ServiceArchitecture;
  readonly ownerServiceId: string;
  readonly requesterServiceId: string;
  readonly bindingId: string;
  readonly open: (bindingId: string) => T | Promise<T>;
}): Promise<T> {
  const architecture = normalizeArchitecture(options.architecture);
  const owner = architecture.services.find((item) =>
    item.id === options.ownerServiceId
  );
  if (
    !owner || options.ownerServiceId !== options.requesterServiceId ||
    owner.kvBinding !== options.bindingId
  ) {
    throw new ServiceBoundaryError([diagnostic(
      "SH_SERVICE_FOREIGN_KV_CAPABILITY",
      `${options.requesterServiceId} cannot open ${options.ownerServiceId}'s KV binding`,
      `Call ${options.ownerServiceId} through its generated typed HTTP client.`,
      options.requesterServiceId,
      "runtime service KV capability",
      options.bindingId,
    )]);
  }
  return await options.open(options.bindingId);
}
