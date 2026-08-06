import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const homeSource = await readFile(new URL("../src/pages/sleepy-hollow/SleepyHollowPage.tsx", import.meta.url), "utf8");
const sgadSource = await readFile(new URL("../src/pages/sgad/SgadPage.tsx", import.meta.url), "utf8");

test("AC-HOME-009 AC-SGAD-008 · canonical destinations ship with the release", async () => {
  await Promise.all([
    access(new URL("../../docs/sgad/README.md", import.meta.url)),
    access(new URL("../../docs/sgad/templates/verification-report.md", import.meta.url)),
  ]);

  assert.match(homeSource, /github\.com\/coryfail\/SleepyHollow/);
  assert.match(sgadSource, /tree\/main\/docs\/sgad/);
  assert.match(sgadSource, /sgadGuideUrl}\/templates/);
});
