import type { ServiceDiagnostic } from "./types.ts";

/** Thrown when an architecture declaration is malformed or inconsistent. */
export class ServiceArchitectureError extends Error {
  /**
   * Builds an error carrying every fault found in the declaration.
   *
   * @param diagnostics Every fault found, in the order detected.
   */
  constructor(readonly diagnostics: readonly ServiceDiagnostic[]) {
    super("Sleepy Hollow service architecture failed");
    this.name = "ServiceArchitectureError";
  }
}

/**
 * Thrown when source violates the architecture: a service reaching storage it
 * does not own, or calling a service it never declared a dependency on.
 */
export class ServiceBoundaryError extends Error {
  /**
   * Builds an error carrying every violation found.
   *
   * @param diagnostics Every violation found, in the order detected.
   */
  constructor(readonly diagnostics: readonly ServiceDiagnostic[]) {
    super("Sleepy Hollow service boundary failed");
    this.name = "ServiceBoundaryError";
  }
}

/** Thrown when an outbound call exceeds its deadline. */
export class ServiceDeadlineError extends Error {
  /** Builds the error; the deadline is carried by the call that set it. */
  constructor() {
    super("The outbound service deadline expired");
    this.name = "ServiceDeadlineError";
  }
}

/**
 * Thrown when an outbound call is abandoned because the request that caused it
 * was abandoned first.
 */
export class ServiceCancelledError extends Error {
  /** Builds the error. */
  constructor() {
    super("The outbound service request was cancelled");
    this.name = "ServiceCancelledError";
  }
}

/** Thrown when the transport to another service cannot be reached at all. */
export class ServiceUnavailableError extends Error {
  /** Builds the error. */
  constructor() {
    super("The outbound service transport is unavailable");
    this.name = "ServiceUnavailableError";
  }
}
