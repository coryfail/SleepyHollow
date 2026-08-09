import type { TestingDiagnostic } from "./types.ts";

export class TestingError extends Error {
  readonly diagnostics: readonly TestingDiagnostic[];

  constructor(diagnostics: readonly TestingDiagnostic[]) {
    super("Sleepy Hollow testing validation failed");
    this.name = "TestingError";
    this.diagnostics = [...diagnostics].sort((left, right) =>
      (left.subject ?? "").localeCompare(right.subject ?? "") ||
      left.code.localeCompare(right.code)
    );
  }
}

export function testingDiagnostic(
  code: string,
  message: string,
  correction: string,
  subject?: string,
): TestingDiagnostic {
  return { code, message, subject, correction };
}
