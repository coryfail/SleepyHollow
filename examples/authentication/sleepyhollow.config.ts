import { defineProject } from "./.sleepyhollow/project.ts";

export default defineProject(
  {
    name: "authentication",
    apiDirectory: "api",
    requirementsFile: "requirements/application.req.md",
    generatedDirectory: "generated",
    securityModule: "security.ts",
  } satisfies import("./.sleepyhollow/project.ts").SleepyHollowProject,
);
