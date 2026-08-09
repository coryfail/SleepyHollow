import type { ValidationDiagnostic, ValidationIssue } from "./types.ts";

const problemType = "https://sleepyhollow.dev/problems";

export function safeSchemaIssueMessage(
  issue: Readonly<Record<string, unknown>>,
): string {
  const code = String(issue.code ?? "invalid_input");
  if (code === "invalid_format") {
    return issue.format === "url" ? "Invalid URL" : "Invalid format";
  }

  return {
    custom: "Value does not satisfy the declared schema",
    invalid_type: "Invalid input type",
    invalid_value: "Value is not an allowed option",
    invalid_union: "Value does not match an allowed shape",
    not_multiple_of: "Value is not an allowed multiple",
    too_big: "Value exceeds the allowed maximum",
    too_small: "Value is below the allowed minimum",
    unrecognized_keys: "Unrecognized key",
  }[code] ?? "Value does not satisfy the declared schema";
}

export function problem(
  status: number,
  title: string,
  instance: string,
  slug: string,
  errors?: readonly ValidationIssue[],
): Response {
  return new Response(
    JSON.stringify({
      type: `${problemType}/${slug}`,
      title,
      status,
      instance,
      ...(errors && errors.length > 0 ? { errors } : {}),
    }),
    {
      status,
      headers: { "content-type": "application/problem+json" },
    },
  );
}

export function formatValidationDiagnostic(
  diagnostic: ValidationDiagnostic,
): string {
  const issues = diagnostic.issues.map((issue) => {
    const path = issue.path.length > 0
      ? issue.path.map(String).join(".")
      : "<root>";
    return `  - ${issue.location}.${path}: ${issue.code} — ${issue.message}`;
  });

  return [
    `${diagnostic.code} [${diagnostic.severity}] ${diagnostic.summary}`,
    `Route: ${diagnostic.route}`,
    `Source: ${diagnostic.source}`,
    `Schema: ${diagnostic.schemaLocation}`,
    ...issues,
    `Correction: ${diagnostic.correction}`,
  ].join("\n");
}

export function validationDiagnosticResult(
  diagnostics: readonly ValidationDiagnostic[],
): {
  readonly version: 1;
  readonly diagnostics: readonly ValidationDiagnostic[];
} {
  return { version: 1, diagnostics };
}
