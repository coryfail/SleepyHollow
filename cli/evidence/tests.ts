import { platform } from "#platform";
import { relative, sep } from "path";
import { pathToFileURL } from "url";

import {
  createTestManifest,
  CRITERION_TEST_DISCOVERY,
  type CriterionTestDescriptor,
  type TestExecutionResult,
  type TestManifest,
} from "../../core/testing/mod.ts";
import { EvidenceError } from "./evidence_error.ts";
import type { ProjectLocations } from "./types.ts";

const MANIFEST_FILE = "test-manifest.json";
const RESULTS_FILE = "test-results.json";
const TEST_FILE = /(?:_test|\.test)\.(?:ts|tsx|mts|cts)$/;
let discoverySequence = 0;

export interface TestEvidence {
  readonly manifest: TestManifest;
  readonly previousManifest?: TestManifest;
  readonly results: readonly TestExecutionResult[];
}

interface DiscoveryHook {
  readonly onRegistered: (descriptor: CriterionTestDescriptor) => void;
}

function relativeProjectPath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

async function collect(
  root: string,
  projectRoot: string,
): Promise<readonly { readonly absolute: string; readonly relative: string }[]> {
  const found: { absolute: string; relative: string }[] = [];
  const walk = async (directory: string): Promise<void> => {
    let entries;
    try {
      entries = [];
      for await (const entry of platform.readDir(directory)) entries.push(entry);
    } catch {
      return;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.isSymlink) continue;
      const absolute = `${directory}/${entry.name}`;
      if (entry.isDirectory) {
        await walk(absolute);
      } else if (entry.isFile && TEST_FILE.test(entry.name)) {
        found.push({ absolute, relative: relativeProjectPath(projectRoot, absolute) });
      }
    }
  };
  await walk(root);
  return found;
}

function testRoots(project: ProjectLocations): readonly string[] {
  const roots = project.services.length > 0
    ? project.services.flatMap((service) => [
      `${project.projectRoot}/${service.testsRoot}`,
      `${project.projectRoot}/${service.apiRoot}`,
    ])
    : [
      `${project.projectRoot}/tests`,
      `${project.projectRoot}/${project.apiDirectory}`,
    ];
  return [...new Set(roots)];
}

async function discoverFiles(
  project: ProjectLocations,
): Promise<readonly { readonly absolute: string; readonly relative: string }[]> {
  const files = (await Promise.all(testRoots(project).map((root) =>
    collect(root, project.projectRoot)
  ))).flat();
  const unique = new Map(files.map((file) => [file.absolute, file]));
  return [...unique.values()].sort((left, right) =>
    left.relative.localeCompare(right.relative)
  );
}

async function discoverManifest(project: ProjectLocations): Promise<TestManifest> {
  const descriptors: CriterionTestDescriptor[] = [];
  const sources: Record<string, string> = {};
  const hook: DiscoveryHook = {
    onRegistered: (descriptor) => descriptors.push(descriptor),
  };
  const registry = globalThis as unknown as Record<symbol, unknown>;
  registry[CRITERION_TEST_DISCOVERY] = hook;
  try {
    for (const file of await discoverFiles(project)) {
      const source = await platform.readTextFile(file.absolute);
      // Scaffolds contain ordinary Vitest tests for local verification. Only
      // import files that participate in governed criterion discovery so those
      // tests are never evaluated outside Vitest.
      if (!/\bcriterionTest\s*\(/.test(source)) continue;
      sources[file.relative] = source;
      try {
        discoverySequence += 1;
        await import(
          `${pathToFileURL(file.absolute).href}?sleepy_hollow_discovery=${discoverySequence}`,
        );
      } catch (error) {
        throw new EvidenceError([{
          code: "SH_EVIDENCE_TEST_DISCOVERY_FAILED",
          path: file.relative,
          summary: error instanceof Error
            ? error.message
            : "A governed test could not be loaded for discovery.",
          correction:
            "Repair the criterionTest registration and its imports, then retry.",
        }]);
      }
    }
  } finally {
    delete registry[CRITERION_TEST_DISCOVERY];
  }
  return createTestManifest({ descriptors, sources });
}

function emptyManifest(): TestManifest {
  return { schema: "sleepy-hollow-test-manifest/v1", tests: [] };
}

function parseManifest(value: unknown, path: string): TestManifest {
  if (!value || typeof value !== "object" ||
    (value as { schema?: unknown }).schema !==
      "sleepy-hollow-test-manifest/v1" ||
    !Array.isArray((value as { tests?: unknown }).tests)) {
    throw new EvidenceError([{
      code: "SH_EVIDENCE_TEST_MANIFEST_INVALID",
      path,
      summary: "The persisted test manifest has an unsupported shape.",
      correction: "Regenerate test evidence with hollow test.",
    }]);
  }
  return value as TestManifest;
}

function parseResults(value: unknown, path: string): readonly TestExecutionResult[] {
  if (!value || typeof value !== "object" ||
    (value as { schema?: unknown }).schema !==
      "sleepy-hollow-test-results/v1" ||
    !Array.isArray((value as { results?: unknown }).results)) {
    throw new EvidenceError([{
      code: "SH_EVIDENCE_TEST_RESULTS_INVALID",
      path,
      summary: "The persisted test results have an unsupported shape.",
      correction: "Regenerate test evidence with hollow test.",
    }]);
  }
  return (value as { results: readonly TestExecutionResult[] }).results;
}

async function readJson(path: string): Promise<unknown | undefined> {
  let source: string;
  try {
    source = await platform.readTextFile(path);
  } catch (error) {
    if (platform.isNotFound(error)) return undefined;
    throw new EvidenceError([{
      code: "SH_EVIDENCE_TEST_ARTIFACT_UNREADABLE",
      path,
      summary: "A persisted test evidence artifact could not be read.",
      correction: "Repair the generated evidence permissions and retry.",
    }]);
  }
  try {
    return JSON.parse(source);
  } catch {
    throw new EvidenceError([{
      code: "SH_EVIDENCE_TEST_ARTIFACT_INVALID",
      path,
      summary: "A persisted test evidence artifact is not valid JSON.",
      correction: "Regenerate test evidence with hollow test.",
    }]);
  }
}

export async function readTestEvidence(
  project: ProjectLocations,
): Promise<TestEvidence> {
  const generated = `${project.projectRoot}/${project.generatedDirectory}`;
  const manifestPath = `${generated}/${MANIFEST_FILE}`;
  const resultsPath = `${generated}/${RESULTS_FILE}`;
  const previousPath = `${generated}/previous-test-manifest.json`;
  const [manifestSource, resultsSource, previousSource] = await Promise.all([
    readJson(manifestPath),
    readJson(resultsPath),
    readJson(previousPath),
  ]);
  const manifest = manifestSource === undefined
    ? emptyManifest()
    : parseManifest(manifestSource, `${project.generatedDirectory}/${MANIFEST_FILE}`);
  const results = resultsSource === undefined
    ? []
    : parseResults(resultsSource, `${project.generatedDirectory}/${RESULTS_FILE}`);
  return {
    manifest,
    ...(previousSource === undefined
      ? {}
      : { previousManifest: parseManifest(previousSource, `${project.generatedDirectory}/previous-test-manifest.json`) }),
    results,
  };
}

export async function discoverTestEvidence(
  project: ProjectLocations,
): Promise<TestManifest> {
  return discoverManifest(project);
}

export function testEvidencePaths(projectRoot: string, generatedDirectory: string): {
  readonly manifestPath: string;
  readonly resultsPath: string;
} {
  const generated = `${projectRoot}/${generatedDirectory}`;
  return {
    manifestPath: `${generated}/${MANIFEST_FILE}`,
    resultsPath: `${generated}/${RESULTS_FILE}`,
  };
}
