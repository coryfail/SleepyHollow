import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const website = resolve(here, "..");
const repository = resolve(website, "..");
const read = (path) => {
  try { return readFileSync(resolve(website, path), "utf8"); } catch { return ""; }
};
const source = (path) => read(`src/${path}`);
const home = () => source("pages/sleepy-hollow/SleepyHollowPage.tsx");
const sgad = () => source("pages/sgad/SgadPage.tsx");
const footer = () => source("components/SiteFooter.tsx");
const site = () => source("site.ts");
const shared = () => `${source("App.tsx")}\n${source("components/SiteHeader.tsx")}\n${site()}\n${read("src/styles.css")}`;

test("AC-SITE-001 AC-SITE-003 · build defines independent root and SGAD entries", () => {
  assert.ok(existsSync(resolve(website, "sgad/index.html")), "missing sgad/index.html");
  assert.match(read("vite.config.ts"), /rollupOptions/);
  assert.match(read("vite.config.ts"), /sgad/);
  assert.match(read("vite.config.ts"), /base:\s*["']\/['"]/);
});

test("AC-SITE-003 · production artifact declares the approved custom domain", () => {
  assert.equal(read("public/CNAME").trim(), "sleepyhollow.io");
});

test("AC-SITE-002 AC-HOME-005 AC-WEB-SGAD-009 · shared navigation connects and identifies both pages", () => {
  const text = shared();
  assert.match(text, /aria-current/);
  assert.match(text, /Sleepy Hollow/);
  assert.match(text, /SGAD/);
  assert.match(text, /BASE_URL/);
});

test("AC-SITE-004 · both static documents retain core no-JavaScript content", () => {
  for (const document of [read("index.html"), read("sgad/index.html")]) {
    assert.match(document, /<noscript>/);
    assert.match(document, /<h1>/);
    assert.match(document, /<a /);
  }
});

test("AC-SITE-005 AC-HOME-008 · shared nocturnal tokens support distinct page structures", () => {
  assert.match(read("tokens.css"), /--color-paper:\s*oklch\(/);
  assert.match(home(), /home-page/);
  assert.match(sgad(), /sgad-page/);
  assert.doesNotMatch(home(), /className="lifecycle"/);
});

test("AC-SITE-006 AC-SITE-007 AC-SITE-008 · accessibility, responsive, and reduced-motion checks cover both routes", () => {
  const tests = read("tests/landing-page.spec.ts");
  for (const width of [320, 375, 414, 768]) assert.match(tests, new RegExp(`width:\\s*${width}`));
  assert.match(tests, /path:\s*["']\/sgad\/['"]/);
  assert.match(tests, /AxeBuilder/);
  assert.match(tests, /reducedMotion:\s*["']reduce/);
  assert.match(shared(), /:focus-visible/);
});

test("AC-SITE-009 · source remains public, read-only, and storage-free", () => {
  const text = `${shared()}\n${home()}\n${sgad()}\n${read("package.json")}`;
  assert.doesNotMatch(text, /analytics|posthog|segment|localStorage|sessionStorage|indexedDB|<form|<input/i);
});

test("AC-SITE-010 · Pages workflow verifies branches and only deploys main", () => {
  const workflow = readFileSync(resolve(repository, ".github/workflows/website-pages.yml"), "utf8");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /github\.event_name\s*==\s*'push'/);
  assert.match(
    workflow,
    /group:\s*pages-\$\{\{\s*github\.event_name\s*\}\}-\$\{\{\s*github\.ref\s*\}\}/,
  );
});

test("LICENSE · public license copy matches the repository license", () => {
  const license = readFileSync(resolve(repository, "LICENSE"), "utf8");
  assert.match(license, /^Mozilla Public License Version 2\.0/);
  assert.match(footer(), /Mozilla Public License Version 2\.0/);
  assert.doesNotMatch(footer(), /\bMIT\b/i);
});

test("AC-SITE-011 · traceability covers every declared two-page criterion", () => {
  const requirement = read("requirements.md");
  const mapping = requirement.split("### Criterion mapping")[1]?.split("### Red-state evidence")[0] ?? "";
  const ids = new Set(Array.from(mapping.matchAll(/\| (AC-(?:SITE|HOME|WEB-SGAD)-\d{3}) \|/g), (match) => match[1]));
  for (const [prefix, count] of [["AC-SITE", 11], ["AC-HOME", 10], ["AC-WEB-SGAD", 12]]) {
    for (let number = 1; number <= count; number += 1) {
      assert.ok(ids.has(`${prefix}-${String(number).padStart(3, "0")}`));
    }
  }
  assert.match(requirement, /Two-page split[\s\S]*3 passed, 11 failed/i);
});

test("AC-HOME-001 AC-HOME-003 · home opens with an honest, plain-language product definition", () => {
  assert.match(home(), /agentic-first headless API framework for Deno/i);
  assert.match(home(), /in development/i);
  assert.match(home(), /runs JavaScript and TypeScript outside the browser/i);
});

test("AC-HOME-002 AC-HOME-004 AC-HOME-009 · home explains the planned system and introduces SGAD", () => {
  const text = home();
  for (const phrase of ["reviewed requirements", "test-driven development", "deterministic", "deployable API", "Specification-Governed Agentic Development"]) {
    assert.match(text, new RegExp(phrase, "i"));
  }
  assert.match(site(), /github\.com\/coryfail\/SleepyHollow/);
});

test("AC-HOME-006 AC-HOME-007 AC-HOME-010 · home excludes methodology detail and unsupported product claims", () => {
  const text = home();
  assert.doesNotMatch(text, /Observe expected red|Deliver with evidence|my-application\/|EvidenceTrail|evidence-trail/);
  assert.doesNotMatch(text, /install now|production[- ]ready|customers|% faster/i);
});

test("AC-WEB-SGAD-001 AC-WEB-SGAD-002 AC-WEB-SGAD-011 · SGAD is independent, bounded, and honestly described", () => {
  const text = sgad();
  assert.match(text, /Specification-Governed Agentic Development/);
  assert.match(text, /without Sleepy Hollow/i);
  assert.match(text, /humans? (?:review|approve)/i);
  assert.match(text, /proposed open methodology/i);
  assert.match(text, /not (?:a guarantee|an established industry standard)/i);
});

test("AC-WEB-SGAD-003 AC-WEB-SGAD-004 AC-WEB-SGAD-005 · SGAD explains every ordered responsibility and verification boundary", () => {
  const text = sgad();
  for (const phrase of ["Specify", "Approve", "acceptance tests", "expected red", "Implement", "Verify independently", "Deliver with evidence"]) {
    assert.match(text, new RegExp(phrase, "i"));
  }
  assert.match(text, /syntax|configuration|dependency|test environment/i);
  assert.match(text, /producing agent[^.]*not the (?:verification )?verdict/i);
});

test("AC-WEB-SGAD-006 AC-WEB-SGAD-007 AC-WEB-SGAD-008 AC-WEB-SGAD-010 AC-WEB-SGAD-012 · SGAD provides an understandable adoption reference", () => {
  const text = sgad();
  for (const phrase of ["stable acceptance-criterion", "Record approval inside", "bidirectional", "independent verification command", "my-application/", "requirements/application.md", "feature/", "requirements.md", "feature.test.ts", "feature.ts", "complete governance history", "criterion mapping", "supporting provenance"]) {
    assert.match(text, new RegExp(phrase, "i"));
  }
  assert.match(text, /file-map__nested/);
  assert.match(site(), /docs\/sgad/);
  assert.match(site(), /sgadGuideUrl}\/templates/);
  assert.match(text, /content digest/i);
  assert.match(site(), /npx skills add/);
  assert.match(site(), /coryfail\/SleepyHollow --skill sgad-workflow/);
  assert.doesNotMatch(text, /\$skill-installer/);
  assert.doesNotMatch(text, /tree\/main\/skill\/sgad-workflow/);
});
