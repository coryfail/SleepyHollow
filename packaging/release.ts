import type {
  ReleaseDiagnostic,
  ReleaseRequest,
  ReleaseResult,
} from "./types.ts";

const SEMVER = /^\d+\.\d+\.\d+$/;

export async function release(
  request: ReleaseRequest,
): Promise<ReleaseResult> {
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

  // Only the registry knows what it holds, and a published version is
  // immutable, so the question is asked at release time rather than answered
  // by the caller. An unanswered question is not permission to publish.
  const listing = await request.registry(identity.name);
  if (!listing.ok) {
    diagnostics.push({
      code: "SH_RELEASE_REGISTRY_UNAVAILABLE",
      summary:
        `The registry did not report which versions of ${identity.name} it holds.`,
      evidence: [listing.evidence],
      correction:
        "Resolve the registry failure and release again; the gate cannot " +
        "confirm the version is unused.",
    });
  } else if (listing.versions.includes(identity.version)) {
    diagnostics.push({
      code: "SH_RELEASE_VERSION_REUSED",
      summary: `Version ${identity.version} is already published.`,
      evidence: [...listing.versions],
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
    registries: ["npm"],
    runtime: "node-bun",
    diagnostics,
  };
}
