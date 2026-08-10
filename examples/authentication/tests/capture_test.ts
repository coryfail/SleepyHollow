import { persist } from "./capture.ts";

Deno.test("capture artifact is persisted", async () => {
  await persist();
});
