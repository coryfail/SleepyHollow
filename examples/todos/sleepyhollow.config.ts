import { defineProject } from "./.sleepyhollow/project.ts";

export default defineProject(
  {
    name: "todos",
    apiDirectory: "api",
    requirementsFile: "requirements/application.md",
    generatedDirectory: "generated",
  } satisfies import("./.sleepyhollow/project.ts").SleepyHollowProject,
);
