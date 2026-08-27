import { platform } from "#platform";
import { basename } from "path";
import type * as TypeScript from "typescript";

import {
  parseRequirement,
  PlanningError,
} from "../../skills/sleepy-hollow/planning/mod.ts";
import type {
  CodeStandardsEvidence,
  CodeStandardsViolation,
  ProjectLocations,
} from "./types.ts";

type TypeScriptApi = typeof import("typescript");

const SOURCE_EXTENSION = /\.(?:[cm]?ts|tsx)$/;
const MAX_LINE_LENGTH = 100;
const MAX_FUNCTION_LINES = 40;
const MAX_FUNCTION_PARAMETERS = 4;
const MAX_COMPLEXITY = 10;
const MAX_NESTING_DEPTH = 3;

/** Creates one deterministic standards violation. */
function violation(
  code: string,
  phase: CodeStandardsViolation["phase"],
  path: string,
  line: number,
  summary: string,
  correction: string,
): CodeStandardsViolation {
  return { code, phase, path, line, summary, correction };
}

/** Reads a directory without treating an absent optional source root as an error. */
async function entries(path: string): Promise<readonly {
  readonly name: string;
  readonly isDirectory: boolean;
  readonly isFile: boolean;
  readonly isSymlink: boolean;
}[]> {
  try {
    const found = [];
    for await (const entry of platform.readDir(path)) {
      found.push(entry);
    }
    return found.sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    if (platform.isNotFound(error)) return [];
    throw error;
  }
}

/** Collects TypeScript files below one declared source root. */
async function sources(
  absoluteRoot: string,
  displayRoot: string,
): Promise<readonly { readonly absolutePath: string; readonly path: string }[]> {
  const found: { absolutePath: string; path: string }[] = [];
  const walk = async (absolute: string, display: string): Promise<void> => {
    for (const entry of await entries(absolute)) {
      if (entry.isSymlink || entry.name.startsWith(".")) continue;
      const nextAbsolute = `${absolute}/${entry.name}`;
      const nextDisplay = `${display}/${entry.name}`;
      if (entry.isDirectory) {
        await walk(nextAbsolute, nextDisplay);
      } else if (entry.isFile && SOURCE_EXTENSION.test(entry.name)) {
        found.push({ absolutePath: nextAbsolute, path: nextDisplay });
      }
    }
  };
  await walk(absoluteRoot, displayRoot);
  return found;
}

/** Returns whether a source file directly imports a relational database package. */
function hasDirectDatabaseImport(source: string): boolean {
  return /from\s*["'](?:drizzle-orm(?:\/[^"']*)?|better-sqlite3|pg|@sleepy-hollow\/framework\/database)["']/.test(source);
}

/** Returns whether a model schema imports Drizzle's typed schema APIs. */
function hasDrizzleImport(source: string): boolean {
  return /from\s*["']drizzle-orm(?:\/[^"']*)?["']/.test(source);
}

/** Returns the one-based source line containing a parsed node. */
function lineOf(parsed: TypeScript.SourceFile, node: TypeScript.Node): number {
  return parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1;
}

/** Returns whether a node introduces nested control flow. */
function introducesNesting(
  typescript: TypeScriptApi,
  node: TypeScript.Node,
): boolean {
  return typescript.isIfStatement(node) ||
    typescript.isForStatement(node) ||
    typescript.isForInStatement(node) ||
    typescript.isForOfStatement(node) ||
    typescript.isWhileStatement(node) ||
    typescript.isDoStatement(node) ||
    typescript.isSwitchStatement(node) ||
    typescript.isCatchClause(node);
}

/** Returns whether a node adds one decision path to cyclomatic complexity. */
function introducesDecision(
  typescript: TypeScriptApi,
  node: TypeScript.Node,
): boolean {
  if (introducesNesting(typescript, node)) return true;
  if (typescript.isConditionalExpression(node)) return true;
  if (!typescript.isBinaryExpression(node)) return false;
  return new Set([
    typescript.SyntaxKind.AmpersandAmpersandToken,
    typescript.SyntaxKind.BarBarToken,
    typescript.SyntaxKind.QuestionQuestionToken,
  ]).has(node.operatorToken.kind);
}

/** Calculates bounded complexity metrics without folding in nested functions. */
function functionMetrics(
  typescript: TypeScriptApi,
  functionNode: TypeScript.FunctionLikeDeclaration,
): { readonly complexity: number; readonly nesting: number } {
  let complexity = 1;
  let nesting = 0;

  /** Visits one function-owned node while tracking its control-flow depth. */
  function visit(node: TypeScript.Node, depth: number): void {
    if (node !== functionNode && typescript.isFunctionLike(node)) return;
    const isNestedControl = introducesNesting(typescript, node);
    const nextDepth = isNestedControl ? depth + 1 : depth;
    if (introducesDecision(typescript, node)) complexity += 1;
    nesting = Math.max(nesting, nextDepth);
    typescript.forEachChild(node, (child) => visit(child, nextDepth));
  }

  if (functionNode.body) visit(functionNode.body, 0);
  return { complexity, nesting };
}

/** Counts non-empty, non-comment physical lines inside a function block. */
function executableLines(source: string, body: TypeScript.Block): number {
  return source.slice(body.getStart() + 1, body.getEnd() - 1)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      line.length > 0 && !line.startsWith("//") &&
      !line.startsWith("/*") && !line.startsWith("*")
    ).length;
}

/** Returns whether a console property access is application logging. */
function isConsoleAccess(
  typescript: TypeScriptApi,
  node: TypeScript.Node,
): boolean {
  return typescript.isPropertyAccessExpression(node) &&
    typescript.isIdentifier(node.expression) &&
    node.expression.text === "console";
}

/** Returns whether a lint directive is narrow and carries an explanation. */
function isExplainedLintSuppression(line: string): boolean {
  return /eslint-disable-next-line\s+\S+\s+--\s+\S/.test(line);
}

/** Finds functions whose leading trivia does not carry an explanatory TSDoc block. */
async function qualityViolations(
  source: string,
  path: string,
): Promise<readonly CodeStandardsViolation[]> {
  const typescript = (await import("typescript")).default;
  const parsed = typescript.createSourceFile(
    path,
    source,
    typescript.ScriptTarget.Latest,
    true,
  );
  const violations: CodeStandardsViolation[] = [];

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const sourceLine = index + 1;
    if (line.length > MAX_LINE_LENGTH && !line.includes("://")) {
      violations.push(violation(
        "SH_CHECK_SOURCE_LINE_TOO_LONG",
        "quality",
        path,
        sourceLine,
        `Source exceeds the ${MAX_LINE_LENGTH}-column readability limit.`,
        "Wrap the expression or extract a focused named helper.",
      ));
    }
    if (/@ts-ignore|@ts-nocheck/.test(line)) {
      violations.push(violation(
        "SH_CHECK_TYPESCRIPT_SUPPRESSION_FORBIDDEN",
        "quality",
        path,
        sourceLine,
        "Source disables TypeScript safety with an unchecked directive.",
        "Remove the directive and validate, narrow, or correct the underlying type.",
      ));
    }
    if (/eslint-disable/.test(line) && !isExplainedLintSuppression(line)) {
      violations.push(violation(
        "SH_CHECK_LINT_SUPPRESSION_INVALID",
        "quality",
        path,
        sourceLine,
        "A lint suppression is blanket or has no explanatory reason.",
        "Use one eslint-disable-next-line rule -- reason directive tied to approval.",
      ));
    }
  }

  const visit = (node: TypeScript.Node): void => {
    const isFunction = typescript.isFunctionDeclaration(node) ||
      typescript.isFunctionExpression(node) ||
      typescript.isArrowFunction(node) ||
      typescript.isMethodDeclaration(node);
    if (isFunction) {
      const functionNode = node as TypeScript.FunctionLikeDeclaration;
      const line = lineOf(parsed, node);
      const leading = source.slice(node.getFullStart(), node.getStart(parsed));
      if (!/\/\*\*[\s\S]*?\*\/\s*$/.test(leading)) {
        violations.push(violation(
          "SH_CHECK_FUNCTION_DOCUMENTATION_MISSING",
          "quality",
          path,
          line,
          "An application-owned function has no immediately preceding TSDoc comment.",
          "Add a concise TSDoc comment that explains the function's behavior.",
        ));
      }
      const body = functionNode.body;
      const multiline = body && typescript.isBlock(body) &&
        parsed.getLineAndCharacterOfPosition(body.getStart(parsed)).line <
          parsed.getLineAndCharacterOfPosition(body.getEnd()).line;
      if (!multiline) {
        violations.push(violation(
          "SH_CHECK_FUNCTION_MULTILINE_REQUIRED",
          "quality",
          path,
          line,
          "An application-owned function is compressed into one line or expression body.",
          "Use a documented block body with executable statements on separate lines.",
        ));
      }
      if (functionNode.parameters.length > MAX_FUNCTION_PARAMETERS) {
        violations.push(violation(
          "SH_CHECK_FUNCTION_PARAMETER_LIMIT",
          "quality",
          path,
          line,
          `A function declares more than ${MAX_FUNCTION_PARAMETERS} parameters.`,
          "Replace positional parameters with a typed options object.",
        ));
      }
      if (body && typescript.isBlock(body) &&
        executableLines(source, body) > MAX_FUNCTION_LINES) {
        violations.push(violation(
          "SH_CHECK_FUNCTION_LENGTH_LIMIT",
          "quality",
          path,
          line,
          `A function exceeds ${MAX_FUNCTION_LINES} executable lines.`,
          "Extract focused named helpers so the function has one responsibility.",
        ));
      }
      const metrics = functionMetrics(typescript, functionNode);
      if (metrics.complexity > MAX_COMPLEXITY) {
        violations.push(violation(
          "SH_CHECK_FUNCTION_COMPLEXITY_LIMIT",
          "quality",
          path,
          line,
          `A function exceeds cyclomatic complexity ${MAX_COMPLEXITY}.`,
          "Split independent decisions into focused named functions.",
        ));
      }
      if (metrics.nesting > MAX_NESTING_DEPTH) {
        violations.push(violation(
          "SH_CHECK_FUNCTION_NESTING_LIMIT",
          "quality",
          path,
          line,
          `A function nests control flow deeper than ${MAX_NESTING_DEPTH} levels.`,
          "Use early returns or extract nested behavior into a named function.",
        ));
      }
    }
    if (node.kind === typescript.SyntaxKind.AnyKeyword) {
      violations.push(violation(
        "SH_CHECK_EXPLICIT_ANY_FORBIDDEN",
        "quality",
        path,
        lineOf(parsed, node),
        "Source uses explicit any and bypasses type safety.",
        "Use unknown and validate or narrow the value before use.",
      ));
    }
    if (typescript.isNonNullExpression(node)) {
      violations.push(violation(
        "SH_CHECK_NON_NULL_ASSERTION_FORBIDDEN",
        "quality",
        path,
        lineOf(parsed, node),
        "Source uses an unchecked non-null assertion.",
        "Prove the value exists with validation or an explicit guard.",
      ));
    }
    if (isConsoleAccess(typescript, node)) {
      violations.push(violation(
        "SH_CHECK_CONSOLE_FORBIDDEN",
        "quality",
        path,
        lineOf(parsed, node),
        "Application source writes through console instead of structured logging.",
        "Use the application logger with safe structured context.",
      ));
    }
    if (typescript.isCatchClause(node) && node.block.statements.length === 0) {
      violations.push(violation(
        "SH_CHECK_EMPTY_CATCH_FORBIDDEN",
        "quality",
        path,
        lineOf(parsed, node),
        "An empty catch block silently swallows a failure.",
        "Recover, translate, add context, or rethrow the caught error.",
      ));
    }
    typescript.forEachChild(node, visit);
  };
  visit(parsed);
  return violations;
}

/** Reads dependency names without evaluating project-owned package code. */
async function dependencies(projectRoot: string): Promise<ReadonlySet<string>> {
  try {
    const source = await platform.readTextFile(`${projectRoot}/package.json`);
    const manifest = JSON.parse(source) as {
      readonly dependencies?: Record<string, unknown>;
      readonly devDependencies?: Record<string, unknown>;
    };
    return new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}

/** Validates a model requirement against the shared governed-document parser. */
async function modelRequirementEvidence(
  projectRoot: string,
  model: string,
): Promise<{
  readonly violations: readonly CodeStandardsViolation[];
  readonly drizzleRequired: boolean;
}> {
  const path = `models/${model}/${model}.req.md`;
  const absolutePath = `${projectRoot}/${path}`;
  let source: string;
  try {
    source = await platform.readTextFile(absolutePath);
  } catch {
    return {
      drizzleRequired: true,
      violations: [violation(
        "SH_CHECK_MODEL_REQUIREMENT_MISSING",
        "data",
        path,
        1,
        `Model ${model} has no colocated governed requirement.`,
        `Create ${path} before implementing the model.`,
      )],
    };
  }
  try {
    const requirement = parseRequirement(source, path, "model");
    const violations: CodeStandardsViolation[] = [];
    if (requirement.metadata.model !== model) {
      violations.push(violation(
        "SH_CHECK_MODEL_REQUIREMENT_MISMATCH",
        "data",
        path,
        1,
        `Model requirement declares ${String(requirement.metadata.model)} instead of ${model}.`,
        "Set frontmatter model to the owning model directory name.",
      ));
    }
    const persistence = requirement.metadata.persistence ?? "drizzle";
    if (persistence === "alternative") {
      const exception = requirement.metadata.persistence_exception;
      const fields = typeof exception === "object" && exception !== null
        ? exception as Record<string, unknown>
        : {};
      const complete = ["technology", "reason", "approver", "decision_source"]
        .every((field) =>
          typeof fields[field] === "string" && String(fields[field]).trim()
        );
      if (!complete) {
        violations.push(violation(
          "SH_CHECK_PERSISTENCE_EXCEPTION_INVALID",
          "data",
          path,
          1,
          "A non-Drizzle model lacks a complete human-approved exception record.",
          "Record technology, reason, approver, and decision_source in persistence_exception.",
        ));
      }
      return { drizzleRequired: !complete, violations };
    }
    if (persistence !== "drizzle") {
      violations.push(violation(
        "SH_CHECK_MODEL_PERSISTENCE_INVALID",
        "data",
        path,
        1,
        `Model persistence ${String(persistence)} is not supported.`,
        "Use persistence: drizzle or a complete human-approved alternative.",
      ));
    }
    if (!new Set(["sqlite", "postgres"]).has(requirement.metadata.database as string)) {
      violations.push(violation(
        "SH_CHECK_DATABASE_PROFILE_REQUIRED",
        "data",
        path,
        1,
        "A Drizzle model must select the SQLite or PostgreSQL profile.",
        "Set database: sqlite or database: postgres in the model requirement.",
      ));
    }
    return { drizzleRequired: true, violations };
  } catch (error) {
    const summary = error instanceof PlanningError
      ? error.diagnostics.map((item) => item.message).join(" ")
      : "Model requirement could not be parsed.";
    return {
      drizzleRequired: true,
      violations: [violation(
        "SH_CHECK_MODEL_REQUIREMENT_INVALID",
        "data",
        path,
        1,
        summary,
        "Use the sgad-model/v0.1 model requirement format with every required section.",
      )],
    };
  }
}

/** Collects fail-closed evidence for model architecture and source readability. */
export async function standards(
  project: ProjectLocations,
): Promise<CodeStandardsEvidence> {
  const violations: CodeStandardsViolation[] = [];
  const modelRoot = `${project.projectRoot}/models`;
  const models = (await entries(modelRoot)).filter((entry) =>
    entry.isDirectory && !entry.isSymlink && !entry.name.startsWith(".")
  );
  const rootFiles = (await entries(modelRoot)).filter((entry) =>
    entry.isFile && SOURCE_EXTENSION.test(entry.name)
  );
  for (const file of rootFiles) {
    violations.push(violation(
      "SH_CHECK_MODEL_SOURCE_UNSCOPED",
      "data",
      `models/${file.name}`,
      1,
      "Model source must live in one named model directory.",
      "Move the source into models/<model>/ alongside its requirement and repository.",
    ));
  }

  const projectDependencies = await dependencies(project.projectRoot);
  const requirementEvidence = new Map<string, Awaited<ReturnType<typeof modelRequirementEvidence>>>();
  for (const model of models) {
    const evidence = await modelRequirementEvidence(project.projectRoot, model.name);
    requirementEvidence.set(model.name, evidence);
    violations.push(...evidence.violations);
  }
  const drizzleModels = models.filter((model) =>
    requirementEvidence.get(model.name)?.drizzleRequired !== false
  );
  if (drizzleModels.length > 0 && !projectDependencies.has("drizzle-orm")) {
    violations.push(violation(
      "SH_CHECK_DRIZZLE_DEPENDENCY_MISSING",
      "data",
      "package.json",
      1,
      "Durable models require the drizzle-orm runtime dependency.",
      "Add drizzle-orm before implementing a persistent model.",
    ));
  }
  if (drizzleModels.length > 0) {
    try {
      await platform.stat(`${project.projectRoot}/drizzle.config.ts`);
    } catch {
      violations.push(violation(
        "SH_CHECK_DRIZZLE_CONFIG_MISSING",
        "data",
        "drizzle.config.ts",
        1,
        "Durable models require a reviewed Drizzle migration configuration.",
        "Add drizzle.config.ts and record the migration strategy in each model requirement.",
      ));
    }
  }

  for (const model of models) {
    const root = `${modelRoot}/${model.name}`;
    const files = await sources(root, `models/${model.name}`);
    const names = new Set(files.map((file) => basename(file.path)));
    if (!names.has("schema.ts")) {
      violations.push(violation(
        "SH_CHECK_MODEL_SCHEMA_MISSING",
        "data",
        `models/${model.name}`,
        1,
        `Model ${model.name} has no schema.ts.`,
        "Define the Drizzle table schema in schema.ts.",
      ));
    }
    if (!names.has("repository.ts")) {
      violations.push(violation(
        "SH_CHECK_MODEL_REPOSITORY_MISSING",
        "data",
        `models/${model.name}`,
        1,
        `Model ${model.name} has no repository.ts.`,
        "Move model reads and writes into repository.ts.",
      ));
    }
    if (!names.has("types.ts")) {
      violations.push(violation(
        "SH_CHECK_MODEL_TYPES_MISSING",
        "data",
        `models/${model.name}`,
        1,
        `Model ${model.name} has no types.ts.`,
        "Declare the model's public types in types.ts.",
      ));
    }
    const schema = files.find((file) => basename(file.path) === "schema.ts");
    if (schema && requirementEvidence.get(model.name)?.drizzleRequired !== false) {
      const source = await platform.readTextFile(schema.absolutePath);
      if (!hasDrizzleImport(source)) {
        violations.push(violation(
          "SH_CHECK_MODEL_DRIZZLE_SCHEMA_REQUIRED",
          "data",
          schema.path,
          1,
          `Model ${model.name} schema does not import Drizzle.`,
          "Define persistent tables with the Drizzle schema APIs.",
        ));
      }
    }
  }

  const sourceRoots = project.services.length > 0
    ? project.services.map((service) => ({
      absolute: `${project.projectRoot}/${service.apiRoot}`,
      display: service.apiRoot,
      routeRoot: true,
    }))
    : [{
      absolute: `${project.projectRoot}/${project.apiDirectory}`,
      display: project.apiDirectory,
      routeRoot: true,
    }];
  sourceRoots.push({ absolute: modelRoot, display: "models", routeRoot: false });
  sourceRoots.push({
    absolute: `${project.projectRoot}/tests`,
    display: "tests",
    routeRoot: false,
  });
  for (const service of project.services) {
    sourceRoots.push({
      absolute: `${project.projectRoot}/${service.testsRoot}`,
      display: service.testsRoot,
      routeRoot: false,
    });
  }
  for (const root of sourceRoots) {
    for (const file of await sources(root.absolute, root.display)) {
      const source = await platform.readTextFile(file.absolutePath);
      violations.push(...await qualityViolations(source, file.path));
      if (!root.routeRoot || !hasDirectDatabaseImport(source)) continue;
      violations.push(violation(
        "SH_CHECK_ROUTE_DATA_ACCESS_FORBIDDEN",
        "routes",
        file.path,
        1,
        "Route source imports a database package directly.",
        "Move data access into the owning model repository and import that boundary instead.",
      ));
    }
  }

  return {
    hasDurableModels: models.length > 0,
    violations: violations.sort((left, right) =>
      left.phase.localeCompare(right.phase) || left.code.localeCompare(right.code) ||
      left.path.localeCompare(right.path) || left.line - right.line
    ),
  };
}
