import { redactSecurityData } from "../../core/security/mod.ts";
import type { DeployResult } from "./types.ts";

const outcomes: Readonly<Record<DeployResult["outcome"], string>> = {
  deployed: "Deployed",
  unchanged: "No change",
  blocked: "Blocked before upload",
  "confirmation-required": "Awaiting confirmation",
  "smoke-failed": "Deployed with failed smoke tests",
};

export function human(result: DeployResult): string {
  const lines: string[] = [];
  const { plan } = result;
  lines.push(
    `${outcomes[result.outcome]}: ${plan.target.kind}:${plan.target.project}`,
  );
  lines.push(`  revision       ${plan.revision}`);
  if (plan.deployedRevision) {
    lines.push(`  previously     ${plan.deployedRevision}`);
  }
  if (result.url) lines.push(`  url            ${result.url}`);
  if (result.deployedRevision) {
    lines.push(`  live revision  ${result.deployedRevision}`);
  }
  if (result.openApiPath) {
    lines.push(`  openapi        ${result.openApiPath}`);
  }
  if (result.documentationPath) {
    lines.push(`  documentation  ${result.documentationPath}`);
  }
  if (result.completedAt) {
    lines.push(`  completed      ${result.completedAt}`);
  }
  for (const change of plan.environmentKeyChanges) {
    lines.push(`  env ${change.change}    ${change.key}`);
  }
  for (const change of plan.contractChanges) {
    lines.push(
      `  contract       ${change.severity} ${change.code} ${change.operationId}`,
    );
  }
  if (result.health) {
    lines.push(
      `  health         ${result.health.status} ${result.health.evidence}`,
    );
  }
  for (const outcome of result.smokeResults) {
    lines.push(
      `  smoke          ${outcome.id} ${outcome.status} ${outcome.evidence}`,
    );
  }
  for (const diagnostic of result.diagnostics) {
    lines.push(
      `  ${diagnostic.severity}: ${diagnostic.code} ${diagnostic.summary}`,
    );
    for (const evidence of diagnostic.evidence) {
      lines.push(`      ${evidence}`);
    }
    lines.push(`      correction: ${diagnostic.correction}`);
  }
  return `${lines.join("\n")}\n`;
}

export function json(result: DeployResult): string {
  return `${JSON.stringify(redactSecurityData(result), null, 2)}\n`;
}
