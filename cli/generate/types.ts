export type JsonSchema = Readonly<Record<string, unknown>>;

export interface ContractRequestLocation {
  readonly schema: JsonSchema;
  readonly contentType?: string;
  readonly maxBytes?: number;
}

export interface ContractResponse {
  readonly description: string;
  readonly schema: JsonSchema | null;
  readonly contentType?: string;
  readonly error?: boolean;
}

export interface ContractOperation {
  readonly operationId: string;
  readonly method: string;
  readonly path: string;
  readonly source: string;
  readonly summary: string;
  readonly request?: {
    readonly params?: ContractRequestLocation;
    readonly query?: ContractRequestLocation;
    readonly headers?: ContractRequestLocation;
    readonly body?: ContractRequestLocation;
  };
  readonly responses: Readonly<Record<number, ContractResponse>>;
  readonly security:
    | { readonly mode: "none" }
    | { readonly mode: "required"; readonly scheme: string };
  readonly pagination?: {
    readonly cursor?: string;
    readonly limit?: string;
    readonly envelope?: string;
  };
}

export interface ContractInventory {
  readonly serviceId: string;
  readonly title: string;
  readonly version: string;
  readonly description?: string;
  readonly operations: readonly ContractOperation[];
  readonly securitySchemes?: Readonly<Record<string, JsonSchema>>;
}

export interface GeneratedArtifact {
  readonly path:
    | "openapi.json"
    | "client.ts"
    | "api-docs.html"
    | "manifest.json";
  readonly content: string;
  readonly digest: string;
}

export interface GeneratedArtifacts {
  readonly inputDigest: string;
  readonly artifacts: readonly GeneratedArtifact[];
}

export interface ContractChange {
  readonly code: string;
  readonly severity: "breaking" | "additive";
  readonly serviceId: string;
  readonly operationId: string;
  readonly method: string;
  readonly path: string;
  readonly element: string;
  readonly before?: string;
  readonly after?: string;
  readonly source?: string;
  readonly guidance: string;
}

export interface GenerationDiagnostic {
  readonly code: string;
  readonly summary: string;
  readonly path?: string;
  readonly operationId?: string;
  readonly correction: string;
}

export interface GenerationResult {
  readonly ok: boolean;
  readonly command: "generate";
  readonly schema: "sleepy-hollow-generate-result/v1";
  readonly serviceId: string;
  readonly inputDigest: string;
  readonly artifacts: readonly {
    readonly path: string;
    readonly digest: string;
    readonly actualDigest?: string;
    readonly stale: boolean;
  }[];
  readonly changes: readonly ContractChange[];
  readonly diagnostics: readonly GenerationDiagnostic[];
  readonly wrote: boolean;
}

export interface GenerateOptions {
  readonly inventory: ContractInventory;
  readonly projectRoot: string;
  readonly check?: boolean;
  readonly previousOpenApi?: Readonly<Record<string, unknown>>;
}
