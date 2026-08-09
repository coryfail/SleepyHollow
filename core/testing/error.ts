import type { TestingDiagnostic } from "./types.ts";

/**
 * Thrown when a testing artifact is refused: a test claiming a criterion that
 * does not exist, a manifest that does not match the suite, or a red-state run
 * that is not credible evidence.
 */
export class TestingError extends Error {
  /** Every fault found, sorted by subject and then code. */
  readonly diagnostics: readonly TestingDiagnostic[];

  /**
   * Builds an error carrying every fault found.
   *
   * @param diagnostics The faults; they are sorted for stable output.
   */
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
