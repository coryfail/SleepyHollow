import type { ServiceDiagnostic } from "./types.ts";

export class ServiceArchitectureError extends Error {
  constructor(readonly diagnostics: readonly ServiceDiagnostic[]) {
    super("Sleepy Hollow service architecture failed");
    this.name = "ServiceArchitectureError";
  }
}

export class ServiceBoundaryError extends Error {
  constructor(readonly diagnostics: readonly ServiceDiagnostic[]) {
    super("Sleepy Hollow service boundary failed");
    this.name = "ServiceBoundaryError";
  }
}

export class ServiceDeadlineError extends Error {
  constructor() {
    super("The outbound service deadline expired");
    this.name = "ServiceDeadlineError";
  }
}

export class ServiceCancelledError extends Error {
  constructor() {
    super("The outbound service request was cancelled");
    this.name = "ServiceCancelledError";
  }
}

export class ServiceUnavailableError extends Error {
  constructor() {
    super("The outbound service transport is unavailable");
    this.name = "ServiceUnavailableError";
  }
}
