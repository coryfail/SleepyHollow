const records = {
  requests: [] as unknown[],
  dataOperations: [] as unknown[],
  uncapturedRoutes: [] as unknown[],
};

export const CAPTURE_ARTIFACT = "generated/capture.json";

function revision(): string {
  try {
    return Deno.env.get("SLEEPY_HOLLOW_REVISION") ?? "workspace";
  } catch {
    return "workspace";
  }
}

export const session = {
  runner: "deno test",
  revision: revision(),
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
  await Deno.writeTextFile(
    staging,
    JSON.stringify(session.artifact(), null, 2) + "\n",
  );
  await Deno.rename(staging, CAPTURE_ARTIFACT);
}
