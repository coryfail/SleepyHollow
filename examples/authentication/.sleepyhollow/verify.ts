import { stat } from "fs/promises";
import config from "../sleepyhollow.config.ts";

const required = [
  "api",
  "generated",
  "models",
  "requirements/application.req.md",
  "tests",
];
for (const path of required) await stat(path);
if (
  config.apiDirectory !== "api" ||
  config.requirementsFile !== "requirements/application.req.md" ||
  config.generatedDirectory !== "generated"
) {
  throw new Error("Invalid Sleepy Hollow project configuration");
}
console.log("Sleepy Hollow scaffold verified");
