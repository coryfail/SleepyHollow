import type { CheckLocation, CheckResult } from "./types.ts";

function location(value: CheckLocation): string {
  return [
    value.path,
    value.route,
    value.requirementId,
    value.criterionId,
    value.field,
    value.operation,
    value.configKey,
  ].filter(Boolean).join(" · ");
}

export function human(result: CheckResult): string {
  const lines = [
    `hollow check ${result.ok ? "passed" : "failed"}`,
    `Scope: ${result.effectiveScope} (${result.selectedRequirements.length} requirements, ${result.selectedTests.length} tests)`,
    `Checks: ${result.summary.passed} passed, ${result.summary.failed} failed, ${result.summary.skipped} skipped`,
  ];
  for (const item of result.diagnostics) {
    const subject = location(item.location);
    lines.push(
      `${item.severity.toUpperCase()} ${item.code}: ${item.summary}${
        subject ? ` [${subject}]` : ""
      }`,
      `  ${item.correction}`,
    );
  }
  return lines.join("\n");
}

export function json(result: CheckResult): string {
  return JSON.stringify(result);
}
