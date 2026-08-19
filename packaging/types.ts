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

/**
 * What the registry answered when asked which versions it holds.
 *
 * A failure carries evidence rather than an empty list, because "no versions"
 * and "no answer" must not be indistinguishable to the gate.
 */
export type RegistryListingResult =
  | { readonly ok: true; readonly versions: readonly string[] }
  | { readonly ok: false; readonly evidence: string };

/**
 * Resolves the versions a registry holds for one package.
 *
 * The seam keeps the gate verifiable without network access, and confines the
 * live query to the point of release.
 */
export type RegistryTransport = (
  name: string,
) => Promise<RegistryListingResult>;

export interface ReleaseRequest {
  readonly identity: PackageIdentity;
  readonly verificationPassed: boolean;
  readonly verificationEvidence: readonly string[];
  /** Resolves what the registry already holds; never a caller's assertion. */
  readonly registry: RegistryTransport;
  readonly uncommittedPaths: readonly string[];
}

export interface ReleaseResult {
  readonly schema: "sleepy-hollow-release-result/v1";
  readonly ok: boolean;
  readonly name: string;
  readonly version: string;
  readonly registries: readonly ["npm"];
  readonly runtime: "node-bun";
  readonly diagnostics: readonly ReleaseDiagnostic[];
}
