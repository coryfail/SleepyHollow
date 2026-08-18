import { pathToFileURL } from "node:url";

import { EvidenceError } from "./evidence_error.ts";
import type {
  EvidenceDiagnostic,
  EvidenceLoadOptions,
  ProjectLocations,
  ServiceLocations,
} from "./types.ts";

const CONFIG_FILE = "sleepyhollow.config.ts";
const SERVICES_FILE = "sleepyhollow.services.json";

function issue(
  code: string,
  path: string,
  summary: string,
  correction: string,
): EvidenceDiagnostic {
  return { code, path, summary, correction };
}

function isRelativeInside(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 &&
    !value.startsWith("/") && !value.startsWith("..") &&
    !value.includes("://");
}

async function readConfiguration(
  projectRoot: string,
): Promise<Record<string, unknown>> {
  const path = `${projectRoot}/${CONFIG_FILE}`;
  try {
    await Deno.stat(path);
  } catch {
    throw new EvidenceError([issue(
      "SH_EVIDENCE_PROJECT_CONFIG_MISSING",
      CONFIG_FILE,
      `No ${CONFIG_FILE} exists at the project root.`,
      "Run hollow create, or point the command at a Sleepy Hollow project.",
    )]);
  }
  let imported: { default?: unknown };
  try {
    imported = await import(pathToFileURL(path).href);
  } catch (error) {
    throw new EvidenceError([issue(
      "SH_EVIDENCE_PROJECT_CONFIG_INVALID",
      CONFIG_FILE,
      `The project configuration could not be loaded: ${
        error instanceof Error ? error.message : "unknown error"
      }.`,
      "Repair the project configuration so it evaluates without error.",
    )]);
  }
  const config = imported.default;
  if (typeof config !== "object" || config === null) {
    throw new EvidenceError([issue(
      "SH_EVIDENCE_PROJECT_CONFIG_INVALID",
      CONFIG_FILE,
      "The project configuration has no default exported project object.",
      "Export a SleepyHollowProject as the module default.",
    )]);
  }
  return config as Record<string, unknown>;
}

async function readServices(
  projectRoot: string,
): Promise<readonly ServiceLocations[]> {
  const path = `${projectRoot}/${SERVICES_FILE}`;
  let source: string;
  try {
    source = await Deno.readTextFile(path);
  } catch {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new EvidenceError([issue(
      "SH_EVIDENCE_SERVICES_INVALID",
      SERVICES_FILE,
      "The service declaration is not valid JSON.",
      "Repair the service declaration before loading evidence.",
    )]);
  }
  const declared = (parsed as { services?: unknown }).services;
  if (!Array.isArray(declared)) return [];
  const diagnostics: EvidenceDiagnostic[] = [];
  const services: ServiceLocations[] = [];
  for (const entry of declared) {
    const id = (entry as { id?: unknown }).id;
    const root = (entry as { root?: unknown }).root;
    if (typeof id !== "string" || !isRelativeInside(root)) {
      diagnostics.push(issue(
        "SH_EVIDENCE_SERVICE_INVALID",
        SERVICES_FILE,
        "A declared service is missing an identifier or a project-relative root.",
        "Give every service a stable id and a root inside the project.",
      ));
      continue;
    }
    services.push({
      id,
      root,
      apiRoot: `${root}/api`,
      requirementsPath: `${root}/requirements/application.req.md`,
      generatedRoot: `${root}/generated`,
      testsRoot: `${root}/tests`,
    });
  }
  if (diagnostics.length > 0) throw new EvidenceError(diagnostics);
  return services.sort((left, right) => left.id.localeCompare(right.id));
}

export async function locations(
  options: EvidenceLoadOptions,
): Promise<ProjectLocations> {
  const config = await readConfiguration(options.projectRoot);
  const diagnostics: EvidenceDiagnostic[] = [];
  const fields = [
    "name",
    "apiDirectory",
    "requirementsFile",
    "generatedDirectory",
  ] as const;
  for (const field of fields) {
    const value = config[field];
    if (typeof value !== "string" || value.length === 0) {
      diagnostics.push(issue(
        "SH_EVIDENCE_PROJECT_CONFIG_INVALID",
        CONFIG_FILE,
        `The project configuration is missing a ${field} value.`,
        `Declare ${field} in the SleepyHollowProject configuration.`,
      ));
      continue;
    }
    if (field !== "name" && !isRelativeInside(value)) {
      diagnostics.push(issue(
        "SH_EVIDENCE_PROJECT_CONFIG_INVALID",
        CONFIG_FILE,
        `The declared ${field} must be a project-relative location.`,
        `Declare ${field} as a location inside the project root.`,
      ));
    }
  }
  const requirementsFile = config.requirementsFile;
  if (
    typeof requirementsFile === "string" &&
    (requirementsFile === "requirements.md" ||
      requirementsFile === "requirements/application.md" ||
      requirementsFile.endsWith("/requirements.md"))
  ) {
    diagnostics.push(issue(
      "SH_EVIDENCE_REQUIREMENT_LEGACY_FILENAME",
      requirementsFile,
      "The configured application requirement uses the legacy requirements.md filename.",
      "Rename it to requirements/application.req.md and update requirementsFile.",
    ));
  } else if (
    typeof requirementsFile === "string" &&
    !requirementsFile.endsWith(".req.md")
  ) {
    diagnostics.push(issue(
      "SH_EVIDENCE_PROJECT_CONFIG_INVALID",
      CONFIG_FILE,
      "The configured application requirement is not a named .req.md artifact.",
      "Set requirementsFile to a project-relative path ending in .req.md.",
    ));
  }
  if (diagnostics.length > 0) throw new EvidenceError(diagnostics);
  return {
    projectRoot: options.projectRoot,
    name: config.name as string,
    apiDirectory: config.apiDirectory as string,
    requirementsFile: config.requirementsFile as string,
    generatedDirectory: config.generatedDirectory as string,
    services: await readServices(options.projectRoot),
  };
}
