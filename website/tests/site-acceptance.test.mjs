import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
const docs = () => `${source("pages/docs/DocsPage.tsx")}\n${source("pages/docs/DocsIndexPage.tsx")}`;
const footer = () => source("components/SiteFooter.tsx");
const site = () => source("site.ts");
const shared = () => `${source("App.tsx")}\n${source("components/SiteHeader.tsx")}\n${site()}\n${read("src/styles.css")}`;
/** Source text with line wrapping collapsed, so a phrase check is not defeated by JSX formatting. */
const prose = (text) => text.replace(/\s+/g, " ");

const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = resolve(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const generatedGuides = async () => {
  const module = await import(new URL("../generated/docs-content.js", import.meta.url).href);
  return module.guides;
};

test("AC-SITE-001 AC-SITE-003 · build defines independent root and SGAD entries", () => {
  assert.ok(existsSync(resolve(website, "sgad/index.html")), "missing sgad/index.html");
  assert.match(read("vite.config.ts"), /rollupOptions/);
  assert.match(read("vite.config.ts"), /sgad/);
  assert.match(read("vite.config.ts"), /base:\s*["']\/['"]/);
});

test("AC-SITE-003 · production artifact declares the approved custom domain", () => {
  assert.equal(read("public/CNAME").trim(), "sleepyhollow.io");
});

test("AC-SITE-002 AC-HOME-005 AC-HOME-014 AC-WEB-SGAD-009 · shared navigation connects and identifies every destination", () => {
  const text = shared();
  assert.match(text, /aria-current/);
  assert.match(text, /Sleepy Hollow/);
  assert.match(text, /SGAD/);
  assert.match(text, /BASE_URL/);
  assert.match(text, /Documentation|Docs/);
  assert.match(site(), /docs:\s*`\$\{import\.meta\.env\.BASE_URL\}docs\//);
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
  assert.match(docs(), /docs-page/);
  assert.doesNotMatch(home(), /className="lifecycle"/);
});

test("AC-SITE-006 AC-SITE-007 AC-SITE-008 · accessibility, responsive, and reduced-motion checks cover every route", () => {
  const tests = read("tests/landing-page.spec.ts");
  for (const width of [320, 375, 414, 768]) assert.match(tests, new RegExp(`width:\\s*${width}`));
  assert.match(tests, /path:\s*["']\/sgad\/['"]/);
  assert.match(tests, /path:\s*["']\/docs\/['"]/);
  assert.match(tests, /AxeBuilder/);
  assert.match(tests, /reducedMotion:\s*["']reduce/);
  assert.match(shared(), /:focus-visible/);
});

test("AC-SITE-009 AC-DOCS-010 · source remains public, read-only, and storage-free", () => {
  const text = `${shared()}\n${home()}\n${sgad()}\n${docs()}\n${read("package.json")}`;
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
  assert.match(workflow, /docs\/framework\/\*\*/, "guide sources must trigger a website build");
});

test("LICENSE · public license copy matches the repository license", () => {
  const license = readFileSync(resolve(repository, "LICENSE"), "utf8");
  assert.match(license, /^Mozilla Public License Version 2\.0/);
  assert.match(footer(), /Mozilla Public License Version 2\.0/);
  assert.doesNotMatch(footer(), /\bMIT\b/i);
});

test("AC-SITE-011 · traceability covers every declared criterion", () => {
  const requirement = read("website.req.md");
  const mapping = requirement.split("### Criterion mapping")[1]?.split("### Red-state evidence")[0] ?? "";
  const ids = new Set(Array.from(mapping.matchAll(/\| (AC-(?:SITE|HOME|WEB-SGAD|DOCS)-\d{3}) \|/g), (match) => match[1]));
  for (const [prefix, count] of [["AC-SITE", 16], ["AC-HOME", 21], ["AC-WEB-SGAD", 14], ["AC-DOCS", 10]]) {
    for (let number = 1; number <= count; number += 1) {
      assert.ok(ids.has(`${prefix}-${String(number).padStart(3, "0")}`), `missing mapping for ${prefix}-${String(number).padStart(3, "0")}`);
    }
  }
  assert.match(requirement, /Two-page split[\s\S]*3 passed, 11 failed/i);
});

test("AC-HOME-001 AC-HOME-003 AC-HOME-016 · home opens as an agentic framework with the method built in", () => {
  const text = prose(home());
  assert.match(text, /agentic-first headless API framework for Deno/i);
  assert.match(text, /Specification-Governed Agentic Development/);
  assert.match(text, /built in|built into/i, "SGAD must be presented as part of the framework");
  assert.match(text, /in development/i);
  assert.match(text, /pre-1\.0/i);
  assert.match(text, /runs JavaScript and TypeScript outside the browser/i);
  assert.match(text, /rapidly|quickly|fast/i, "the first screen must say what the framework is for");

  // The positioning must be on the first screen, not recovered later.
  const hero = prose(home()).split("home-problem")[0];
  assert.match(hero, /agentic-first/i, "the hero must carry the agentic positioning");
  assert.match(hero, /Specification-Governed Agentic Development/, "the hero must name the method");
});

test("AC-HOME-017 AC-HOME-018 · home makes the developer analogy and shows a compact method loop", () => {
  const text = prose(home());
  assert.match(text, /procedures/i);
  assert.match(text, /best practices|standards/i);
  assert.match(text, /requirements/i);
  assert.match(
    text,
    /(?:like|same as|just as)[^.]{0,120}(?:developer|engineer)/i,
    "the page must state that an agent needs what a developer needs",
  );

  const steps = home().match(/const method = \[([\s\S]*?)\n\] as const;/);
  assert.ok(steps, "the compact method loop must be a declared, countable list");
  const count = (steps[1].match(/^\s{2}\[/gm) ?? []).length;
  assert.ok(count > 0 && count <= 5, `the loop must be at most five steps, found ${count}`);

  // The loop belongs above the route example (AC-HOME-018).
  assert.ok(
    home().indexOf('className="home-method"') < home().indexOf('className="home-code"'),
    "the method loop must appear above the code example",
  );
  assert.match(text, /sitePaths\.sgad/, "the loop must route to the complete lifecycle");
});

test("AC-HOME-021 · the method loop carries a test-first step with a meaningful red", () => {
  const steps = home().match(/const method = \[([\s\S]*?)\n\] as const;/);
  assert.ok(steps, "the compact method loop must be a declared, countable list");
  const loop = prose(steps[1]);

  assert.match(loop, /tests? (?:come|are written) first|test-first|before the (?:code|implementation)/i,
    "one step must establish that tests precede the implementation");
  assert.match(loop, /approved/i, "the tests must be tied to the approved requirement");
  assert.match(
    loop,
    /(?:missing|absent)[^.]{0,80}(?:behaviou?r)|behaviou?r[^.]{0,40}(?:missing|absent)/i,
    "the step must say the failure is caused by missing behavior",
  );
  assert.match(
    loop,
    /not because[^.]{0,80}(?:setup|harness|configuration|environment)|setup is broken|harness is broken/i,
    "the step must distinguish a meaningful red from a broken test setup",
  );
});

test("AC-HOME-019 AC-HOME-020 · senior-engineer language describes procedure, and no figure is claimed", () => {
  const text = prose(home());
  assert.match(text, /senior/i, "the page must make the standards comparison the owner asks for");

  // The claim is about enforced procedure, never about output quality.
  assert.doesNotMatch(
    text,
    /senior[- ](?:quality|grade|level) code|code (?:as good as|indistinguishable from) a (?:senior|human)|writes like a senior/i,
    "the page must not claim the output is senior-quality",
  );
  assert.doesNotMatch(
    text,
    /no (?:human )?review (?:is )?(?:needed|required)|without human review|replaces? (?:your )?(?:code )?review/i,
    "the page must not claim human review becomes unnecessary",
  );
  assert.doesNotMatch(
    text,
    /guarantees? (?:correct|working|bug-free)|bug[- ]free|provably correct/i,
    "the page must not claim correctness",
  );

  // No measured claim of any kind.
  assert.doesNotMatch(
    text,
    /\d+\s*(?:%|x\b|times (?:faster|fewer|more))|\d+\s*(?:hours?|days?|weeks?) saved|cuts? .{0,20}\bby \d+/i,
    "the page must carry no productivity or velocity figure",
  );
});

test("AC-HOME-002 AC-HOME-004 AC-HOME-009 · home explains the system and introduces SGAD", () => {
  const text = home();
  for (const phrase of ["reviewed requirements", "test-driven development", "deterministic", "deployable API", "Specification-Governed Agentic Development"]) {
    assert.match(text, new RegExp(phrase, "i"));
  }
  assert.match(site(), /github\.com\/coryfail\/SleepyHollow/);
});

test("AC-HOME-006 AC-HOME-007 AC-HOME-010 · home excludes full methodology detail and unsupported claims", () => {
  const text = home();
  assert.doesNotMatch(text, /Observe expected red|Deliver with evidence|my-application\/|EvidenceTrail|evidence-trail/);
  assert.doesNotMatch(text, /production[- ]ready|customers|% faster|battle[- ]tested|trusted by/i);
  // A compact loop is permitted; the seven-stage lifecycle is not.
  assert.doesNotMatch(text, /className="lifecycle"/);
});

test("AC-HOME-011 AC-SITE-016 · home shows the real published install commands", () => {
  const text = `${home()}\n${site()}`;
  assert.match(text, /deno add jsr:@sleepy-hollow\/framework/);
  assert.match(text, /deno install -A --global --name hollow jsr:@sleepy-hollow\/framework\/cli/);
  assert.match(site(), /jsr\.io\/@sleepy-hollow\/framework/);

  const manifest = JSON.parse(readFileSync(resolve(repository, "deno.json"), "utf8"));
  assert.equal(manifest.name, "@sleepy-hollow/framework");
  const readme = readFileSync(resolve(repository, "README.md"), "utf8");
  assert.match(readme, /deno add jsr:@sleepy-hollow\/framework/);
  assert.match(readme, /deno install -A --global --name hollow jsr:@sleepy-hollow\/framework\/cli/);
});

test("AC-HOME-012 · home shows a route definition written against the current public API", () => {
  const text = home();
  for (const token of ["defineRoute", "schemas", "responses", "security", "authentication", "handler"]) {
    assert.match(text, new RegExp(token));
  }
  assert.match(text, /@sleepy-hollow\/framework/);
  assert.match(text, /\.strict\(\)/, "the example must show the strict-schema rule the runtime enforces");
});

test("AC-HOME-013 AC-HOME-015 · home names what verification rejects and what the framework provides", () => {
  const text = prose(home());
  assert.match(text, /hollow check/);
  assert.match(text, /no test (?:ever )?(?:exercised|touched)|never (?:exercised|observed)/i);
  assert.match(text, /SH_CHECK_ROUTE_UNOBSERVED/, "the page must show the diagnostic the CLI actually emits");
  const verifier = readFileSync(resolve(repository, "cli/check/verifier.ts"), "utf8");
  assert.match(verifier, /"SH_CHECK_ROUTE_UNOBSERVED"/, "the shown diagnostic code must exist in the CLI");
  assert.match(
    prose(verifier),
    /carries approved criteria but runtime capture never observed it/,
    "the shown failure text must be the text the CLI emits",
  );
  for (const capability of ["routing", "validation", "security", "deploy"]) {
    assert.match(text, new RegExp(capability, "i"));
  }
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
  for (const phrase of ["stable acceptance-criterion", "Record approval inside", "bidirectional", "independent verification command", "my-application/", "requirements/application.req.md", "account/", "profile.req.md", "profile.test.ts", "profile.ts", "password-reset.req.md", "password-reset.test.ts", "password-reset.ts", "complete governance history", "criterion mapping", "supporting provenance"]) {
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

test("AC-WEB-SGAD-013 AC-WEB-SGAD-014 · SGAD explains the change in concrete terms before the lifecycle", () => {
  const text = sgad();
  const lifecycleAt = text.indexOf("lifecycle");
  const openingAt = text.search(/sgad-plainly|What changes|in practice/i);
  assert.ok(openingAt >= 0, "the page must carry a concrete plain-language opening");
  assert.ok(openingAt < lifecycleAt, "the concrete opening must precede the lifecycle");
  assert.match(text, /sitePaths\.docs|docsPaths/, "the page must route to the on-site SGAD documentation");
});

test("AC-SITE-012 AC-DOCS-003 · guide prose is generated, never copied into website source", () => {
  assert.ok(existsSync(resolve(website, "scripts/generate-docs.mjs")), "missing the documentation generator");
  const generator = read("scripts/generate-docs.mjs");
  assert.match(generator, /docs\/framework/);
  assert.match(generator, /docs\/sgad/);

  const fingerprints = [
    ["docs/framework/routing.md", "There is no route table to keep in sync"],
    ["docs/framework/verification.md", "Passing tests are evidence that assertions held"],
    ["docs/sgad/principles.md", "These principles govern how authority"],
  ];
  const sourceFiles = walk(resolve(website, "src")).filter((path) => !path.endsWith(".req.md"));
  for (const [guide, fingerprint] of fingerprints) {
    const pattern = new RegExp(fingerprint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    assert.match(prose(readFileSync(resolve(repository, guide), "utf8")), pattern, `${guide} lost its fingerprint`);
    for (const path of sourceFiles) {
      assert.doesNotMatch(
        prose(readFileSync(path, "utf8")),
        pattern,
        `${path} holds a second copy of ${guide}`,
      );
    }
  }
});

test("AC-SITE-014 · no generated documentation output is tracked in version control", () => {
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: repository, encoding: "utf8" })
    .split("\0").filter(Boolean);
  for (const path of tracked) {
    assert.doesNotMatch(path, /^website\/docs\//, `${path} is generated output`);
    assert.doesNotMatch(path, /^website\/generated\//, `${path} is generated output`);
    assert.doesNotMatch(path, /^website\/dist\//, `${path} is build output`);
  }
  const ignored = readFileSync(resolve(repository, ".gitignore"), "utf8");
  assert.match(ignored, /website\/docs\//);
  assert.match(ignored, /website\/generated\//);
});

test("AC-SITE-015 · a curated guide whose source file is missing fails the build", async () => {
  const { planGuides } = await import(new URL("../scripts/generate-docs.mjs", import.meta.url).href);
  assert.throws(
    () => planGuides({ framework: ["getting-started", "renamed-away"], sgad: ["README"] }),
    /renamed-away/,
    "a guide whose source file is missing must fail loudly rather than publish a shorter site",
  );

  // A guide added to docs/ is published without editing website source.
  const withoutCuration = planGuides({ framework: [], sgad: [] });
  assert.equal(withoutCuration.length, planGuides().length, "uncurated guides must still be discovered");

  const complete = planGuides();
  assert.ok(complete.length >= 15, "every canonical guide must be planned");
});

test("AC-SITE-013 AC-DOCS-005 · the generated API reference is built and linked", () => {
  const manifest = JSON.parse(read("package.json"));
  const api = `${manifest.scripts["docs:api"] ?? ""} ${manifest.scripts["docs:api:generate"] ?? ""} ${manifest.scripts["docs:api:link"] ?? ""}`;
  assert.match(api, /deno doc --html/);
  assert.match(api, /--output=website\/dist\/api/);
  assert.match(api, /brand-api-reference/, "the generated reference must be linked back to the site");
  assert.match(manifest.scripts.postbuild ?? "", /docs:api/);
  assert.match(manifest.scripts.prebuild ?? "", /docs:build/);

  assert.match(site(), /api:\s*`\$\{import\.meta\.env\.BASE_URL\}api\//);
  assert.match(docs(), /sitePaths\.api/);
  assert.match(docs(), /generated from|documentation comments/i);
});

test("AC-DOCS-001 AC-DOCS-004 · every canonical guide is published, described, and ordered", async () => {
  const guides = await generatedGuides();
  const frameworkFiles = readdirSync(resolve(repository, "docs/framework")).filter((name) => name.endsWith(".md"));
  const sgadFiles = readdirSync(resolve(repository, "docs/sgad")).filter((name) => name.endsWith(".md"));
  assert.equal(guides.length, frameworkFiles.length + sgadFiles.length);

  for (const guide of guides) {
    assert.ok(guide.title, `${guide.route} has no title`);
    assert.ok(guide.summary && guide.summary.length > 10, `${guide.route} has no description`);
    assert.ok(["framework", "sgad"].includes(guide.group), `${guide.route} has no group`);
    assert.match(guide.route, /^\/docs\//);
    assert.ok(existsSync(resolve(website, `docs${guide.route.replace(/^\/docs/, "")}index.html`)), `${guide.route} has no entry document`);
  }

  assert.equal(guides[0].route, "/docs/getting-started/", "getting started must lead the reading order");
  assert.equal(guides.at(-1).next, null, "the last guide ends the reading order");
  assert.equal(guides[0].next.route, guides[1].route, "each guide links to the next in reading order");
  assert.ok(existsSync(resolve(website, "docs/index.html")), "missing the documentation index entry");
});

test("AC-DOCS-002 AC-DOCS-008 · rendered guides are semantic, single-h1, and bound their code blocks", async () => {
  const guides = await generatedGuides();
  for (const guide of guides) {
    assert.equal((guide.html.match(/<h1[\s>]/g) ?? []).length, 0, `${guide.route} must not repeat its title in the body`);
    assert.match(guide.html, /<h2[\s>]/, `${guide.route} lost its heading structure`);
    for (const heading of guide.html.matchAll(/<h([2-6]) id="([^"]+)"/g)) {
      assert.ok(heading[2].length > 0, `${guide.route} has an unanchored heading`);
    }
  }
  const routing = guides.find((guide) => guide.route === "/docs/routing/");
  assert.match(routing.html, /class="code-block"/, "fenced code must render inside a bounded region");
  assert.match(read("src/styles.css"), /\.code-block[\s\S]{0,200}overflow-x:\s*auto/);
});

test("AC-DOCS-006 · guide links resolve to site routes or the canonical repository", async () => {
  const guides = await generatedGuides();
  const gettingStarted = guides.find((guide) => guide.route === "/docs/getting-started/");
  assert.match(gettingStarted.html, /href="\/docs\/verification\/"/, "sibling guide links must resolve to site routes");
  assert.doesNotMatch(gettingStarted.html, /href="[^"]*\.md"/, "no rendered link may point at a raw Markdown path");

  for (const guide of guides) {
    for (const link of guide.html.matchAll(/href="([^"]+)"/g)) {
      const target = link[1];
      if (target.startsWith("#") || target.startsWith("https://")) continue;
      assert.match(target, /^\/(?:docs|sgad|api)\/|^\/$/, `${guide.route} has unresolved link ${target}`);
    }
  }

  const skillLink = guides.find((guide) => guide.html.includes("skills/sgad-workflow"));
  if (skillLink) {
    assert.match(skillLink.html, /https:\/\/github\.com\/coryfail\/SleepyHollow[^"]*skills\/sgad-workflow/);
  }
});

test("AC-DOCS-007 · every generated guide document carries its prose without JavaScript", async () => {
  const guides = await generatedGuides();
  for (const guide of guides) {
    const entry = read(`docs${guide.route.replace(/^\/docs/, "")}index.html`);
    assert.match(entry, /<noscript>/, `${guide.route} has no no-JavaScript fallback`);
    const fallback = entry.split("<noscript>")[1].split("</noscript>")[0];
    assert.match(fallback, /<h1[\s>]/, `${guide.route} fallback has no heading`);
    assert.ok(fallback.length > 500, `${guide.route} fallback is not the whole guide`);
    assert.match(fallback, /<a /, `${guide.route} fallback has no navigation`);
  }
});
