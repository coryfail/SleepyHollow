import { plan } from "./plan.ts";
import {
  DEPLOY_TARGET_KINDS,
  type DeployAdapter,
  type DeployDiagnostic,
  type DeployPlan,
  type DeployRequest,
  type DeployResult,
  type SmokeTestOutcome,
} from "./types.ts";

function blocked(
  request: DeployRequest,
  built: DeployPlan,
  diagnostics: readonly DeployDiagnostic[],
): DeployResult {
  return {
    schema: "sleepy-hollow-deploy-result/v1",
    ok: false,
    command: "deploy",
    projectRoot: request.inventory.projectRootDisplay,
    outcome: "blocked",
    plan: built,
    smokeResults: [],
    diagnostics,
  };
}

export async function deploy(
  request: DeployRequest,
  adapter: DeployAdapter,
  now: () => string,
): Promise<DeployResult> {
  const { inventory } = request;
  const built = plan(inventory);

  if (!DEPLOY_TARGET_KINDS.includes(inventory.target.kind)) {
    return blocked(request, built, [{
      code: "SH_DEPLOY_TARGET_UNSUPPORTED",
      severity: "error",
      summary:
        `Deployment target ${inventory.target.kind} is not supported in this release.`,
      evidence: [`requested target: ${inventory.target.kind}`],
      correction: `Deploy to a supported target: ${
        DEPLOY_TARGET_KINDS.join(", ")
      }.`,
    }]);
  }

  if (!inventory.verification.ok) {
    const evidence = inventory.verification.diagnostics
      .filter((item) => item.severity === "error")
      .map((item) => `${item.code}: ${item.summary}`);
    return blocked(request, built, [{
      code: "SH_DEPLOY_VERIFICATION_FAILED",
      severity: "error",
      summary: "Required verification failed, so nothing was uploaded.",
      evidence: evidence.length > 0 ? evidence : [
        `hollow check reported ${inventory.verification.summary.failed} failed checks`,
      ],
      correction: "Resolve every reported diagnostic and rerun hollow check.",
    }]);
  }

  if (built.unchanged) {
    return {
      schema: "sleepy-hollow-deploy-result/v1",
      ok: true,
      command: "deploy",
      projectRoot: inventory.projectRootDisplay,
      outcome: "unchanged",
      plan: built,
      deployedRevision: inventory.revision,
      openApiPath: inventory.openApiPath,
      documentationPath: inventory.documentationPath,
      smokeResults: [],
      completedAt: now(),
      diagnostics: [],
    };
  }

  if (built.requiresConfirmation && !request.confirmed) {
    return {
      schema: "sleepy-hollow-deploy-result/v1",
      ok: false,
      command: "deploy",
      projectRoot: inventory.projectRootDisplay,
      outcome: "confirmation-required",
      plan: built,
      smokeResults: [],
      diagnostics: [{
        code: "SH_DEPLOY_CONFIRMATION_REQUIRED",
        severity: "error",
        summary:
          "The first external deployment or a materially risky change requires explicit confirmation.",
        evidence: [
          `target: ${inventory.target.kind}:${inventory.target.project}`,
          `revision: ${inventory.revision}`,
        ],
        correction: "Review the deployment plan and confirm before deploying.",
      }],
    };
  }

  const upload = await adapter.upload({
    target: inventory.target,
    revision: inventory.revision,
    token: request.token,
  });
  const health = await adapter.health({ url: upload.url });
  const smokeResults: SmokeTestOutcome[] = [];
  for (const test of inventory.smokeTests) {
    smokeResults.push(await adapter.smoke({ url: upload.url, test }));
  }

  const requiredFailures = smokeResults.filter((outcome, index) =>
    outcome.status === "failed" && inventory.smokeTests[index].required
  );
  const failed = health.status === "failed" || requiredFailures.length > 0;

  return {
    schema: "sleepy-hollow-deploy-result/v1",
    ok: !failed,
    command: "deploy",
    projectRoot: inventory.projectRootDisplay,
    outcome: failed ? "smoke-failed" : "deployed",
    plan: built,
    url: upload.url,
    deployedRevision: upload.revision,
    openApiPath: inventory.openApiPath,
    documentationPath: inventory.documentationPath,
    health,
    smokeResults,
    completedAt: now(),
    diagnostics: failed
      ? [{
        code: "SH_DEPLOY_SMOKE_FAILED",
        severity: "error",
        summary:
          "The deployment is live but a required smoke test failed. It is not a successful deployment.",
        evidence: [
          `live revision: ${upload.revision}`,
          ...(health.status === "failed" ? [`health: ${health.evidence}`] : []),
          ...requiredFailures.map((outcome) =>
            `${outcome.id}: ${outcome.evidence}`
          ),
        ],
        correction:
          "Investigate the live revision, then repair and redeploy or roll back.",
      }]
      : [],
  };
}
