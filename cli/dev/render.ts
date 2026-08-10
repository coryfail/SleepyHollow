import type { DevDiagnostic, DevEvent } from "./types.ts";

function safeText(value: string): string {
  return [
    ...value
      .replace(
        /((?:api[-_]?key|token|secret(?:[-_]?key)?|password|credential)\s*[=:]\s*)\S+/gi,
        "$1<redacted>",
      )
      .replace(
        /(?:[A-Za-z]:\\|\/(?:Users|home|private|tmp)\/)[^\s,;]+/g,
        "<host-path>",
      ),
  ].map((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? "?" : character;
  }).join("").slice(0, 500);
}

function safeList(
  values: readonly string[] | undefined,
): readonly string[] | undefined {
  if (!values) return undefined;
  return Object.freeze([...new Set(values.map(safeText))].sort());
}

export function normalizeDiagnostic(
  diagnostic: DevDiagnostic,
): DevDiagnostic {
  return Object.freeze({
    code: /^SH_[A-Z0-9_]+$/.test(diagnostic.code)
      ? diagnostic.code
      : "SH_DEV_FAILED",
    severity: "error",
    summary: safeText(diagnostic.summary),
    correction: safeText(diagnostic.correction),
    ...(diagnostic.files?.length ? { files: safeList(diagnostic.files) } : {}),
    ...(diagnostic.routes?.length
      ? { routes: safeList(diagnostic.routes) }
      : {}),
    ...(diagnostic.configuration?.length
      ? { configuration: safeList(diagnostic.configuration) }
      : {}),
  });
}

export function normalizeDiagnostics(
  diagnostics: readonly DevDiagnostic[],
): readonly DevDiagnostic[] {
  return Object.freeze(
    diagnostics.map(normalizeDiagnostic).sort((left, right) =>
      `${left.code}:${left.files?.join(":") ?? ""}`.localeCompare(
        `${right.code}:${right.files?.join(":") ?? ""}`,
      )
    ),
  );
}

export function renderDevEvent(event: DevEvent, json: boolean): string {
  if (json) return JSON.stringify(event);
  const label = event.type === "diagnostic"
    ? `generation ${event.generation} rejected`
    : event.type === "shutdown"
    ? `development server stopped (${event.reason ?? "failure"})`
    : `${event.type} active at ${event.url} (generation ${event.generation}, ${event.routeCount} routes)`;
  const lines = [`[${event.sequence}] ${label}`];
  if (event.changedFiles?.length) {
    lines.push(`  changed: ${event.changedFiles.join(", ")}`);
  }
  for (const diagnostic of event.diagnostics) {
    lines.push(
      `  ERROR ${diagnostic.code}: ${diagnostic.summary}`,
      `    correction: ${diagnostic.correction}`,
    );
    if (diagnostic.files?.length) {
      lines.push(`    files: ${diagnostic.files.join(", ")}`);
    }
    if (diagnostic.routes?.length) {
      lines.push(`    routes: ${diagnostic.routes.join(", ")}`);
    }
    if (diagnostic.configuration?.length) {
      lines.push(`    configuration: ${diagnostic.configuration.join(", ")}`);
    }
  }
  return lines.join("\n");
}
