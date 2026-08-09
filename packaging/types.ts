export interface PackageIdentity {
  readonly name: string;
  readonly version: string;
  readonly exports: Readonly<Record<string, string>>;
}

export interface ReleaseDiagnostic {
  readonly code: string;
  readonly summary: string;
  readonly evidence: readonly string[];
  readonly correction: string;
}

export interface ReleaseRequest {
  readonly identity: PackageIdentity;
  readonly verificationPassed: boolean;
  readonly verificationEvidence: readonly string[];
  readonly publishedVersions: readonly string[];
  readonly uncommittedPaths: readonly string[];
}

export interface ReleaseResult {
  readonly schema: "sleepy-hollow-release-result/v1";
  readonly ok: boolean;
  readonly name: string;
  readonly version: string;
  readonly registries: readonly ["jsr", "npm"];
  readonly runtime: "deno";
  readonly diagnostics: readonly ReleaseDiagnostic[];
}
