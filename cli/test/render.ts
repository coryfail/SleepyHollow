import type { TestCommandResult, TestCommandTestResult } from "./types.ts";

function group(
  label: string,
  status: TestCommandTestResult["status"],
  result: TestCommandResult,
): string[] {
  const tests = result.tests.filter((test) => test.status === status);
  return [
    `${label} (${tests.length})`,
    ...tests.map((test) =>
      `  ${test.id} · ${test.file} · ${test.name}${
        test.criteria.length ? ` · ${test.criteria.join(", ")}` : ""
      }`
    ),
  ];
}

export function renderHuman(result: TestCommandResult): string {
  const lines = [
    result.ok ? "Test run passed." : "Test run failed.",
    ...group("Passed", "passed", result),
    ...group("Failed", "failed", result),
    ...group("Skipped", "skipped", result),
    ...group("Unmapped", "unmapped", result),
    `Criteria: ${result.summary.passingCriteria} passing, ${result.summary.failingCriteria} failing, ${result.summary.skippedCriteria} skipped, ${result.summary.unmappedCriteria} unmapped`,
  ];
  for (const diagnostic of result.diagnostics) {
    lines.push(
      `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.summary}`,
    );
    if (diagnostic.testId) lines.push(`  test: ${diagnostic.testId}`);
    if (diagnostic.file) lines.push(`  file: ${diagnostic.file}`);
    if (diagnostic.criteria?.length) {
      lines.push(`  criteria: ${diagnostic.criteria.join(", ")}`);
    }
    lines.push(`  correction: ${diagnostic.correction}`);
  }
  return lines.join("\n");
}

export function renderJson(result: TestCommandResult): string {
  return JSON.stringify(result);
}
