export type ServiceArchitectureChoice =
  | "single-service"
  | "extraction-ready"
  | "multi-service";

export type PartialFailureStrategy =
  | "compensate"
  | "retry"
  | "reconcile"
  | "accept-inconsistency";

export interface ServiceDependency {
  readonly serviceId: string;
  readonly requirementsPath: string;
  readonly authenticationRequirementId: string;
  readonly failureCriteria: {
    readonly timeout: string;
    readonly unavailable: string;
    readonly nonSuccess: string;
    readonly partialFailure: string;
  };
  readonly partialFailure: {
    readonly strategy: PartialFailureStrategy;
    readonly atomic: false;
  };
}

export interface ServiceDefinition {
  readonly id: string;
  readonly root: string;
  readonly requirementsPath: string;
  readonly configPath: string;
  readonly apiRoot: string;
  readonly testsRoot: string;
  readonly generatedRoot: string;
  readonly deploymentConfigPath: string;
  readonly kvBinding: string;
  readonly dependencies: readonly ServiceDependency[];
}

export interface ServiceArchitecture {
  readonly choice: ServiceArchitectureChoice;
  readonly rationale?: string;
  readonly boundaries?: readonly {
    readonly id: string;
    readonly owner: string;
    readonly evidence: string;
  }[];
  readonly services: readonly ServiceDefinition[];
}

export interface ServiceDiagnostic {
  readonly code: string;
  readonly summary: string;
  readonly serviceId?: string;
  readonly source?: string;
  readonly target?: string;
  readonly correction: string;
}

export interface ServiceScaffoldResult {
  readonly ok: true;
  readonly schema: "sleepy-hollow-service-scaffold/v1";
  readonly choice: ServiceArchitectureChoice;
  readonly services: readonly {
    readonly id: string;
    readonly root: string;
    readonly createdPaths: readonly string[];
  }[];
}

export interface ServiceSource {
  readonly serviceId: string;
  readonly path: string;
  readonly content: string;
}

export interface ServiceCapabilityClaim {
  readonly requesterServiceId: string;
  readonly ownerServiceId: string;
  readonly bindingId: string;
  readonly source: string;
}

export interface BoundaryVerificationResult {
  readonly ok: true;
  readonly checkedSources: number;
  readonly checkedCapabilities: number;
}

export interface DeadlineScheduler {
  set(callback: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

export interface ServiceClientOptions {
  readonly baseUrl: string;
  readonly fetch: (request: Request) => Promise<Response>;
  readonly authenticate: (context: {
    readonly operationId: string;
    readonly request: Request;
  }) => Request | Promise<Request>;
  readonly responseValidation: "error";
}

export interface CreateServiceClientOptions {
  readonly architecture: ServiceArchitecture;
  readonly callerServiceId: string;
  readonly targetServiceId: string;
  readonly baseUrl: string;
  readonly requestId: string;
  readonly timeoutMs: number;
  readonly fetch: (request: Request) => Promise<Response>;
  readonly authenticate?: (context: {
    readonly operationId: string;
    readonly request: Request;
  }) => Request | Promise<Request>;
  readonly parentSignal?: AbortSignal;
  readonly scheduler?: DeadlineScheduler;
}
