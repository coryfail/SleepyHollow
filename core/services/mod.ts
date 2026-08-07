import { normalizeArchitecture } from "./architecture.ts";
import { openOwned, verifyBoundaries } from "./boundary.ts";
import { scaffoldWorkspaces } from "./scaffold.ts";
import { serviceClientOptions } from "./transport.ts";
import type {
  BoundaryVerificationResult,
  CreateServiceClientOptions,
  ServiceArchitecture,
  ServiceCapabilityClaim,
  ServiceClientOptions,
  ServiceScaffoldResult,
  ServiceSource,
} from "./types.ts";

export * from "./types.ts";
export * from "./errors.ts";

export function normalizeServiceArchitecture(
  architecture: ServiceArchitecture,
): ServiceArchitecture {
  return normalizeArchitecture(architecture);
}

export function scaffoldServiceWorkspaces(options: {
  readonly architecture: ServiceArchitecture;
  readonly projectRoot: string;
  readonly requirements: Readonly<Record<string, string>>;
}): Promise<ServiceScaffoldResult> {
  return scaffoldWorkspaces(options);
}

export function verifyServiceBoundaries(options: {
  readonly architecture: ServiceArchitecture;
  readonly sources: readonly ServiceSource[];
  readonly capabilities?: readonly ServiceCapabilityClaim[];
}): BoundaryVerificationResult {
  return verifyBoundaries(options);
}

export function openOwnedServiceKv<T>(options: {
  readonly architecture: ServiceArchitecture;
  readonly ownerServiceId: string;
  readonly requesterServiceId: string;
  readonly bindingId: string;
  readonly open: (bindingId: string) => T | Promise<T>;
}): Promise<T> {
  return openOwned(options);
}

export function createServiceClientOptions(
  options: CreateServiceClientOptions,
): ServiceClientOptions {
  return serviceClientOptions(options);
}
