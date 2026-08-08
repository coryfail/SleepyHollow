import type {
  ReleaseDiagnostic,
  ReleaseRequest,
  ReleaseResult,
} from "./types.ts";

const SEMVER = /^\d+\.\d+\.\d+$/;

export function release(request: ReleaseRequest): ReleaseResult {
  const diagnostics: ReleaseDiagnostic[] = [];
  const { identity } = request;

  if (!identity.name || !SEMVER.test(identity.version)) {
    diagnostics.push({
      code: "SH_RELEASE_IDENTITY_INVALID",
      summary: "A release requires one package name and one semantic version.",
      evidence: [`name: ${identity.name}`, `version: ${identity.version}`],
      correction: "Declare a name and a semantic version before releasing.",
    });
  }

  if (Object.keys(identity.exports).length === 0) {
    diagnostics.push({
      code: "SH_RELEASE_EXPORTS_MISSING",
      summary: "A release requires an explicit export map.",
      evidence: ["exports: none declared"],
      correction: "Declare every supported entry point in the export map.",
    });
  }

  if (!request.verificationPassed) {
    diagnostics.push({
      code: "SH_RELEASE_VERIFICATION_FAILED",
      summary: "Verification does not pass for the revision being published.",
      evidence: [...request.verificationEvidence],
      correction: "Resolve the failing checks and rerun verification.",
    });
  }

  if (request.publishedVersions.includes(identity.version)) {
    diagnostics.push({
      code: "SH_RELEASE_VERSION_REUSED",
      summary: `Version ${identity.version} is already published.`,
      evidence: [...request.publishedVersions],
      correction: "Raise the version before releasing again.",
    });
  }

  if (request.uncommittedPaths.length > 0) {
    diagnostics.push({
      code: "SH_RELEASE_TREE_DIRTY",
      summary: "The working tree has uncommitted changes.",
      evidence: [...request.uncommittedPaths],
      correction: "Commit or stash every change before releasing.",
    });
  }

  return {
    schema: "sleepy-hollow-release-result/v1",
    ok: diagnostics.length === 0,
    name: identity.name,
    version: identity.version,
    registries: ["jsr", "npm"],
    runtime: "deno",
    diagnostics,
  };
}
