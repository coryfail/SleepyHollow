import { dirname, join } from "node:path";

import { normalizeArchitecture } from "./architecture.ts";
import { ServiceArchitectureError } from "./errors.ts";
import type {
  ServiceArchitecture,
  ServiceDiagnostic,
  ServiceScaffoldResult,
} from "./types.ts";

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

function failure(
  code: string,
  summary: string,
  correction: string,
  serviceId?: string,
  target?: string,
): ServiceArchitectureError {
  const diagnostic: ServiceDiagnostic = {
    code,
    summary,
    correction,
    ...(serviceId ? { serviceId } : {}),
    ...(target ? { target } : {}),
  };
  return new ServiceArchitectureError([diagnostic]);
}

async function writeFile(
  root: string,
  path: string,
  content: string,
): Promise<void> {
  const target = join(root, path);
  await Deno.mkdir(dirname(target), { recursive: true });
  await Deno.writeTextFile(target, content, { createNew: true });
}

export async function scaffoldWorkspaces(options: {
  readonly architecture: ServiceArchitecture;
  readonly projectRoot: string;
  readonly requirements: Readonly<Record<string, string>>;
}): Promise<ServiceScaffoldResult> {
  const architecture = normalizeArchitecture(options.architecture);
  for (const service of architecture.services) {
    if (!options.requirements[service.id]?.trim()) {
      throw failure(
        "SH_SERVICE_REQUIREMENTS_REQUIRED",
        `${service.id} has no approved application requirement content`,
        "Supply the exact approved application requirement for every service.",
        service.id,
        service.requirementsPath,
      );
    }
    if (await exists(join(options.projectRoot, service.root))) {
      throw failure(
        "SH_SERVICE_ROOT_EXISTS",
        `${service.id} workspace root already exists`,
        "Choose an unused root; existing user paths are never overwritten.",
        service.id,
        service.root,
      );
    }
  }

  await Deno.mkdir(options.projectRoot, { recursive: true });
  const stage = await Deno.makeTempDir({
    dir: options.projectRoot,
    prefix: ".sleepy-hollow-services-",
  });
  const moved: Array<{ source: string; target: string }> = [];
  try {
    for (const service of architecture.services) {
      await writeFile(
        stage,
        service.requirementsPath,
        options.requirements[service.id],
      );
      await writeFile(
        stage,
        service.configPath,
        `export default Object.freeze({\n  serviceId: ${
          JSON.stringify(service.id)
        },\n  apiDirectory: ${
          JSON.stringify(service.apiRoot.slice(service.root.length + 1))
        },\n  requirementsFile: ${
          JSON.stringify(
            service.requirementsPath.slice(service.root.length + 1),
          )
        },\n  generatedDirectory: ${
          JSON.stringify(service.generatedRoot.slice(service.root.length + 1))
        },\n  deploymentConfiguration: ${
          JSON.stringify(
            service.deploymentConfigPath.slice(service.root.length + 1),
          )
        },\n  kvBinding: ${JSON.stringify(service.kvBinding)},\n});\n`,
      );
      for (
        const directory of [
          service.apiRoot,
          service.testsRoot,
          service.generatedRoot,
        ]
      ) {
        await writeFile(stage, `${directory}/.gitkeep`, "");
      }
      await writeFile(
        stage,
        service.deploymentConfigPath,
        `${
          JSON.stringify(
            {
              schema: "sleepy-hollow-service-deployment/v1",
              serviceId: service.id,
            },
            null,
            2,
          )
        }\n`,
      );
    }
    for (const service of architecture.services) {
      const source = join(stage, service.root);
      const target = join(options.projectRoot, service.root);
      await Deno.mkdir(dirname(target), { recursive: true });
      await Deno.rename(source, target);
      moved.push({ source, target });
    }
    await Deno.remove(stage, { recursive: true });
  } catch (error) {
    for (const item of moved.reverse()) {
      if (await exists(item.target)) {
        await Deno.mkdir(dirname(item.source), { recursive: true });
        await Deno.rename(item.target, item.source);
      }
    }
    if (await exists(stage)) await Deno.remove(stage, { recursive: true });
    if (error instanceof ServiceArchitectureError) throw error;
    throw failure(
      "SH_SERVICE_SCAFFOLD_FAILED",
      "The complete service workspace set could not be created",
      "Inspect the protected filesystem failure and retry with unused service roots.",
    );
  }

  return {
    ok: true,
    schema: "sleepy-hollow-service-scaffold/v1",
    choice: architecture.choice,
    services: architecture.services.map((service) => ({
      id: service.id,
      root: service.root,
      createdPaths: [
        service.requirementsPath,
        service.configPath,
        service.apiRoot,
        service.testsRoot,
        service.generatedRoot,
        service.deploymentConfigPath,
      ].sort(),
    })),
  };
}
