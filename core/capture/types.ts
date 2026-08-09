export type CaptureOperationKind =
  | "get"
  | "query"
  | "read-modify-write"
  | "raw";

export type CaptureRequestLocation = "params" | "query" | "headers" | "body";

export interface CaptureAttribution {
  readonly requirementId: string;
  readonly criterionId: string;
}

export interface CapturedDataOperation {
  readonly sequence: number;
  readonly resource: string;
  readonly kind: CaptureOperationKind;
  readonly index?: string;
  readonly limit?: number;
  readonly versionstampCheck?: boolean;
  readonly atomic?: boolean;
  readonly rawJustification?: string;
  readonly attribution?: CaptureAttribution;
}

export interface CapturedRequest {
  readonly sequence: number;
  readonly method: string;
  readonly path: string;
  readonly readLocations: readonly CaptureRequestLocation[];
  readonly responseStatus: number;
  readonly attribution?: CaptureAttribution;
}

export interface CaptureRouteIdentity {
  readonly method: string;
  readonly path: string;
}

export interface CaptureSession {
  readonly runner: string;
  readonly revision: string;
  enter(attribution: CaptureAttribution): void;
  exit(): void;
  declareRoute(route: CaptureRouteIdentity): void;
  recordDataOperation(
    record: Omit<CapturedDataOperation, "sequence" | "attribution">,
  ): void;
  recordRequest(
    record: Omit<CapturedRequest, "sequence" | "attribution">,
  ): void;
  artifact(): CaptureArtifact;
}

export interface CaptureArtifact {
  readonly schema: "sleepy-hollow-capture/v1";
  readonly runner: string;
  readonly revision: string;
  readonly requests: readonly CapturedRequest[];
  readonly dataOperations: readonly CapturedDataOperation[];
  readonly uncapturedRoutes: readonly CaptureRouteIdentity[];
}

export interface CaptureSessionOptions {
  readonly runner: string;
  readonly revision: string;
}
