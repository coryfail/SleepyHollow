import { join, resolve } from "node:path";

import {
  type CreateProjectOptions,
  CreationError,
  type CreationResult,
} from "./types.ts";

const VERSION = "0.1.0";
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function files(name: string): Readonly<Record<string, string>> {
  return {
    ".gitignore": "generated/*\n!generated/.gitkeep\n",
    ".sleepyhollow/project.ts":
      `export interface SleepyHollowProject {\n  readonly name: string;\n  readonly apiDirectory: string;\n  readonly requirementsFile: string;\n  readonly generatedDirectory: string;\n  readonly securityModule?: string;\n}\n\nexport function defineProject<const Project extends SleepyHollowProject>(\n  project: Project,\n): Project {\n  return Object.freeze(project);\n}\n`,
    ".sleepyhollow/verify.ts":
      `import config from "../sleepyhollow.config.ts";\n\nconst required = [\n  "api",\n  "generated",\n  "models",\n  "requirements/application.md",\n  "tests",\n];\nfor (const path of required) await Deno.stat(path);\nif (\n  config.apiDirectory !== "api" ||\n  config.requirementsFile !== "requirements/application.md" ||\n  config.generatedDirectory !== "generated"\n) {\n  throw new Error("Invalid Sleepy Hollow project configuration");\n}\nconsole.log("Sleepy Hollow scaffold verified");\n`,
    "README.md":
      `# ${name}\n\nAn empty Sleepy Hollow application scaffold. It contains no generated or\napproved endpoints yet.\n\n## Begin planning\n\nActivate the official Sleepy Hollow skill in your agent environment, then ask it\nto plan this application. The planning source of truth is\n\`requirements/application.md\`.\n\n## Verify\n\n\`\`\`bash\ndeno task verify\n\`\`\`\n`,
    "tests/capture.ts":
      `const records = {\n  requests: [] as unknown[],\n  dataOperations: [] as unknown[],\n  uncapturedRoutes: [] as unknown[],\n};\n\nexport const CAPTURE_ARTIFACT = "generated/capture.json";\n\nfunction revision(): string {\n  try {\n    return Deno.env.get("SLEEPY_HOLLOW_REVISION") ?? "workspace";\n  } catch {\n    return "workspace";\n  }\n}\n\nexport const session = {\n  runner: "deno test",\n  revision: revision(),\n  artifact() {\n    return {\n      schema: "sleepy-hollow-capture/v1",\n      runner: session.runner,\n      revision: session.revision,\n      ...records,\n    };\n  },\n};\n\nexport async function persist(): Promise<void> {\n  const staging = CAPTURE_ARTIFACT + ".partial";\n  await Deno.writeTextFile(\n    staging,\n    JSON.stringify(session.artifact(), null, 2) + "\\n",\n  );\n  await Deno.rename(staging, CAPTURE_ARTIFACT);\n}\n`,
    "tests/capture_test.ts":
      `import { persist } from "./capture.ts";\n\nDeno.test("capture artifact is persisted", async () => {\n  await persist();\n});\n`,
    "api/.gitkeep": "",
    "deno.json": JSON.stringify(
      {
        imports: {
          "@sleepy-hollow/framework":
            `jsr:@sleepy-hollow/framework@^${FRAMEWORK_VERSION}`,
        },
        tasks: {
          check: "deno check .",
          test: "deno test --unstable-kv --allow-read --allow-write",
          verify:
            "deno fmt --check . && deno lint . && deno task check && deno task test && deno run --allow-read .sleepyhollow/verify.ts",
        },
      },
      null,
      2,
    ) + "\n",
    "generated/.gitkeep": "",
    "models/.gitkeep": "",
    "requirements/application.md":
      `---\nschema: sleepy-hollow-application/v0.1\ntitle: ${name}\nstatus: draft\n---\n\n# Application requirements\n\nUse the official Sleepy Hollow skill to plan actors, behavior, data, security,\noperations, and acceptance criteria before generating endpoints.\n`,
    "sleepyhollow.config.ts":
      `import { defineProject } from "./.sleepyhollow/project.ts";\n\nexport default defineProject(\n  {\n    name: "${name}",\n    apiDirectory: "api",\n    requirementsFile: "requirements/application.md",\n    generatedDirectory: "generated",\n  } satisfies import("./.sleepyhollow/project.ts").SleepyHollowProject,\n);\n`,
    "tests/scaffold_test.ts":
      `import config from "../sleepyhollow.config.ts";\n\nDeno.test("empty scaffold configuration", () => {\n  if (config.name !== "${name}") {\n    throw new Error("Unexpected project name");\n  }\n});\n`,
  };
}

function creationError(
  code: string,
  summary: string,
  path: string,
  correction: string,
): CreationError {
  return new CreationError([{ code, summary, path, correction }]);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

export const FRAMEWORK_VERSION = "0.1.0";

export async function createProject(
  options: CreateProjectOptions,
): Promise<CreationResult> {
  if (!NAME.test(options.name) || options.name.length > 64) {
    throw creationError(
      "SH_CREATE_NAME_INVALID",
      "Project name is unsafe",
      options.name,
      "Use lowercase letters, numbers, and single hyphens, beginning with a letter.",
    );
  }
  const parent = resolve(options.directory);
  const destination = join(parent, options.name);
  if (await pathExists(destination)) {
    throw creationError(
      "SH_CREATE_DESTINATION_EXISTS",
      "Destination already exists",
      destination,
      "Choose a new project name or move the existing path.",
    );
  }

  const contents = files(options.name);
  const createdFiles = Object.keys(contents).sort();
  const staging = join(
    parent,
    `.${options.name}.sleepyhollow-${crypto.randomUUID()}`,
  );
  try {
    await Deno.mkdir(staging);
    for (const relative of createdFiles) {
      const target = join(staging, relative);
      await Deno.mkdir(resolve(target, ".."), { recursive: true });
      await Deno.writeTextFile(target, contents[relative], { createNew: true });
    }
    await Deno.rename(staging, destination);
  } catch (error) {
    if (await pathExists(staging)) {
      await Deno.remove(staging, { recursive: true });
    }
    if (error instanceof CreationError) throw error;
    throw creationError(
      "SH_CREATE_WRITE_FAILED",
      "Project could not be created atomically",
      destination,
      "Confirm the parent exists and is writable, then retry with a new destination.",
    );
  }

  return Object.freeze({
    ok: true,
    command: "create",
    version: VERSION,
    projectPath: destination,
    createdFiles: Object.freeze(createdFiles),
    nextActions: Object.freeze([
      `cd ${options.name}`,
      "deno task verify",
      "Open requirements/application.md with the official Sleepy Hollow skill",
    ]),
    diagnostics: [] as const,
  });
}
