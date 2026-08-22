import { platform } from "#platform";
import { basename, dirname, join } from "path";

import { canonicalJson, digest } from "./canonical.ts";
import { analyzeChanges } from "./changes.ts";
import { renderClient } from "./client.ts";
import { renderDocs } from "./docs.ts";
import { GenerationError } from "./error.ts";
import { normalizeInventory, renderOpenApi } from "./openapi.ts";
import type {
  ContractInventory,
  GeneratedArtifact,
  GeneratedArtifacts,
  GenerateOptions,
  GenerationDiagnostic,
  GenerationResult,
} from "./types.ts";

const ownedPaths = [
  "openapi.json",
  "client.ts",
  "api-docs.html",
  "manifest.json",
] as const;

function artifact(
  path: GeneratedArtifact["path"],
  content: string,
): GeneratedArtifact {
  return { path, content, digest: digest(content) };
}

export function renderArtifacts(
  inventory: ContractInventory,
): GeneratedArtifacts {
  const normalized = normalizeInventory(inventory);
  const input = canonicalJson(normalized);
  const openApi = renderOpenApi(normalized);
  const client = renderClient(normalized);
  const docs = renderDocs(normalized, openApi);
  const rendered = [
    artifact("openapi.json", openApi),
    artifact("client.ts", client),
    artifact("api-docs.html", docs),
  ] as const;
  const manifestContent = canonicalJson({
    schema: "sleepy-hollow-generated-manifest/v1",
    generatorVersion: "0.3.5",
    serviceId: normalized.serviceId,
    inputDigest: digest(input),
    artifacts: Object.fromEntries(
      rendered.map((item) => [item.path, item.digest]),
    ),
  });
  return {
    inputDigest: digest(input),
    artifacts: [...rendered, artifact("manifest.json", manifestContent)],
  };
}

async function readText(path: string): Promise<string | undefined> {
  try {
    return await platform.readTextFile(path);
  } catch (error) {
    if (platform.isNotFound(error)) return undefined;
    throw error;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await platform.lstat(path);
    return true;
  } catch (error) {
    if (platform.isNotFound(error)) return false;
    throw error;
  }
}

async function copyEntry(source: string, target: string): Promise<void> {
  const info = await platform.lstat(source);
  if (info.isDirectory()) {
    await platform.mkdir(target, { recursive: true });
    for await (const entry of platform.readDir(source)) {
      await copyEntry(join(source, entry.name), join(target, entry.name));
    }
    return;
  }
  if (!info.isFile()) {
    throw new Error(`Refusing to copy unsupported generated entry: ${source}`);
  }
  await platform.copyFile(source, target);
}

function outputFailure(error: unknown): GenerationError {
  return error instanceof GenerationError ? error : new GenerationError([{
    code: "SH_GENERATE_OUTPUT_FAILED",
    summary: error instanceof Error
      ? error.message
      : "Generated output could not be replaced",
    correction:
      "Inspect filesystem permissions and retry; the previous generated set was preserved.",
  }]);
}

async function previousOwned(
  generatedDirectory: string,
): Promise<Set<string> | undefined> {
  const source = await readText(join(generatedDirectory, "manifest.json"));
  if (!source) return undefined;
  try {
    const manifest = JSON.parse(source) as Record<string, unknown>;
    if (manifest.schema !== "sleepy-hollow-generated-manifest/v1") {
      return undefined;
    }
    const artifacts = manifest.artifacts;
    if (
      !artifacts || typeof artifacts !== "object" || Array.isArray(artifacts)
    ) return undefined;
    return new Set([...Object.keys(artifacts), "manifest.json"]);
  } catch {
    return undefined;
  }
}

async function writeAtomically(
  projectRoot: string,
  rendered: GeneratedArtifacts,
): Promise<void> {
  const target = join(projectRoot, "generated");
  await platform.mkdir(projectRoot, { recursive: true });
  const targetExists = await exists(target);
  const priorOwned = targetExists ? await previousOwned(target) : undefined;
  if (targetExists && !priorOwned) {
    for (const path of ownedPaths) {
      if (await exists(join(target, path))) {
        throw new GenerationError([{
          code: "SH_GENERATE_UNKNOWN_TARGET",
          summary: `Refusing to replace unowned file generated/${path}`,
          path: `generated/${path}`,
          correction:
            "Move the user file or restore a valid generated manifest before retrying.",
        }]);
      }
    }
  }
  const stage = await platform.makeTempDir({
    dir: dirname(target),
    prefix: `.${basename(target)}-stage-`,
  });
  const backup = `${target}.backup-${crypto.randomUUID()}`;
  let movedPrior = false;
  try {
    if (targetExists) {
      for await (const entry of platform.readDir(target)) {
        if (priorOwned?.has(entry.name)) continue;
        await copyEntry(join(target, entry.name), join(stage, entry.name));
      }
    }
    for (const item of rendered.artifacts) {
      await platform.writeTextFile(join(stage, item.path), item.content);
    }
    if (targetExists) {
      await platform.rename(target, backup);
      movedPrior = true;
    }
    await platform.rename(stage, target);
    if (movedPrior) await platform.remove(backup, { recursive: true });
  } catch (error) {
    if (movedPrior && !(await exists(target)) && await exists(backup)) {
      await platform.rename(backup, target);
    }
    if (await exists(stage)) await platform.remove(stage, { recursive: true });
    throw outputFailure(error);
  }
}

export async function generate(
  options: GenerateOptions,
): Promise<GenerationResult> {
  const rendered = renderArtifacts(options.inventory);
  const generatedDirectory = join(options.projectRoot, "generated");
  const artifacts = await Promise.all(rendered.artifacts.map(async (item) => {
    const current = await readText(join(generatedDirectory, item.path));
    const actualDigest = current === undefined ? undefined : digest(current);
    return {
      path: `generated/${item.path}`,
      digest: item.digest,
      ...(actualDigest ? { actualDigest } : {}),
      stale: actualDigest !== item.digest,
    };
  }));
  const openApi = JSON.parse(
    rendered.artifacts.find((item) => item.path === "openapi.json")!.content,
  );
  let previous = options.previousOpenApi;
  if (!previous) {
    const source = await readText(join(generatedDirectory, "openapi.json"));
    if (source) {
      try {
        previous = JSON.parse(source);
      } catch {
        // Staleness diagnostics below are sufficient for an edited prior artifact.
      }
    }
  }
  const changes = previous
    ? analyzeChanges(previous as Record<string, unknown>, openApi)
    : [];
  const priorOwned = await previousOwned(generatedDirectory);
  const expected = new Set(rendered.artifacts.map((item) => item.path));
  const extraOwned = [...priorOwned ?? []].filter((path) =>
    !expected.has(path as GeneratedArtifact["path"])
  ).sort().map((path) => ({
    path: `generated/${path}`,
    digest: "absent",
    stale: true,
  }));
  const inspectedArtifacts = [...artifacts, ...extraOwned];
  const stale = inspectedArtifacts.filter((item) => item.stale);
  const diagnostics: GenerationDiagnostic[] = stale.map((item) => ({
    code: "SH_GENERATE_ARTIFACT_STALE",
    summary:
      `${item.path} is missing, edited, extra-owned, or stale; expected ${item.digest}${
        "actualDigest" in item ? `, actual ${item.actualDigest}` : ""
      }`,
    path: item.path,
    correction:
      "Run hollow generate to regenerate the complete owned artifact set.",
  }));
  if (options.check) {
    return {
      ok: stale.length === 0,
      command: "generate",
      schema: "sleepy-hollow-generate-result/v1",
      serviceId: options.inventory.serviceId,
      inputDigest: rendered.inputDigest,
      artifacts: inspectedArtifacts,
      changes,
      diagnostics,
      wrote: false,
    };
  }
  if (stale.length > 0) await writeAtomically(options.projectRoot, rendered);
  return {
    ok: true,
    command: "generate",
    schema: "sleepy-hollow-generate-result/v1",
    serviceId: options.inventory.serviceId,
    inputDigest: rendered.inputDigest,
    artifacts: artifacts.map((item) => ({
      ...item,
      actualDigest: item.digest,
      stale: false,
    })),
    changes,
    diagnostics: [],
    wrote: stale.length > 0,
  };
}
