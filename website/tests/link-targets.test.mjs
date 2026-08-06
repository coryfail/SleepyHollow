import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const siteSource = await readFile(new URL("../src/site.ts", import.meta.url), "utf8");

test("AC-HOME-009 AC-WEB-SGAD-008 AC-WEB-SGAD-012 · canonical destinations ship with the release", async () => {
  await Promise.all([
    access(new URL("../../docs/sgad/README.md", import.meta.url)),
    access(new URL("../../docs/sgad/templates/application-requirements.md", import.meta.url)),
    access(new URL("../../docs/sgad/templates/component-requirements.md", import.meta.url)),
    access(new URL("../../skills/sgad-workflow/SKILL.md", import.meta.url)),
  ]);

  assert.match(siteSource, /github\.com\/coryfail\/SleepyHollow/);
  assert.match(siteSource, /tree\/main\/docs\/sgad/);
  assert.match(siteSource, /sgadGuideUrl}\/templates/);
  assert.match(siteSource, /--skill sgad-workflow/);
});
