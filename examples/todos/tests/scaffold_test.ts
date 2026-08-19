import config from "../sleepyhollow.config.ts";

test("empty scaffold configuration", () => {
  if (config.name !== "todos") {
    throw new Error("Unexpected project name");
  }
});
