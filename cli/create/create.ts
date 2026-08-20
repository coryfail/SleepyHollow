import { platform } from "#platform";
import { join, resolve } from "path";

import {
  type CreateProjectOptions,
  CreationError,
  type CreationResult,
} from "./types.ts";

const VERSION = "0.3.1";
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function files(name: string): Readonly<Record<string, string>> {
  return {
    ".gitignore": "generated/*\n!generated/.gitkeep\n",
    ".sleepyhollow/project.ts":
      `export interface SleepyHollowProject {\n  readonly name: string;\n  readonly apiDirectory: string;\n  readonly requirementsFile: string;\n  readonly generatedDirectory: string;\n  readonly securityModule?: string;\n}\n\nexport function defineProject<const Project extends SleepyHollowProject>(\n  project: Project,\n): Project {\n  return Object.freeze(project);\n}\n`,
    ".sleepyhollow/verify.ts":
      `import { stat } from "fs/promises";\nimport config from "../sleepyhollow.config.ts";\n\nconst required = ["api", "generated", "models", "requirements/application.req.md", "tests"];\nfor (const path of required) await stat(path);\nif (config.apiDirectory !== "api" || config.requirementsFile !== "requirements/application.req.md" || config.generatedDirectory !== "generated") {\n  throw new Error("Invalid Sleepy Hollow project configuration");\n}\nconsole.log("Sleepy Hollow scaffold verified");\n`,
    "README.md":
      `# ${name}\n\nAn empty Sleepy Hollow application scaffold. It contains no generated or\napproved endpoints yet.\n\n## Begin planning\n\nActivate the official Sleepy Hollow skill in your agent environment, then ask it\nto plan this application. The planning source of truth is\n\`requirements/application.req.md\`.\n\n## Verify\n\n\`\`\`bash\nnpm run verify\n\`\`\`\n\n## Prepare deployment\n\nAfter adding a production \`start\` script, prepare reviewable Fly deployment\nfiles locally. This command does not log in to or deploy to Fly:\n\n\`\`\`bash\nhollow deploy prepare --target fly:${name} --database sqlite --region iad\n\`\`\`\n`,
    "tests/capture.ts":
      `import { rename, writeFile } from "fs/promises";\n\nconst records = { requests: [] as unknown[], dataOperations: [] as unknown[], uncapturedRoutes: [] as unknown[] };\nexport const CAPTURE_ARTIFACT = "generated/capture.json";\nexport const session = {\n  runner: "vitest",\n  revision: process.env.SLEEPY_HOLLOW_REVISION ?? "workspace",\n  artifact() { return { schema: "sleepy-hollow-capture/v1", runner: session.runner, revision: session.revision, ...records }; },\n};\nexport async function persist(): Promise<void> {\n  const staging = CAPTURE_ARTIFACT + ".partial";\n  await writeFile(staging, JSON.stringify(session.artifact(), null, 2) + "\\n", { flag: "wx" });\n  await rename(staging, CAPTURE_ARTIFACT);\n}\n`,
    "tests/capture_test.ts":
      `import { test } from "vitest";\nimport { persist } from "./capture.ts";\n\ntest("capture artifact is persisted", async () => { await persist(); });\n`,
    "api/.gitkeep": "",
    "package.json": JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        engines: { node: ">=24" },
        scripts: { check: "tsc --noEmit", test: "vitest run", verify: "npm run check && npm run test && node .sleepyhollow/verify.ts" },
        dependencies: { "@sleepy-hollow/framework": `^${FRAMEWORK_VERSION}` },
        devDependencies: { typescript: "5.9.3", vitest: "4.1.11" },
      },
      null,
      2,
    ) + "\n",
    "vitest.config.ts":
      `import { defineConfig } from "vitest/config";\n\nexport default defineConfig({ test: { globals: true, include: ["**/*_test.ts", "**/*.test.ts"] } });\n`,
    "generated/.gitkeep": "",
    "models/.gitkeep": "",
    "requirements/application.req.md":
      `---\nschema: sleepy-hollow-application/v0.1\ntitle: ${name}\nstatus: draft\n---\n\n# Application requirements\n\nUse the official Sleepy Hollow skill to plan actors, behavior, data, security,\noperations, and acceptance criteria before generating endpoints.\n`,
    "sleepyhollow.config.ts":
      `import { defineProject } from "./.sleepyhollow/project.ts";\n\nexport default defineProject(\n  {\n    name: "${name}",\n    apiDirectory: "api",\n    requirementsFile: "requirements/application.req.md",\n    generatedDirectory: "generated",\n  } satisfies import("./.sleepyhollow/project.ts").SleepyHollowProject,\n);\n`,
    "tests/scaffold_test.ts":
      `import { expect, test } from "vitest";\nimport config from "../sleepyhollow.config.ts";\n\ntest("empty scaffold configuration", () => { expect(config.name).toBe("${name}"); });\n`,
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
    await platform.lstat(path);
    return true;
  } catch (error) {
    if (platform.isNotFound(error)) return false;
    throw error;
  }
}

export const FRAMEWORK_VERSION = "0.3.1";

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
    await platform.mkdir(staging);
    for (const relative of createdFiles) {
      const target = join(staging, relative);
      await platform.mkdir(resolve(target, ".."), { recursive: true });
      await platform.writeTextFile(target, contents[relative], { createNew: true });
    }
    await platform.rename(staging, destination);
  } catch (error) {
    if (await pathExists(staging)) {
      await platform.remove(staging, { recursive: true });
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
      "npm install",
      "npm run verify",
      "Open requirements/application.req.md with the official Sleepy Hollow skill",
    ]),
    diagnostics: [] as const,
  });
}
