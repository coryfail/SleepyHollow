import { createHash } from "crypto";
import { parse } from "yaml";

import { PlanningError } from "./planning_error.ts";
import type {
  AcceptanceCriterion,
  ParsedRequirement,
  PlanningDiagnostic,
  RequirementApproval,
  RequirementKind,
  RequirementStatus,
} from "./types.ts";

const identifier = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const criterionIdentifier = /^AC-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const statuses = new Set<RequirementStatus>(["draft", "approved", "verified"]);

interface Heading {
  readonly title: string;
  readonly level: number;
  readonly line: number;
  readonly start: number;
  readonly contentStart: number;
}

function diagnostic(
  code: string,
  path: string,
  line: number,
  column: number,
  message: string,
  correction: string,
): PlanningDiagnostic {
  return { code, path, line, column, message, correction };
}

function lineAt(
  source: string,
  offset: number,
): { line: number; column: number } {
  const prefix = source.slice(0, offset);
  const lines = prefix.split(/\r?\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function frontmatterOf(source: string, path: string): {
  metadata: Record<string, unknown>;
  body: string;
  bodyOffset: number;
} {
  const opening = source.match(/^---(\r?\n)/);
  if (!opening) {
    throw new PlanningError([diagnostic(
      "SH_PLANNING_FRONTMATTER_REQUIRED",
      path,
      1,
      1,
      "The requirement must begin with a YAML frontmatter delimiter.",
      "Place a line containing exactly --- at the beginning of the file.",
    )]);
  }
  const lineEnding = opening[1];
  const contentStart = opening[0].length;
  const closingPattern = new RegExp(
    `^---(?:${lineEnding === "\r\n" ? "\\r\\n" : "\\n"}|$)`,
    "m",
  );
  const remainder = source.slice(contentStart);
  const closing = closingPattern.exec(remainder);
  if (!closing) {
    throw new PlanningError([diagnostic(
      "SH_PLANNING_FRONTMATTER_UNCLOSED",
      path,
      1,
      1,
      "The YAML frontmatter has no closing delimiter.",
      "Close the frontmatter with a line containing exactly ---.",
    )]);
  }
  const yamlSource = remainder.slice(0, closing.index);
  const bodyOffset = contentStart + closing.index + closing[0].length;
  const diagnostics: PlanningDiagnostic[] = [];
  const forbidden = [
    { pattern: /(^|[\s:[{,])[&*][A-Za-z0-9_-]+/m, name: "aliases or anchors" },
    { pattern: /^\s*<<\s*:/m, name: "merge keys" },
    { pattern: /(^|\s)![A-Za-z_][A-Za-z0-9:_-]*/m, name: "custom tags" },
    { pattern: /^\.\.\.\s*$/m, name: "multiple YAML documents" },
  ];
  for (const item of forbidden) {
    const match = item.pattern.exec(yamlSource);
    if (!match) continue;
    const location = lineAt(source, contentStart + match.index);
    diagnostics.push(diagnostic(
      "SH_PLANNING_YAML_FEATURE_FORBIDDEN",
      path,
      location.line,
      location.column,
      `Requirement frontmatter cannot use ${item.name}.`,
      "Use only YAML 1.2 core mappings, sequences, and scalar values.",
    ));
  }

  let metadata: unknown;
  try {
    metadata = parse(yamlSource, {
      uniqueKeys: true,
      schema: "core",
    });
  } catch (error) {
    const failure = error as {
      message?: string;
      mark?: { line?: number; column?: number };
    };
    const message = failure.message ?? String(error);
    diagnostics.push(diagnostic(
      /duplicat/i.test(message)
        ? "SH_PLANNING_YAML_DUPLICATE_KEY"
        : "SH_PLANNING_YAML_INVALID",
      path,
      (failure.mark?.line ?? 0) + 2,
      (failure.mark?.column ?? 0) + 1,
      `Invalid requirement frontmatter: ${message}`,
      "Correct the YAML frontmatter without adding proprietary syntax.",
    ));
  }
  if (
    metadata === null || typeof metadata !== "object" || Array.isArray(metadata)
  ) {
    diagnostics.push(diagnostic(
      "SH_PLANNING_FRONTMATTER_MAPPING_REQUIRED",
      path,
      2,
      1,
      "Requirement frontmatter must be one YAML mapping.",
      "Use named metadata fields at the top level.",
    ));
  }
  if (diagnostics.length > 0) throw new PlanningError(diagnostics);
  return {
    metadata: metadata as Record<string, unknown>,
    body: source.slice(bodyOffset),
    bodyOffset,
  };
}

function headingsOf(body: string): readonly Heading[] {
  const headings: Heading[] = [];
  const pattern = /^(#{2,6})[ \t]+(.+?)[ \t]*\r?$/gm;
  for (const match of body.matchAll(pattern)) {
    const start = match.index ?? 0;
    headings.push({
      title: match[2].trim(),
      level: match[1].length,
      line: body.slice(0, start).split(/\r?\n/).length,
      start,
      contentStart: start + match[0].length +
        (body[start + match[0].length] === "\n" ? 1 : 0),
    });
  }
  return headings;
}

function sectionsOf(
  body: string,
  headings: readonly Heading[],
): ReadonlyMap<string, string> {
  const sections = new Map<string, string>();
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    let end = body.length;
    for (let next = index + 1; next < headings.length; next += 1) {
      if (headings[next].level <= heading.level) {
        end = headings[next].start;
        break;
      }
    }
    sections.set(heading.title, body.slice(heading.contentStart, end).trim());
  }
  return sections;
}

function criteriaOf(
  body: string,
  headings: readonly Heading[],
  path: string,
  bodyStartLine: number,
): { criteria: AcceptanceCriterion[]; diagnostics: PlanningDiagnostic[] } {
  const criteria: AcceptanceCriterion[] = [];
  const diagnostics: PlanningDiagnostic[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!heading.title.toLowerCase().endsWith("acceptance criteria")) continue;
    let end = body.length;
    for (let next = index + 1; next < headings.length; next += 1) {
      if (headings[next].level <= heading.level) {
        end = headings[next].start;
        break;
      }
    }
    const section = body.slice(heading.contentStart, end);
    const lines = section.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (!/^\s*-\s+AC-/.test(line)) continue;
      const match = /^\s*-\s+(AC-[A-Z0-9]+(?:-[A-Z0-9]+)*):\s+(.\S.*|\S.*)$/
        .exec(line);
      const sourceLine = bodyStartLine + heading.line + lineIndex;
      if (!match || !criterionIdentifier.test(match[1])) {
        diagnostics.push(diagnostic(
          "SH_PLANNING_CRITERION_MALFORMED",
          path,
          sourceLine,
          1,
          "Acceptance criterion list item has a malformed identifier or empty behavior.",
          "Use - AC-STABLE-ID-001: Observable behavior.",
        ));
        continue;
      }
      const [, id, text] = match;
      if (seen.has(id)) {
        diagnostics.push(diagnostic(
          "SH_PLANNING_CRITERION_DUPLICATE",
          path,
          sourceLine,
          line.indexOf(id) + 1,
          `Acceptance criterion ${id} is duplicated.`,
          "Give every criterion a globally stable unique identifier.",
        ));
        continue;
      }
      seen.add(id);
      criteria.push({ id, text: text.trim(), line: sourceLine });
    }
  }
  return { criteria, diagnostics };
}

function stringList(
  value: unknown,
  field: string,
  path: string,
  diagnostics: PlanningDiagnostic[],
  allowEmpty: boolean,
): readonly string[] {
  if (
    !Array.isArray(value) || value.some((item) => typeof item !== "string") ||
    (!allowEmpty && value.length === 0)
  ) {
    diagnostics.push(diagnostic(
      "SH_PLANNING_METADATA_INVALID",
      path,
      2,
      1,
      `Frontmatter field ${field} must be ${
        allowEmpty ? "a" : "a non-empty"
      } string list.`,
      `Set ${field} to a YAML sequence of stable string values.`,
    ));
    return [];
  }
  if (new Set(value).size !== value.length) {
    diagnostics.push(diagnostic(
      "SH_PLANNING_METADATA_DUPLICATE",
      path,
      2,
      1,
      `Frontmatter field ${field} contains duplicate values.`,
      `Remove duplicate values from ${field}.`,
    ));
  }
  return value;
}

function digestOf(source: string, path: string): string {
  const markers = [...source.matchAll(/^## Governance record\r?$/gm)];
  if (markers.length !== 1) {
    throw new PlanningError([diagnostic(
      "SH_PLANNING_GOVERNANCE_BOUNDARY_INVALID",
      path,
      1,
      1,
      "A requirement must contain exactly one level-two Governance record heading.",
      "Place one ## Governance record after all governed behavior.",
    )]);
  }
  const governed = source.slice(0, markers[0].index);
  const frontmatter = governed.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)?.[0];
  if (!frontmatter) {
    throw new PlanningError([diagnostic(
      "SH_PLANNING_FRONTMATTER_REQUIRED",
      path,
      1,
      1,
      "The governed requirement has no complete leading frontmatter.",
      "Add one complete YAML frontmatter mapping.",
    )]);
  }
  const normalizedFrontmatter = frontmatter.replace(
    /^status:[^\r\n]*(?:\r?\n)/m,
    "",
  );
  if (normalizedFrontmatter === frontmatter) {
    throw new PlanningError([diagnostic(
      "SH_PLANNING_STATUS_REQUIRED",
      path,
      2,
      1,
      "Frontmatter must contain one top-level status projection.",
      "Add status: draft, approved, or verified.",
    )]);
  }
  const normalized = normalizedFrontmatter + governed.slice(frontmatter.length);
  return createHash("sha256").update(normalized).digest("hex");
}

function approvalOf(
  source: string,
  digest: string,
  criteria: readonly AcceptanceCriterion[],
): RequirementApproval | undefined {
  const governance = source.slice(source.indexOf("## Governance record"));
  const approvals = [...governance.matchAll(/^### Approval[^\r\n]*\r?$/gm)];
  const latest = approvals.at(-1);
  if (!latest || latest.index === undefined) return undefined;
  const approvalRemainder = governance.slice(
    latest.index + latest[0].length,
  );
  const next = approvalRemainder.search(/^### /m);
  const approval = next < 0
    ? approvalRemainder
    : approvalRemainder.slice(0, next);
  if (!/- Status:\s*approved\./.test(approval)) return undefined;
  const approver = /- Approver:\s*(.+?)\.?(?:\r?\n|$)/.exec(approval)?.[1]
    ?.replace(/\.$/, "");
  const approvedAt = /- Approved at:\s*(.+?)\.?(?:\r?\n|$)/.exec(approval)?.[1]
    ?.replace(/\.$/, "");
  const criterionText =
    /- Approved criteria:\s*(.+?)\.?(?:\r?\n|$)/.exec(approval)?.[1] ?? "";
  const recordedDigest = /sha256:([a-f0-9]{64})/.exec(approval)?.[1];
  const decisionSource = /- Decision source:\s*([\s\S]*?)(?=\r?\n- [A-Z]|$)/
    .exec(approval)?.[1]
    ?.replace(/\r?\n\s+/g, " ").trim().replace(/\.$/, "");
  const approvedCriteria = criteria.filter((item) =>
    criterionText.includes(item.id)
  ).map((item) => item.id);
  const valid = Boolean(
    approver && approvedAt && decisionSource && recordedDigest === digest &&
      criteria.length > 0 && approvedCriteria.length === criteria.length,
  );
  return {
    approver: approver ?? "",
    approvedAt: approvedAt ?? "",
    criteria: approvedCriteria,
    digest: recordedDigest ?? "",
    decisionSource: decisionSource ?? "",
    valid,
  };
}

function redStateValid(source: string): boolean {
  const governance = source.slice(source.indexOf("## Governance record"));
  const records = [
    ...governance.matchAll(/^### Red-state evidence[^\r\n]*\r?$/gm),
  ];
  const latest = records.at(-1);
  if (!latest || latest.index === undefined) return false;
  const remainder = governance.slice(latest.index + latest[0].length);
  const next = remainder.search(/^### /m);
  const record = next < 0 ? remainder : remainder.slice(0, next);
  return /- Status:\s*(?:credible red state captured|failed as expected)\./i
      .test(record) &&
    /- (?:Base revision|Observed at):\s*\S+/i.test(record) &&
    /- Result:\s*\S+/i.test(record);
}

export function parseRequirementDocument(
  source: string,
  path: string,
  kind: RequirementKind,
): ParsedRequirement {
  const { metadata, body, bodyOffset } = frontmatterOf(source, path);
  const diagnostics: PlanningDiagnostic[] = [];
  const requiredStrings = kind === "application"
    ? ["id", "title", "status", "risk"]
    : ["id", "path", "status", "service"];
  for (const field of requiredStrings) {
    if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
      diagnostics.push(diagnostic(
        "SH_PLANNING_METADATA_REQUIRED",
        path,
        2,
        1,
        `Frontmatter field ${field} is required and must be a non-empty string.`,
        `Add a valid ${field} value to the frontmatter.`,
      ));
    }
  }
  const id = typeof metadata.id === "string" ? metadata.id : "";
  if (id && !identifier.test(id)) {
    diagnostics.push(diagnostic(
      "SH_PLANNING_IDENTIFIER_INVALID",
      path,
      2,
      1,
      `Requirement identifier ${id} is not stable.`,
      "Use letters, numbers, dots, underscores, and hyphens without spaces.",
    ));
  }
  const status = metadata.status as RequirementStatus;
  if (!statuses.has(status)) {
    diagnostics.push(diagnostic(
      "SH_PLANNING_STATUS_INVALID",
      path,
      2,
      1,
      "Frontmatter status must be draft, approved, or verified.",
      "Use one documented lifecycle projection.",
    ));
  }
  const dependsOn = stringList(
    metadata.depends_on,
    "depends_on",
    path,
    diagnostics,
    true,
  );
  if (dependsOn.some((item) => !identifier.test(item))) {
    diagnostics.push(diagnostic(
      "SH_PLANNING_DEPENDENCY_INVALID",
      path,
      2,
      1,
      "A dependency is not a stable requirement identifier.",
      "Use stable requirement IDs in depends_on.",
    ));
  }
  if (kind === "application") {
    if (metadata.schema !== "sgad-application/v0.2") {
      diagnostics.push(diagnostic(
        "SH_PLANNING_SCHEMA_INVALID",
        path,
        2,
        1,
        "Application requirements must use schema sgad-application/v0.2.",
        "Set schema: sgad-application/v0.2.",
      ));
    }
    stringList(metadata.owners, "owners", path, diagnostics, false);
  } else {
    const routePath = typeof metadata.path === "string" ? metadata.path : "";
    if (!routePath.startsWith("/") || routePath.includes("..")) {
      diagnostics.push(diagnostic(
        "SH_PLANNING_ROUTE_PATH_INVALID",
        path,
        2,
        1,
        "Endpoint path must be an absolute safe route path.",
        "Use a path such as /bookmarks/:id.",
      ));
    }
    const methods = stringList(
      metadata.methods,
      "methods",
      path,
      diagnostics,
      false,
    );
    if (methods.some((method) => !/^[A-Z]+$/.test(method))) {
      diagnostics.push(diagnostic(
        "SH_PLANNING_METHOD_INVALID",
        path,
        2,
        1,
        "Endpoint methods must be uppercase HTTP method names.",
        "Use values such as GET, POST, PATCH, or DELETE.",
      ));
    }
  }

  const headings = headingsOf(body);
  const sections = sectionsOf(body, headings);
  const bodyStartLine = source.slice(0, bodyOffset).split(/\r?\n/).length;
  const criterionResult = criteriaOf(body, headings, path, bodyStartLine);
  diagnostics.push(...criterionResult.diagnostics);

  if (kind === "endpoint") {
    const requiredGroups = [
      ["Purpose"],
      ["Inputs", "Input"],
      ["Success responses", "Success response"],
      ["Errors", "Error responses"],
      ["Security"],
      ["Data access and indexes", "Data access"],
      ["Side effects"],
      ["Abuse considerations", "Rate-limit or abuse considerations"],
      ["Dependencies and assumptions"],
      ["Acceptance criteria"],
    ];
    for (const alternatives of requiredGroups) {
      if (alternatives.some((title) => sections.has(title))) continue;
      diagnostics.push(diagnostic(
        "SH_PLANNING_ENDPOINT_SECTION_MISSING",
        path,
        1,
        1,
        `Endpoint requirement is missing ${alternatives[0]}.`,
        `Add a Markdown heading named ${
          alternatives[0]
        } with explicit behavior.`,
      ));
    }
    const methods = Array.isArray(metadata.methods) ? metadata.methods : [];
    for (const method of methods) {
      if (typeof method === "string" && !sections.has(method)) {
        diagnostics.push(diagnostic(
          "SH_PLANNING_ENDPOINT_METHOD_SECTION_MISSING",
          path,
          1,
          1,
          `Endpoint requirement has no ${method} method section.`,
          `Add a ## ${method} heading.`,
        ));
      }
    }
    const security = sections.get("Security") ?? "";
    if (
      !/Authentication\s*:/i.test(security) ||
      !/Authorization\s*:/i.test(security)
    ) {
      diagnostics.push(diagnostic(
        "SH_PLANNING_ENDPOINT_SECURITY_INCOMPLETE",
        path,
        1,
        1,
        "Endpoint security must state authentication and authorization decisions.",
        "Add explicit Authentication: and Authorization: entries, including none when applicable.",
      ));
    }
  }
  if (criterionResult.criteria.length === 0) {
    diagnostics.push(diagnostic(
      "SH_PLANNING_CRITERIA_REQUIRED",
      path,
      1,
      1,
      "Requirement has no stable acceptance criteria.",
      "Add observable list items beneath an Acceptance criteria heading.",
    ));
  }
  if (diagnostics.length > 0) throw new PlanningError(diagnostics);

  const governedContentDigest = digestOf(source, path);
  const approval = approvalOf(
    source,
    governedContentDigest,
    criterionResult.criteria,
  );
  return {
    kind,
    path,
    source,
    body,
    metadata,
    id,
    status,
    dependsOn,
    criteria: criterionResult.criteria,
    sections,
    governedContentDigest,
    approval,
    redStateValid: redStateValid(source),
  };
}
