import config from "../sleepyhollow.config.ts";

const required = [
  "api",
  "generated",
  "models",
  "requirements/application.md",
  "tests",
];
for (const path of required) await Deno.stat(path);
if (
  config.apiDirectory !== "api" ||
  config.requirementsFile !== "requirements/application.md" ||
  config.generatedDirectory !== "generated"
) {
  throw new Error("Invalid Sleepy Hollow project configuration");
}
console.log("Sleepy Hollow scaffold verified");
