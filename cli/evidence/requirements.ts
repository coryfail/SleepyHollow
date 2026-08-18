import {
  parseRequirement,
  PlanningError,
} from "../../skills/sleepy-hollow/planning/mod.ts";
import { EvidenceError } from "./evidence_error.ts";
import type {
  EvidenceDiagnostic,
  EvidenceLoadOptions,
  LoadedRequirement,
  ProjectLocations,
  RequirementInventory,
} from "./types.ts";

interface DiscoveredFile {
  readonly path: string;
  readonly absolutePath: string;
  readonly serviceId?: string;
  readonly legacy: boolean;
}

function issue(
  code: string,
  path: string,
  summary: string,
  correction: string,
  line?: number,
): EvidenceDiagnostic {
  return { code, path, summary, correction, ...(line ? { line } : {}) };
}

async function collect(
  absoluteRoot: string,
  displayRoot: string,
  serviceId: string | undefined,
  options: EvidenceLoadOptions,
): Promise<readonly DiscoveredFile[]> {
  const list = options.listDirectory ?? (async (path: string) => {
    const entries = [];
    for await (const entry of Deno.readDir(path)) {
      entries.push({
        name: entry.name,
        isDirectory: entry.isDirectory,
        isFile: entry.isFile,
        isSymlink: entry.isSymlink,
      });
    }
    return entries;
  });
  const found: DiscoveredFile[] = [];
  const walk = async (absolute: string, display: string) => {
    let entries;
    try {
      entries = await list(absolute);
    } catch {
      return;
    }
    for (
      const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))
    ) {
      if (entry.isSymlink) continue;
      const nextAbsolute = `${absolute}/${entry.name}`;
      const nextDisplay = `${display}/${entry.name}`;
      if (entry.isDirectory) {
        await walk(nextAbsolute, nextDisplay);
      } else if (
        entry.isFile &&
        (entry.name.endsWith(".req.md") || entry.name === "requirements.md")
      ) {
        found.push({
          path: nextDisplay,
          absolutePath: nextAbsolute,
          legacy: entry.name === "requirements.md",
          ...(serviceId ? { serviceId } : {}),
        });
      }
    }
  };
  await walk(absoluteRoot, displayRoot);
  return found;
}

export async function requirements(
  project: ProjectLocations,
  options: EvidenceLoadOptions,
): Promise<RequirementInventory> {
  const read = options.readTextFile ??
    ((path: string) => Deno.readTextFile(path));
  const roots = project.services.length > 0
    ? project.services.map((service) => ({
      absolute: `${project.projectRoot}/${service.apiRoot}`,
      display: service.apiRoot,
      serviceId: service.id,
    }))
    : [{
      absolute: `${project.projectRoot}/${project.apiDirectory}`,
      display: project.apiDirectory,
      serviceId: undefined,
    }];

  const files: DiscoveredFile[] = [];
  for (const root of roots) {
    files.push(
      ...await collect(root.absolute, root.display, root.serviceId, options),
    );
  }
  files.sort((left, right) => left.path.localeCompare(right.path));

  const diagnostics: EvidenceDiagnostic[] = [];
  const loaded: LoadedRequirement[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    if (file.legacy) {
      diagnostics.push(issue(
        "SH_EVIDENCE_REQUIREMENT_LEGACY_FILENAME",
        file.path,
        "The legacy requirements.md filename is not a governed artifact in Sleepy Hollow 0.2.0.",
        "Rename it to a meaningful <feature>.req.md filename and update current references.",
      ));
      continue;
    }
    let source: string;
    try {
      source = await read(file.absolutePath);
    } catch {
      diagnostics.push(issue(
        "SH_EVIDENCE_REQUIREMENT_UNREADABLE",
        file.path,
        "A declared requirement could not be read.",
        "Repair the file permissions or remove the unreadable requirement.",
      ));
      continue;
    }
    let parsed;
    try {
      parsed = parseRequirement(source, file.path, "endpoint");
    } catch (error) {
      if (error instanceof PlanningError) {
        for (const item of error.diagnostics) {
          diagnostics.push(issue(
            "SH_EVIDENCE_REQUIREMENT_MALFORMED",
            item.path,
            item.message,
            item.correction,
            item.line,
          ));
        }
      } else {
        diagnostics.push(issue(
          "SH_EVIDENCE_REQUIREMENT_MALFORMED",
          file.path,
          error instanceof Error ? error.message : "Unparsable requirement.",
          "Repair the requirement so it parses as a governed document.",
        ));
      }
      continue;
    }
    const prior = seen.get(parsed.id);
    if (prior) {
      diagnostics.push(issue(
        "SH_EVIDENCE_REQUIREMENT_DUPLICATE",
        file.path,
        `Requirement ID ${parsed.id} duplicates ${prior}.`,
        "Give every requirement in the project a unique identity.",
      ));
      continue;
    }
    seen.set(parsed.id, file.path);
    const approvalBound = parsed.approval?.valid === true &&
      parsed.approval.digest === parsed.governedContentDigest;
    loaded.push({
      id: parsed.id,
      status: parsed.status,
      governedContentDigest: parsed.governedContentDigest,
      dependsOn: parsed.dependsOn,
      criteria: parsed.criteria.map((criterion) => ({
        id: criterion.id,
        text: criterion.text,
      })),
      ...(parsed.approval
        ? {
          approval: {
            valid: approvalBound,
            digest: parsed.approval.digest,
            criteria: parsed.approval.criteria,
          },
        }
        : {}),
      path: file.path,
      ...(file.serviceId ? { serviceId: file.serviceId } : {}),
      approvalBound,
    });
  }

  if (diagnostics.length > 0) throw new EvidenceError(diagnostics);

  const sorted = [...loaded].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
  return {
    requirements: sorted,
    checkRequirements: sorted.map((item) => ({
      id: item.id,
      status: item.status,
      governedContentDigest: item.governedContentDigest,
      ...(item.dependsOn ? { dependsOn: item.dependsOn } : {}),
      criteria: item.criteria,
      ...(item.approval ? { approval: item.approval } : {}),
      path: item.path,
      redStateValid: false,
    })),
  };
}
