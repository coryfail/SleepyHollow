import config from "../sleepyhollow.config.ts";

Deno.test("empty scaffold configuration", () => {
  if (config.name !== "authentication") {
    throw new Error("Unexpected project name");
  }
});
