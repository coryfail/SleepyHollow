/**
 * Service decomposition: architecture, workspace scaffolding, and boundaries.
 *
 * An architecture names the services, what each one owns, and how they may
 * reach one another. Boundary verification checks source against that
 * declaration, so a service reading storage it does not own is caught as a
 * violation rather than discovered later as coupling.
 *
 * @module
 */
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

/**
 * Validates an architecture declaration and fills in its derived paths.
 *
 * @param architecture The declaration to normalize.
 * @returns The same architecture, with every path resolved.
 * @throws {ServiceArchitectureError} When the declaration is inconsistent.
 */
export function normalizeServiceArchitecture(
  architecture: ServiceArchitecture,
): ServiceArchitecture {
  return normalizeArchitecture(architecture);
}

/**
 * Creates each service's workspace on disk, from the architecture.
 *
 * @param options The architecture, the project root, and per-service
 * requirements content.
 * @returns Which paths were created, per service.
 * @throws {ServiceArchitectureError} When the architecture is inconsistent.
 */
export function scaffoldServiceWorkspaces(options: {
  readonly architecture: ServiceArchitecture;
  readonly projectRoot: string;
  readonly requirements: Readonly<Record<string, string>>;
}): Promise<ServiceScaffoldResult> {
  return scaffoldWorkspaces(options);
}

/**
 * Checks source against the architecture it claims to implement.
 *
 * Catches a service opening storage it does not own, or calling a service it
 * never declared, as a violation rather than as coupling discovered later.
 *
 * @param options The architecture, the sources to examine, and any capability
 * claims that grant access across an ownership boundary.
 * @returns What was examined, when nothing was violated.
 * @throws {ServiceBoundaryError} When any source crosses a boundary.
 */
export function verifyServiceBoundaries(options: {
  readonly architecture: ServiceArchitecture;
  readonly sources: readonly ServiceSource[];
  readonly capabilities?: readonly ServiceCapabilityClaim[];
}): BoundaryVerificationResult {
  return verifyBoundaries(options);
}

/**
 * Opens a KV binding only if the requesting service is entitled to it.
 *
 * Ownership is checked before `open` runs, so an unentitled service never
 * obtains a handle it could then use.
 *
 * @param options The architecture, who owns the binding, who is asking, which
 * binding, and how to open it once permitted.
 * @returns Whatever `open` returned.
 * @throws {ServiceBoundaryError} When the requester is not entitled.
 */
export function openOwnedServiceKv<T>(options: {
  readonly architecture: ServiceArchitecture;
  readonly ownerServiceId: string;
  readonly requesterServiceId: string;
  readonly bindingId: string;
  readonly open: (bindingId: string) => T | Promise<T>;
}): Promise<T> {
  return openOwned(options);
}

/**
 * Resolves the options for calling one service from another.
 *
 * The dependency must be declared in the architecture, and the call is always
 * bounded by a deadline; the returned `fetch` applies it and translates
 * expiry, cancellation, and transport failure into distinct errors.
 *
 * @param options The caller, the target, the deadline, and the transport.
 * @returns Client options with the deadline and credentials applied.
 * @throws {ServiceBoundaryError} When the dependency was never declared.
 */
export function createServiceClientOptions(
  options: CreateServiceClientOptions,
): ServiceClientOptions {
  return serviceClientOptions(options);
}
