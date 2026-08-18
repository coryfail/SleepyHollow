import { defineProject } from "./.sleepyhollow/project.ts";

export default defineProject(
  {
    name: "todos",
    apiDirectory: "api",
    requirementsFile: "requirements/application.req.md",
    generatedDirectory: "generated",
  } satisfies import("./.sleepyhollow/project.ts").SleepyHollowProject,
);
