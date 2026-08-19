import { rename, writeFile } from "fs/promises";
const records = {
  requests: [] as unknown[],
  dataOperations: [] as unknown[],
  uncapturedRoutes: [] as unknown[],
};

export const CAPTURE_ARTIFACT = "generated/capture.json";

export const session = {
  runner: "vitest",
  revision: process.env.SLEEPY_HOLLOW_REVISION ?? "workspace",
  artifact() {
    return {
      schema: "sleepy-hollow-capture/v1",
      runner: session.runner,
      revision: session.revision,
      ...records,
    };
  },
};

export async function persist(): Promise<void> {
  const staging = CAPTURE_ARTIFACT + ".partial";
  await writeFile(staging, JSON.stringify(session.artifact(), null, 2) + "\n", { flag: "wx" });
  await rename(staging, CAPTURE_ARTIFACT);
}
