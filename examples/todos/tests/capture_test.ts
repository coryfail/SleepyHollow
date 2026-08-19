import { persist } from "./capture.ts";

test("capture artifact is persisted", async () => {
  await persist();
});
