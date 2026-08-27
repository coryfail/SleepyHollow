import { platform } from "#platform";
import { join, resolve } from "path";

import {
  type CreateProjectOptions,
  CreationError,
  type CreationResult,
} from "./types.ts";

const VERSION = "0.4.0";
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function files(name: string): Readonly<Record<string, string>> {
  return {
    ".gitignore": "generated/*\n!generated/.gitkeep\n",
    ".prettierignore": "**/*.req.md\ngenerated/\nnode_modules/\n",
    ".sleepyhollow/project.ts":
      `export interface SleepyHollowProject {\n  readonly name: string;\n  readonly apiDirectory: string;\n  readonly requirementsFile: string;\n  readonly generatedDirectory: string;\n  readonly securityModule?: string;\n}\n\nexport function defineProject<const Project extends SleepyHollowProject>(\n  project: Project,\n): Project {\n  return Object.freeze(project);\n}\n`,
    ".sleepyhollow/verify.ts":
      `import { stat } from "fs/promises";
import config from "../sleepyhollow.config.ts";

/** Verifies that the scaffold still exposes its canonical project locations. */
async function verifyScaffold(): Promise<void> {
  const required = ["api", "generated", "models", "requirements/application.req.md", "tests"];

  for (const path of required) {
    await stat(path);
  }

  const isCanonicalDirectoryLayout =
    config.apiDirectory === "api" &&
    config.requirementsFile === "requirements/application.req.md" &&
    config.generatedDirectory === "generated";
  if (!isCanonicalDirectoryLayout) {
    throw new Error("Invalid Sleepy Hollow project configuration");
  }
}

await verifyScaffold();
process.stdout.write("Sleepy Hollow scaffold verified\\n");
`,
    "README.md":
      `# ${name}\n\nAn empty Sleepy Hollow application scaffold. It contains no generated or\napproved endpoints yet.\n\n## Begin planning\n\nActivate the official Sleepy Hollow skill in your agent environment, then ask it\nto plan this application. The planning source of truth is\n\`requirements/application.req.md\`. Durable data uses Drizzle by default, and\nevery model lives under \`models/<model>/\` with its own \`<model>.req.md\`.\n\nAI agents and human contributors follow the same application engineering\nstandard. Read \`CONTRIBUTING.md\` before changing application code.\n\n## Verify\n\n\`\`\`bash\nnpm run verify\nnpx hollow test\nnpx hollow check\n\`\`\`\n\n## Prepare deployment\n\nAfter adding a production \`start\` script, prepare reviewable Fly deployment\nfiles locally. This command does not log in to or deploy to Fly:\n\n\`\`\`bash\nhollow deploy prepare --target fly:${name} --database sqlite --region iad\n\`\`\`\n`,
    "CONTRIBUTING.md": `# Contributing to ${name}

This application uses one engineering standard for AI-generated and
human-authored code. Generated code receives no reduced review, testing, or
documentation standard. Read the owning approved requirement before changing
behavior, preserve its exact governance record, and add mapped red-state tests
before implementation.

## Source standard

- Run the version-controlled Prettier and typed ESLint configuration. Keep lines
  within 100 columns and one logical statement per line.
- Give every application-owned function an immediately preceding TSDoc comment
  that explains its purpose and behavior. Document meaningful inputs, outputs,
  errors, and side effects.
- Use descriptive domain names. Boolean names begin with \`is\`, \`has\`, \`can\`,
  or \`should\`; avoid unexplained abbreviations and single-letter names.
- Keep one responsibility per function, at most four parameters, at most 40
  executable lines, complexity at most 10, and nesting at most three levels.
- Use strict TypeScript. Do not use explicit \`any\`, non-null assertions,
  \`@ts-ignore\`, \`@ts-nocheck\`, floating promises, or blanket lint suppressions.
- Validate untrusted values at the boundary. Expected failures use typed domain
  errors and consistent RFC 9457 problem responses. Empty catch blocks and
  swallowed failures are forbidden.
- Routes own HTTP concerns, models own domain concepts, and repositories own
  persistence. Routes do not import Drizzle or database drivers directly.
- Use Drizzle for durable relational data unless an exact human-approved
  exception is recorded. Keep each model under \`models/<model>/\` with its
  requirement, schema, repository, and public types.
- Await asynchronous work, add timeouts and cancellation to external I/O, use
  transactions for related writes, and avoid N+1 query patterns.
- Treat authentication and authorization separately and deny unauthorized
  access by default. Never log credentials, tokens, secrets, or sensitive data.
- Use structured application logging instead of \`console\`, including a request
  or correlation identifier when available.
- Justify new dependencies, check existing capabilities first, and review the
  package and lockfile change.

## Tests

Map every approved acceptance criterion to deterministic tests. Cover relevant
success, validation, authorization, failure, and boundary behavior. Mock
external boundaries rather than the implementation, and add a regression test
for every defect repair. Never weaken a test to make it pass.

## Exceptions

A narrow suppression or standards exception names the exact rule, scope, reason,
approver, and decision source in the owning approved requirement. Blanket
suppressions are not allowed.

## Required checks

Run every command against the same revision:

\`\`\`bash
npm run format:check
npm run lint
npm run check
npm run test
npx hollow test
npx hollow check
\`\`\`
`,
    "tests/capture.ts":
      `import { rename, writeFile } from "fs/promises";

interface CaptureArtifact {
  readonly schema: "sleepy-hollow-capture/v1";
  readonly runner: string;
  readonly revision: string;
  readonly requests: readonly unknown[];
  readonly dataOperations: readonly unknown[];
  readonly uncapturedRoutes: readonly unknown[];
}

interface CaptureSession {
  readonly runner: string;
  readonly revision: string;
  readonly artifact: () => CaptureArtifact;
}

const records = {
  requests: [] as unknown[],
  dataOperations: [] as unknown[],
  uncapturedRoutes: [] as unknown[],
};

export const CAPTURE_ARTIFACT = "generated/capture.json";

export const session: CaptureSession = {
  runner: "vitest",
  revision: process.env.SLEEPY_HOLLOW_REVISION ?? "workspace",

  /** Returns the capture artifact generated by the current test run. */
  artifact(): CaptureArtifact {
    return {
      schema: "sleepy-hollow-capture/v1",
      runner: session.runner,
      revision: session.revision,
      ...records,
    };
  },
};

/** Atomically persists current test observations for hollow check. */
export async function persist(): Promise<void> {
  const staging = CAPTURE_ARTIFACT + ".partial";
  const artifact = JSON.stringify(session.artifact(), null, 2) + "\\n";
  await writeFile(staging, artifact, { flag: "wx" });
  await rename(staging, CAPTURE_ARTIFACT);
}
`,
    "tests/capture_test.ts":
      `import { test } from "vitest";
import { persist } from "./capture.ts";

/** Persists a capture artifact that the independent check can consume. */
async function persistCaptureArtifact(): Promise<void> {
  await persist();
}

test("capture artifact is persisted", persistCaptureArtifact);
`,
    "api/.gitkeep": "",
    "package.json": JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        engines: { node: ">=24" },
        scripts: {
          format: "prettier --write .",
          "format:check": "prettier --check .",
          lint: "eslint .",
          check: "tsc --noEmit",
          test: "vitest run",
          verify:
            "npm run format:check && npm run lint && npm run check && npm run test && node .sleepyhollow/verify.ts",
        },
        dependencies: {
          "@sleepy-hollow/framework": `^${FRAMEWORK_VERSION}`,
          "drizzle-orm": "^0.45.2",
        },
        devDependencies: {
          "@eslint/js": "^10.0.0",
          "@types/node": "26.2.0",
          "drizzle-kit": "^0.31.10",
          eslint: "^10.0.0",
          globals: "^16.0.0",
          prettier: "^3.0.0",
          typescript: "5.9.3",
          "typescript-eslint": "^8.0.0",
          vitest: "4.1.11",
        },
      },
      null,
      2,
    ) + "\n",
    "eslint.config.js":
      `import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["generated/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      complexity: ["error", 10],
      "max-depth": ["error", 3],
      "max-lines-per-function": ["error", { max: 40, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 4],
      "no-console": "error",
      "no-else-return": "error",
      "no-warning-comments": ["error", { terms: ["todo", "fixme"], location: "anywhere" }],
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },
);
`,
    "prettier.config.js":
      `/** @type {import("prettier").Config} */
export default {
  printWidth: 100,
};
`,
    "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": [
    ".sleepyhollow/**/*.ts",
    "api/**/*.ts",
    "models/**/*.ts",
    "tests/**/*.ts",
    "sleepyhollow.config.ts",
    "vitest.config.ts"
  ],
  "exclude": ["generated", "node_modules"]
}
`,
    "vitest.config.ts":
      `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["**/*_test.ts", "**/*.test.ts"],
  },
});
`,
    "generated/.gitkeep": "",
    "models/.gitkeep": "",
    "requirements/application.req.md":
      `---\nschema: sgad-application/v0.2\nid: ${name}-application\ntitle: ${name}\nstatus: draft\nrisk: standard\ndepends_on: []\nowners:\n  - application owner\n---\n\n# Application requirements\n\nUse the official Sleepy Hollow skill to replace this planning placeholder with\nthe complete application requirements before generating endpoints.\n\n## Cross-cutting acceptance criteria\n\n- AC-APP-PLACEHOLDER-001: The application requirements are completed and approved before implementation.\n\n## Governance record\n`,
    "sleepyhollow.config.ts":
      `import { defineProject, type SleepyHollowProject } from "./.sleepyhollow/project.ts";

export default defineProject({
  name: "${name}",
  apiDirectory: "api",
  requirementsFile: "requirements/application.req.md",
  generatedDirectory: "generated",
} satisfies SleepyHollowProject);
`,
    "tests/scaffold_test.ts":
      `import { expect, test } from "vitest";
import config from "../sleepyhollow.config.ts";

/** Confirms that the generated configuration retains the requested project name. */
function expectScaffoldConfiguration(): void {
  expect(config.name).toBe("${name}");
}

test("empty scaffold configuration", expectScaffoldConfiguration);
`,
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

export const FRAMEWORK_VERSION = "0.4.0";

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
