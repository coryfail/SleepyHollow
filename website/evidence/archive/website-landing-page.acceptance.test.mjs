import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const websiteDirectory = resolve(testDirectory, "..");
const repositoryDirectory = resolve(websiteDirectory, "..");

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const app = () => read(resolve(websiteDirectory, "src/App.tsx"));
const styles = () => read(resolve(websiteDirectory, "src/styles.css"));
const tokens = () => read(resolve(websiteDirectory, "tokens.css"));
const packageJson = () => read(resolve(websiteDirectory, "package.json"));
const viteConfig = () => read(resolve(websiteDirectory, "vite.config.ts"));
const indexHtml = () => read(resolve(websiteDirectory, "index.html"));
const browserTests = () => read(resolve(websiteDirectory, "tests/landing-page.spec.ts"));
const workflow = () =>
  read(resolve(repositoryDirectory, ".github/workflows/website-pages.yml"));
const traceability = () =>
  read(resolve(websiteDirectory, "evidence/traceability.json"));
const redEvidence = () =>
  read(resolve(websiteDirectory, "evidence/red-state.md"));

test("AC-WEB-001 · a static React production build is configured", () => {
  assert.match(packageJson(), /"build"\s*:\s*"[^"]*vite build/);
  assert.match(packageJson(), /"react"\s*:/);
  assert.match(viteConfig(), /defineConfig/);
  assert.match(indexHtml(), /<div id="root"><\/div>/);
});

test("AC-WEB-002 · the opening identifies Sleepy Hollow and its status", () => {
  assert.match(app(), /agentic-first headless API framework for Deno/i);
  assert.match(app(), /in development/i);
});

test("AC-WEB-003 · the framework explanation names its governed workflow", () => {
  const source = app();
  for (const phrase of ["reviewed requirements", "test-driven", "deterministic"]) {
    assert.match(source, new RegExp(phrase, "i"));
  }
});

test("AC-WEB-004 · SGAD is expanded and independent of Sleepy Hollow", () => {
  assert.match(app(), /Specification-Governed Agentic Development/);
  assert.match(app(), /without (?:using |adopting )?Sleepy Hollow/i);
});

test("AC-WEB-005 · the SGAD lifecycle keeps its responsibilities distinct", () => {
  const source = app();
  for (const responsibility of [
    "specify",
    "approve",
    "acceptance tests",
    "expected red",
    "implement",
    "verify",
    "deliver",
  ]) {
    assert.match(source, new RegExp(responsibility, "i"));
  }
});

test("AC-WEB-006 · independent adoption steps link to the guide and templates", () => {
  const source = app();
  assert.match(source, /use SGAD without Sleepy Hollow/i);
  assert.match(source, /docs\/sgad/);
  assert.match(source, /docs\/sgad\/templates/);
});

test("AC-WEB-007 · essential specialist terms are explained in nearby copy", () => {
  const source = app();
  assert.match(source, /Deno[^<]*(?:runtime|runs JavaScript and TypeScript)/i);
  assert.match(source, /test-driven development[^<]*(?:tests|test)/i);
  assert.match(source, /independent verification[^<]*(?:tool|check|evidence)/i);
});

test("AC-WEB-008 · public actions use canonical, non-placeholder destinations", () => {
  const source = app();
  assert.match(source, /https:\/\/github\.com\/coryfail\/SleepyHollow/);
  assert.doesNotMatch(source, /example\.com|href=["']#["']/i);
});

test("AC-WEB-009 · the visual system is atmospheric and token governed", () => {
  assert.match(styles(), /Hallmark · macrostructure: Narrative Workflow/);
  assert.match(styles(), /enrichment:\s*none/i);
  assert.match(tokens(), /--color-paper:\s*oklch\(/);
  assert.doesNotMatch(app(), /EvidenceTrail|evidence-trail/);
  assert.doesNotMatch(`${styles()}\n${app()}`, /halloween|gore|glowing orb/i);
});

test("AC-WEB-010 · the source declares semantic document landmarks", () => {
  const source = app();
  for (const element of ["header", "nav", "main", "section", "footer", "h1"]) {
    assert.match(source, new RegExp(`<${element}(?:\\s|>)`));
  }
});

test("AC-WEB-011 · keyboard focus receives an immediate visible indicator", () => {
  assert.match(styles(), /:focus-visible/);
  assert.match(styles(), /outline:/);
  assert.doesNotMatch(styles(), /transition[^;]*outline/);
});

test("AC-WEB-012 · browser accessibility checks include color contrast", () => {
  assert.match(browserTests(), /AxeBuilder/);
  assert.match(browserTests(), /color-contrast/);
  assert.match(browserTests(), /default|hover/);
});

test("AC-WEB-013 · required responsive widths and overflow protections are tested", () => {
  const tests = browserTests();
  for (const width of [320, 375, 414, 768]) {
    assert.match(tests, new RegExp(`width:\\s*${width}`));
  }
  assert.match(styles(), /overflow-x:\s*clip/);
  assert.match(styles(), /overflow-wrap:\s*anywhere/);
});

test("AC-WEB-014 · reduced-motion behavior is explicit and tested", () => {
  assert.match(styles(), /prefers-reduced-motion:\s*reduce/);
  assert.match(browserTests(), /reducedMotion:\s*["']reduce["']/);
});

test("AC-WEB-015 · the static page adds no collection or browser storage", () => {
  const source = `${app()}\n${packageJson()}\n${indexHtml()}`;
  assert.doesNotMatch(source, /analytics|segment|posthog|localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(source, /<form|<input/i);
});

test("AC-WEB-016 · pull requests verify without deploying", () => {
  const source = workflow();
  assert.match(source, /pull_request:/);
  assert.match(source, /github\.event_name\s*==\s*'push'/);
});

test("AC-WEB-017 · main deploys a least-privilege Pages artifact", () => {
  const source = workflow();
  assert.match(source, /branches:\s*\[main\]/);
  assert.match(source, /pages:\s*write/);
  assert.match(source, /id-token:\s*write/);
  assert.match(source, /actions\/upload-pages-artifact@/);
  assert.match(source, /actions\/deploy-pages@/);
  assert.match(source, /name:\s*github-pages/);
});

test("AC-WEB-018 · GitHub Pages uses the custom-domain root", () => {
  assert.match(viteConfig(), /base:\s*["']\/["']/);
  assert.match(browserTests(), /path:\s*["']\/sgad\/["']/);
});

test("AC-WEB-019 · traceability and expected-red evidence are retained", () => {
  const mapping = JSON.parse(traceability());
  const mappedCriteria = new Set(mapping.criteria.map(({ id }) => id));
  for (let index = 1; index <= 19; index += 1) {
    assert.ok(mappedCriteria.has(`AC-WEB-${String(index).padStart(3, "0")}`));
  }
  assert.match(redEvidence(), /result:\s*failed/);
  assert.match(redEvidence(), /expected missing behavior/i);
});
