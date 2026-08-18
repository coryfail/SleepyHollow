import { parseRequirementDocument } from "./parser.ts";
import { PlanningError } from "./planning_error.ts";
import type {
  DecompositionPlan,
  EndpointProposal,
  ParsedRequirement,
  PlanningDecision,
  PlanningDecisionResult,
  PlanningDiagnostic,
  PlanningDocument,
  ProposedRequirementFile,
} from "./types.ts";

const applicationSections = [
  "Purpose and user goals",
  "Actors and API consumers",
  "In scope and out of scope",
  "Resource and data model",
  "Proposed endpoints and methods",
  "Relationships and indexes",
  "Request and response conventions",
  "Error behavior",
  "Authentication and authorization",
  "Security constraints",
  "Deployment model",
  "Service architecture",
  "Cross-cutting acceptance criteria",
  "Endpoint inventory and dependencies",
  "Open questions, assumptions, and risks",
] as const;

function issue(
  code: string,
  path: string,
  message: string,
  correction: string,
  line = 1,
): PlanningDiagnostic {
  return { code, path, line, column: 1, message, correction };
}

export function validateApplication(
  source: string,
  path = "requirements/application.req.md",
): ParsedRequirement {
  const parsed = parseRequirementDocument(source, path, "application");
  const diagnostics = applicationSections.filter((section) =>
    !parsed.sections.has(section)
  ).map((section) =>
    issue(
      "SH_PLANNING_APPLICATION_SECTION_MISSING",
      path,
      `Application requirement is missing ${section}.`,
      `Add a level-two Markdown section named ${section}.`,
    )
  );
  if (diagnostics.length > 0) throw new PlanningError(diagnostics);
  return parsed;
}

function routeDirectory(path: string): string {
  const segments = path.split("/").filter(Boolean).map((segment) => {
    if (segment.startsWith(":")) return `[${segment.slice(1)}]`;
    return segment;
  });
  return ["api", ...segments].join("/");
}

function yamlList(values: readonly string[]): string {
  return values.length === 0
    ? " []"
    : `\n${values.map((value) => `  - ${value}`).join("\n")}`;
}

function endpointRequirement(proposal: EndpointProposal): string {
  const methodSections = proposal.methods.map((method) => `## ${method}\n`)
    .join("\n");
  const citations = proposal.sourceSections.map((section) => `- ${section}`)
    .join("\n");
  const criteria = proposal.acceptanceCriteria.map((criterion) =>
    `- ${criterion.id}: ${criterion.text}`
  ).join("\n");
  return `---
id: ${proposal.id}
path: ${proposal.path}
status: draft
methods:${yamlList(proposal.methods)}
depends_on:${yamlList(proposal.dependsOn ?? [])}
service: ${proposal.service}
---

# ${proposal.title}

## Purpose

${proposal.purpose}

## Source application sections

${citations}

${methodSections}
## Inputs

${proposal.inputs}

## Success responses

${proposal.successResponses}

## Errors

${proposal.errors}

## Security

${proposal.security}

## Data access and indexes

${proposal.dataAccess}

## Side effects

${proposal.sideEffects}

## Abuse considerations

${proposal.abuseConsiderations}

## Dependencies and assumptions

${proposal.assumptions}

## Acceptance criteria

${criteria}

## Governance record

The governed-content digest covers the exact UTF-8 bytes before this heading after
omitting the single top-level frontmatter \`status:\` line and its line ending. The
status field is a lifecycle projection for routing and human readability; no
other digest normalization is permitted.

### Approval

- Status: pending exact-content approval.
- Approver, time, bounded criteria, digest, and decision source: pending.

### Criterion mapping

- Status: pending approval and governed tests.

### Red-state evidence

- Status: pending approved test execution against a healthy baseline.

### Verification

- Status: pending implementation and independent verification.

### Delivery

- Status: not applicable until delivery is authorized and attempted.
`;
}

function validateInventory(files: readonly ProposedRequirementFile[]): void {
  const diagnostics: PlanningDiagnostic[] = [];
  const ids = new Map<string, string>();
  const criteria = new Map<string, string>();
  const parsed = files.map((file) =>
    parseRequirementDocument(file.source, file.path, "endpoint")
  );
  for (const requirement of parsed) {
    const prior = ids.get(requirement.id);
    if (prior) {
      diagnostics.push(issue(
        "SH_PLANNING_REQUIREMENT_DUPLICATE",
        requirement.path,
        `Requirement ID ${requirement.id} duplicates ${prior}.`,
        "Give every proposed requirement a globally unique ID.",
      ));
    } else ids.set(requirement.id, requirement.path);
    for (const criterion of requirement.criteria) {
      const criterionPrior = criteria.get(criterion.id);
      if (criterionPrior) {
        diagnostics.push(issue(
          "SH_PLANNING_CRITERION_DUPLICATE",
          requirement.path,
          `Criterion ${criterion.id} duplicates ${criterionPrior}.`,
          "Give every criterion a globally unique ID.",
          criterion.line,
        ));
      } else criteria.set(criterion.id, requirement.path);
    }
  }
  for (const requirement of parsed) {
    for (const dependency of requirement.dependsOn) {
      if (!ids.has(dependency)) {
        diagnostics.push(issue(
          "SH_PLANNING_DEPENDENCY_UNRESOLVED",
          requirement.path,
          `Dependency ${dependency} does not resolve in the proposed inventory.`,
          "Add the shared requirement or correct the dependency ID before approval.",
        ));
      }
    }
  }
  if (diagnostics.length > 0) throw new PlanningError(diagnostics);
}

function dependencyOrder(
  endpoints: readonly EndpointProposal[],
): readonly string[] {
  const byId = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: string[] = [];
  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new PlanningError([issue(
        "SH_PLANNING_DEPENDENCY_CYCLE",
        "requirements/application.req.md",
        `Proposed requirement dependency cycle includes ${id}.`,
        "Remove the cycle or extract a shared contract requirement.",
      )]);
    }
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) {
      if (byId.has(dependency)) visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
    ordered.push(id);
  };
  [...byId.keys()].sort().forEach(visit);
  return ordered;
}

export function decompose(
  application: PlanningDocument,
  endpoints: readonly EndpointProposal[],
): DecompositionPlan {
  const parsedApplication = validateApplication(
    application.source,
    application.path,
  );
  if (
    parsedApplication.status !== "approved" ||
    !parsedApplication.approval?.valid
  ) {
    throw new PlanningError([issue(
      "SH_PLANNING_APPLICATION_APPROVAL_REQUIRED",
      application.path,
      "Endpoint decomposition requires valid approval bound to the current application content.",
      "Obtain exact-content application approval before decomposition.",
    )]);
  }
  const diagnostics: PlanningDiagnostic[] = [];
  for (const endpoint of endpoints) {
    for (const conflict of endpoint.conflicts ?? []) {
      diagnostics.push(issue(
        "SH_PLANNING_APPLICATION_CONFLICT",
        `${routeDirectory(endpoint.path)}/${endpoint.id}.req.md`,
        `Proposed behavior "${conflict.proposedText}" conflicts with approved application text "${conflict.applicationText}".`,
        "Revise the endpoint proposal or return to application-level review.",
      ));
    }
    for (const citation of endpoint.sourceSections) {
      if (!parsedApplication.sections.has(citation)) {
        diagnostics.push(issue(
          "SH_PLANNING_SOURCE_SECTION_MISSING",
          `${routeDirectory(endpoint.path)}/${endpoint.id}.req.md`,
          `Cited application section ${citation} does not exist.`,
          "Cite an exact approved application heading.",
        ));
      }
    }
  }
  if (diagnostics.length > 0) throw new PlanningError(diagnostics);
  const files = endpoints.map((proposal) => ({
    path: `${routeDirectory(proposal.path)}/${proposal.id}.req.md`,
    source: endpointRequirement(proposal),
    requirementId: proposal.id,
  })).sort((left, right) => left.path.localeCompare(right.path));
  const paths = new Map<string, string>();
  for (const file of files) {
    const portable = file.path.toLowerCase();
    const prior = paths.get(portable);
    if (prior) {
      diagnostics.push(issue(
        "SH_PLANNING_REQUIREMENT_PATH_DUPLICATE",
        file.path,
        `Named requirement path collides with ${prior} on a case-insensitive filesystem.`,
        "Give each proposed requirement a filename-distinct stable ID.",
      ));
    } else {
      paths.set(portable, file.path);
    }
  }
  if (diagnostics.length > 0) throw new PlanningError(diagnostics);
  validateInventory(files);
  return {
    directories: [
      ...new Set(
        files.map((file) => file.path.slice(0, file.path.lastIndexOf("/"))),
      ),
    ],
    files,
    dependencyOrder: dependencyOrder(endpoints),
  };
}

function replaceStatus(source: string, status: "draft" | "approved"): string {
  return source.replace(/^status:[^\r\n]*$/m, `status: ${status}`);
}

function replaceApproval(source: string, content: string): string {
  const marker = "### Approval";
  const start = source.indexOf(marker);
  if (start < 0) return source;
  const contentStart = start + marker.length;
  const remainder = source.slice(contentStart);
  const next = remainder.search(/^### /m);
  const end = next < 0 ? source.length : contentStart + next;
  return `${source.slice(0, contentStart)}\n\n${content.trim()}\n\n${
    source.slice(end).replace(/^\r?\n*/, "")
  }`;
}

function appendHistory(source: string, decision: PlanningDecision): string {
  const entry =
    `- ${decision.at}: ${decision.action} by ${decision.actor}; source: ${decision.decisionSource}; rationale: ${
      decision.rationale ?? "not provided"
    }.`;
  const heading = "### Decision history";
  const existing = source.indexOf(heading);
  if (existing >= 0) {
    const lineEnd = source.indexOf("\n", existing + heading.length);
    return `${source.slice(0, lineEnd + 1)}\n${entry}${
      source.slice(lineEnd + 1)
    }`;
  }
  const governance = source.indexOf("## Governance record");
  const approval = source.indexOf("### Approval", governance);
  const afterApproval = source.slice(approval + "### Approval".length).search(
    /^### /m,
  );
  const insert = afterApproval < 0
    ? source.length
    : approval + "### Approval".length + afterApproval;
  return `${source.slice(0, insert)}${heading}\n\n${entry}\n\n${
    source.slice(insert)
  }`;
}

function dependentReview(
  parsed: readonly ParsedRequirement[],
  changed: ReadonlySet<string>,
): readonly string[] {
  const review = new Set<string>();
  let added = true;
  while (added) {
    added = false;
    for (const requirement of parsed) {
      if (changed.has(requirement.id) || review.has(requirement.id)) continue;
      if (
        requirement.dependsOn.some((id) => changed.has(id) || review.has(id))
      ) {
        review.add(requirement.id);
        added = true;
      }
    }
  }
  return [...review].sort();
}

export function applyDecision(
  documents: readonly PlanningDocument[],
  decision: PlanningDecision,
): PlanningDecisionResult {
  const parsed = documents.map((document) =>
    parseRequirementDocument(document.source, document.path, "endpoint")
  );
  const targets = new Set(decision.requirementIds);
  const diagnostics: PlanningDiagnostic[] = [];
  if (targets.size !== decision.requirementIds.length || targets.size === 0) {
    diagnostics.push(issue(
      "SH_PLANNING_DECISION_SCOPE_INVALID",
      documents[0]?.path ?? "requirement.req.md",
      "A planning decision must name a non-empty unique requirement set.",
      "Name each intended endpoint exactly once.",
    ));
  }
  const known = new Set(parsed.map((requirement) => requirement.id));
  for (const target of targets) {
    if (!known.has(target)) {
      diagnostics.push(issue(
        "SH_PLANNING_DECISION_TARGET_UNKNOWN",
        documents[0]?.path ?? "requirement.req.md",
        `Planning decision names unknown requirement ${target}.`,
        "Use an ID from the presented endpoint inventory.",
      ));
    }
  }
  if (!decision.actor || !decision.at || !decision.decisionSource) {
    diagnostics.push(issue(
      "SH_PLANNING_DECISION_PROVENANCE_REQUIRED",
      documents[0]?.path ?? "requirement.req.md",
      "Planning decisions require actor, time, and decision source.",
      "Record independently reviewable decision provenance.",
    ));
  }
  if (diagnostics.length > 0) throw new PlanningError(diagnostics);

  const changedRequirementIds = parsed.filter((item) => targets.has(item.id))
    .map((item) => item.id);
  const reviewRequired = decision.action === "revise"
    ? dependentReview(parsed, targets)
    : [];
  const updated = documents.map((document, index) => {
    const requirement = parsed[index];
    if (!targets.has(requirement.id)) return document;
    if (decision.action === "approve") {
      const criteria = requirement.criteria.map((item) => item.id).join(", ");
      const approval = `- Status: approved.
- Approver: ${decision.actor}.
- Approved at: ${decision.at}.
- Approved criteria: ${criteria}.
- Governed-content digest: \`sha256:${requirement.governedContentDigest}\`.
- Decision source: ${decision.decisionSource}.`;
      return {
        path: document.path,
        source: replaceApproval(
          replaceStatus(document.source, "approved"),
          approval,
        ),
      };
    }
    const statusReset = replaceStatus(document.source, "draft");
    return {
      path: document.path,
      source: appendHistory(statusReset, decision),
    };
  });
  return {
    documents: updated,
    changedRequirementIds,
    reviewRequired,
  };
}
