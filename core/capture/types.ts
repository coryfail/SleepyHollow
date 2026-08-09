/**
 * What kind of storage access was observed: a keyed read, an index query, a
 * read-modify-write, or unmediated raw access.
 */
export type CaptureOperationKind =
  | "get"
  | "query"
  | "read-modify-write"
  | "raw";

/** A request location a handler actually read during a captured run. */
export type CaptureRequestLocation = "params" | "query" | "headers" | "body";

/** Which criterion an observation is evidence for. */
export interface CaptureAttribution {
  /** Identifier of the requirement being verified. */
  readonly requirementId: string;
  /** Identifier of the acceptance criterion within it. */
  readonly criterionId: string;
}

/** One observed storage access. */
export interface CapturedDataOperation {
  /** Position in the run, so ordering survives serialization. */
  readonly sequence: number;
  /** Name of the resource accessed. */
  readonly resource: string;
  /** What kind of access this was. */
  readonly kind: CaptureOperationKind;
  /** The index used, for an index query. */
  readonly index?: string;
  /** The page size requested, for a listing. */
  readonly limit?: number;
  /** Whether the write presented a versionstamp. */
  readonly versionstampCheck?: boolean;
  /** Whether the write committed atomically with its index entries. */
  readonly atomic?: boolean;
  /** The recorded justification, for raw access. */
  readonly rawJustification?: string;
  /** The criterion this observation is evidence for. */
  readonly attribution?: CaptureAttribution;
}

/** One observed request and the response it produced. */
export interface CapturedRequest {
  /** Position in the run, so ordering survives serialization. */
  readonly sequence: number;
  /** The HTTP method. */
  readonly method: string;
  /** The route path, with parameters unsubstituted. */
  readonly path: string;
  /** Which request locations the handler actually read. */
  readonly readLocations: readonly CaptureRequestLocation[];
  /** Status of the response the handler produced. */
  readonly responseStatus: number;
  /** The criterion this observation is evidence for. */
  readonly attribution?: CaptureAttribution;
}

/** One route, named by method and path. */
export interface CaptureRouteIdentity {
  /** The HTTP method. */
  readonly method: string;
  /** The route path. */
  readonly path: string;
}

/**
 * An open recording of what a verification run did.
 *
 * Observations made between {@linkcode CaptureSession.enter} and
 * {@linkcode CaptureSession.exit} are attributed to that criterion, which is
 * what lets the artifact answer which criterion a given request is evidence
 * for rather than merely that the request happened.
 */
export interface CaptureSession {
  /** Identifies what produced this recording. */
  readonly runner: string;
  /** Revision of the tree under test. */
  readonly revision: string;
  /**
   * Attributes subsequent observations to a criterion.
   *
   * @param attribution The requirement and criterion being verified.
   */
  enter(attribution: CaptureAttribution): void;
  /** Ends the current attribution, restoring the enclosing one. */
  exit(): void;
  /**
   * Registers a route as one this run was expected to exercise.
   *
   * A declared route never observed is reported in the artifact's
   * `uncapturedRoutes`, which is how a silently untested endpoint surfaces.
   *
   * @param route The route expected to be exercised.
   */
  declareRoute(route: CaptureRouteIdentity): void;
  /**
   * Records one storage access.
   *
   * @param record The access; sequence and attribution are supplied here.
   */
  recordDataOperation(
    record: Omit<CapturedDataOperation, "sequence" | "attribution">,
  ): void;
  /**
   * Records one request and its response.
   *
   * @param record The exchange; sequence and attribution are supplied here.
   */
  recordRequest(
    record: Omit<CapturedRequest, "sequence" | "attribution">,
  ): void;
  /**
   * Snapshots the recording so far.
   *
   * @returns The artifact, safe to serialize.
   */
  artifact(): CaptureArtifact;
}

/**
 * A serialized recording of one run: the evidence `hollow check` reads.
 */
export interface CaptureArtifact {
  /** Identifies the artifact format. */
  readonly schema: "sleepy-hollow-capture/v1";
  /** What produced the recording. */
  readonly runner: string;
  /** Revision of the tree under test. */
  readonly revision: string;
  /** Every observed request, in order. */
  readonly requests: readonly CapturedRequest[];
  /** Every observed storage access, in order. */
  readonly dataOperations: readonly CapturedDataOperation[];
  /** Routes declared but never exercised. */
  readonly uncapturedRoutes: readonly CaptureRouteIdentity[];
}

/** How to open a capture session. */
export interface CaptureSessionOptions {
  /** Identifies what is producing the recording. */
  readonly runner: string;
  /** Revision of the tree under test. */
  readonly revision: string;
}
