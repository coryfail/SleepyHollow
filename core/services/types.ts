/**
 * How a project is decomposed: one service, one service kept separable, or
 * several deployed independently.
 */
export type ServiceArchitectureChoice =
  | "single-service"
  | "extraction-ready"
  | "multi-service";

/**
 * What a caller does when a cross-service call leaves work half-done.
 *
 * There is no "atomic" option, because a call across a service boundary cannot
 * be made atomic; the strategy states how the inconsistency is resolved.
 */
export type PartialFailureStrategy =
  | "compensate"
  | "retry"
  | "reconcile"
  | "accept-inconsistency";

/**
 * One service's declared reliance on another, including what it does when the
 * call fails. The failure criteria are required, so no dependency is declared
 * without stating its behaviour under failure.
 */
export interface ServiceDependency {
  /** Identifier of the service depended on. */
  readonly serviceId: string;
  /** Path to that service's requirements. */
  readonly requirementsPath: string;
  /** Requirement governing how the caller authenticates. */
  readonly authenticationRequirementId: string;
  /** Required behaviour under each failure mode. */
  readonly failureCriteria: {
    readonly timeout: string;
    readonly unavailable: string;
    readonly nonSuccess: string;
    readonly partialFailure: string;
  };
  /** How half-completed work is resolved; never atomically. */
  readonly partialFailure: {
    readonly strategy: PartialFailureStrategy;
    readonly atomic: false;
  };
}

/** One service: what it is, where its files live, and what it depends on. */
export interface ServiceDefinition {
  /** Identifier, unique within the architecture. */
  readonly id: string;
  /** Root directory of the service's workspace. */
  readonly root: string;
  /** Path to the service's requirements. */
  readonly requirementsPath: string;
  /** Path to the service's configuration module. */
  readonly configPath: string;
  /** Directory the service's routes are discovered from. */
  readonly apiRoot: string;
  /** Directory holding the service's tests. */
  readonly testsRoot: string;
  /** Directory for generated artifacts. */
  readonly generatedRoot: string;
  /** Path to the service's deployment configuration. */
  readonly deploymentConfigPath: string;
  /** The KV binding this service owns; no other service may open it. */
  readonly kvBinding: string;
  /** The other services this one may call. */
  readonly dependencies: readonly ServiceDependency[];
}

/** The whole decomposition: the choice made, why, and the services in it. */
export interface ServiceArchitecture {
  /** How the project is decomposed. */
  readonly choice: ServiceArchitectureChoice;
  /** Why that choice was made. */
  readonly rationale?: string;
  /** Owned domains, and the evidence for each ownership claim. */
  readonly boundaries?: readonly {
    readonly id: string;
    readonly owner: string;
    readonly evidence: string;
  }[];
  /** Every service in the architecture. */
  readonly services: readonly ServiceDefinition[];
}

/** One reason an architecture or a boundary check was refused. */
export interface ServiceDiagnostic {
  /** Stable machine-readable identifier for this kind of fault. */
  readonly code: string;
  /** What is wrong, in one sentence. */
  readonly summary: string;
  /** The service concerned, when the fault is specific to one. */
  readonly serviceId?: string;
  /** Where the violation was found. */
  readonly source?: string;
  /** What was reached that should not have been. */
  readonly target?: string;
  /** What to change to resolve it. */
  readonly correction: string;
}

/** What scaffolding created, per service. */
export interface ServiceScaffoldResult {
  /** Always true; failures are thrown rather than returned. */
  readonly ok: true;
  /** Identifies the result format. */
  readonly schema: "sleepy-hollow-service-scaffold/v1";
  /** The decomposition that was scaffolded. */
  readonly choice: ServiceArchitectureChoice;
  /** Each service, and the paths created for it. */
  readonly services: readonly {
    readonly id: string;
    readonly root: string;
    readonly createdPaths: readonly string[];
  }[];
}

/** One source file, attributed to the service it belongs to. */
export interface ServiceSource {
  /** The service this file belongs to. */
  readonly serviceId: string;
  /** Path of the file. */
  readonly path: string;
  /** The file's contents, as analysed. */
  readonly content: string;
}

/** A claim that one service may open storage another service owns. */
export interface ServiceCapabilityClaim {
  /** The service asking for access. */
  readonly requesterServiceId: string;
  /** The service that owns the binding. */
  readonly ownerServiceId: string;
  /** The binding being claimed. */
  readonly bindingId: string;
  /** Where the claim was declared. */
  readonly source: string;
}

/** What a passing boundary check examined. */
export interface BoundaryVerificationResult {
  /** Always true; violations are thrown rather than returned. */
  readonly ok: true;
  /** How many source files were examined. */
  readonly checkedSources: number;
  /** How many capability claims were examined. */
  readonly checkedCapabilities: number;
}

/** Timer seam used to enforce deadlines; override it to test them. */
export interface DeadlineScheduler {
  /**
   * Schedules a callback.
   *
   * @param callback Runs when the delay elapses.
   * @param delayMs How long to wait.
   * @returns A handle for {@linkcode DeadlineScheduler.clear}.
   */
  set(callback: () => void, delayMs: number): unknown;
  /**
   * Cancels a scheduled callback.
   *
   * @param handle A handle from {@linkcode DeadlineScheduler.set}.
   */
  clear(handle: unknown): void;
}

/** A resolved client for calling one service from another. */
export interface ServiceClientOptions {
  /** Base URL of the service being called. */
  readonly baseUrl: string;
  /** Performs the call, with the deadline already applied. */
  readonly fetch: (request: Request) => Promise<Response>;
  /** Attaches credentials to each outgoing request. */
  readonly authenticate: (context: {
    readonly operationId: string;
    readonly request: Request;
  }) => Request | Promise<Request>;
  /** A response failing its schema is an error, never a silent pass. */
  readonly responseValidation: "error";
}

/**
 * How to build a client for a declared dependency.
 *
 * The call is checked against the architecture, so a service cannot construct
 * a client for a service it never declared a dependency on.
 */
export interface CreateServiceClientOptions {
  /** The architecture the call is checked against. */
  readonly architecture: ServiceArchitecture;
  /** The service making the call. */
  readonly callerServiceId: string;
  /** The service being called. */
  readonly targetServiceId: string;
  /** Base URL of the target service. */
  readonly baseUrl: string;
  /** Correlates the call with the request that caused it. */
  readonly requestId: string;
  /** Deadline for the call; it is always bounded. */
  readonly timeoutMs: number;
  /** Performs the underlying call. */
  readonly fetch: (request: Request) => Promise<Response>;
  /** Attaches credentials; omit when the dependency needs none. */
  readonly authenticate?: (context: {
    readonly operationId: string;
    readonly request: Request;
  }) => Request | Promise<Request>;
  /** Cancels the call when the originating request is abandoned. */
  readonly parentSignal?: AbortSignal;
  /** Timer seam; override to test deadline behaviour. */
  readonly scheduler?: DeadlineScheduler;
}
