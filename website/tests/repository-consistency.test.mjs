import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, "../..");
const read = (path) => readFileSync(resolve(repository, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = resolve(directory, entry.name);
  if (entry.isDirectory()) return walk(absolute);
  return [absolute];
});

const repositoryFiles = () => execFileSync(
  "rg",
  ["--files", "-g", "!website/node_modules/**", "-g", "!website/dist/**", "-g", "!website/test-results/**"],
  { cwd: repository, encoding: "utf8" },
).trim().split("\n").filter(Boolean);

const requirementPaths = () => repositoryFiles().filter((path) => (
  path === "requirements.md"
  || path === "requirements/application.md"
  || path.endsWith("/requirements.md")
)).sort();

const frontmatter = (document, path) => {
  const match = document.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, `${path} must begin with YAML frontmatter`);
  return parse(match[1]);
};

const governedContent = (document, path) => {
  const marker = "## Governance record\n";
  const markers = document.match(/^## Governance record$/gm) ?? [];
  assert.equal(markers.length, 1, `${path} must contain one Governance record`);
  const boundary = document.indexOf(marker);
  assert.ok(boundary >= 0, `${path} has a malformed Governance record heading`);
  const governed = document.slice(0, boundary);
  const governedFrontmatter = governed.match(/^---\n[\s\S]*?\n---\n/);
  assert.ok(governedFrontmatter, `${path} must expose YAML frontmatter before governance`);
  const normalizedFrontmatter = governedFrontmatter[0].replace(/^status:[^\n]*\n/m, "");
  const normalized = normalizedFrontmatter + governed.slice(governedFrontmatter[0].length);
  assert.notEqual(normalized, governed, `${path} must expose one top-level status projection`);
  return { governed, normalized, record: document.slice(boundary) };
};

const section = (document, heading) => {
  const marker = `## ${heading}\n`;
  const start = document.indexOf(marker);
  if (start < 0) return "";
  const remainder = document.slice(start + marker.length);
  const nextHeading = remainder.search(/^## /m);
  return (nextHeading < 0 ? remainder : remainder.slice(0, nextHeading)).trim();
};

test("AC-REPO-001 AC-REPO-002 · requirements use one digest and governance boundary", () => {
  const paths = requirementPaths();
  assert.ok(paths.length > 20, "the complete requirement set must be discoverable");
  for (const path of paths) {
    const document = read(path);
    const metadata = frontmatter(document, path);
    const { normalized, record } = governedContent(document, path);
    for (const field of ["schema", "id", "title", "status", "risk", "depends_on", "owners"]) {
      assert.notEqual(metadata[field], undefined, `${path} is missing ${field}`);
    }
    assert.ok(["draft", "approved", "verified"].includes(metadata.status), `${path} has invalid status`);
    assert.doesNotMatch(record.slice("## Governance record\n".length), /^## /m, `${path} has content after governance`);
    for (const heading of ["Approval", "Criterion mapping", "Red-state evidence", "Verification", "Delivery"]) {
      assert.match(record, new RegExp(`^### ${heading}$`, "m"), `${path} is missing ${heading}`);
    }
    assert.equal(sha256(normalized).length, 64);
  }

  const repositoryRequirement = read("requirements.md");
  const { normalized, record } = governedContent(repositoryRequirement, "requirements.md");
  assert.match(
    record,
    new RegExp(`Governed-content digest:[\\s\\S]{0,80}sha256:${sha256(normalized)}`),
    "the repository approval must bind the current governed content",
  );

  const canonicalRules = [
    "docs/sgad/artifacts-and-lifecycle.md",
    "docs/sgad/adoption-guide.md",
    "docs/sgad/templates/application-requirements.md",
    "docs/sgad/templates/component-requirements.md",
    "skills/sgad-workflow/SKILL.md",
    "skills/sgad-workflow/references/governance-and-artifacts.md",
  ].map(read).join("\n");
  assert.match(canonicalRules, /omit[\s\S]{0,160}top-level[\s\S]{0,80}`?status/is);
  assert.match(canonicalRules, /status[\s\S]{0,200}(?:projection|routing)[\s\S]{0,200}digest/is);
});

test("AC-REPO-003 · requirement, criterion, dependency, and decision identities resolve", () => {
  const documents = requirementPaths().map((path) => ({ path, document: read(path) }));
  const identities = new Map();
  for (const item of documents) {
    const metadata = frontmatter(item.document, item.path);
    assert.equal(identities.has(metadata.id), false, `duplicate requirement ID ${metadata.id}`);
    identities.set(metadata.id, item.path);
  }

  for (const item of documents) {
    const metadata = frontmatter(item.document, item.path);
    for (const dependency of metadata.depends_on) {
      assert.ok(identities.has(dependency), `${item.path} has unresolved dependency ${dependency}`);
    }
    for (const decision of metadata.open_decisions ?? []) {
      assert.match(read("requirements/application.md"), new RegExp(`\\| ${decision} \\|`), `${item.path} has unresolved ${decision}`);
    }
  }

  const criteria = new Map();
  for (const item of documents) {
    for (const match of item.document.matchAll(/^- (AC-[A-Z0-9-]+-\d{3}):/gm)) {
      assert.equal(criteria.has(match[1]), false, `duplicate criterion ID ${match[1]}`);
      criteria.set(match[1], item.path);
    }
  }
  assert.match(read("website/src/pages/sgad/requirements.md"), /AC-WEB-SGAD-001/);
  assert.doesNotMatch(read("website/src/pages/sgad/requirements.md"), /^- AC-SGAD-/m);
});

test("AC-REPO-004 · requirement placement follows behavioral ownership", () => {
  const applicationDirectory = resolve(repository, "requirements");
  assert.deepEqual(
    walk(applicationDirectory).map((path) => relative(applicationDirectory, path)).sort(),
    ["application.md"],
  );
  assert.equal(existsSync(resolve(repository, "requirements.md")), true);

  const guidance = [
    "docs/sgad/README.md",
    "docs/sgad/adoption-guide.md",
    "docs/sgad/artifacts-and-lifecycle.md",
    "skills/sgad-workflow/SKILL.md",
    "skills/sgad-workflow/references/adoption.md",
    "website/src/pages/sgad/SgadPage.tsx",
  ].map(read).join("\n");
  assert.match(guidance, /requirements\/application\.md[\s\S]{0,200}(?:product|application)-wide|(?:product|application)-wide[\s\S]{0,200}requirements\/application\.md/i);
  assert.match(guidance, /component[\s\S]{0,160}requirements\.md[\s\S]{0,160}(?:colocat|own|beside)/i);
  assert.match(guidance, /root `?requirements\.md`?[\s\S]{0,160}repository-wide/i);
});

test("AC-REPO-005 · current naming and status claims are honest", () => {
  const readme = read("README.md");
  assert.match(readme, /^# Sleepy Hollow$/m);
  assert.match(readme, /in\s+development/i);
  assert.doesNotMatch(readme, /production[- ]ready/i);
  assert.doesNotMatch(read("CONTRIBUTING.md"), /main contains production-ready code/i);

  const currentGuidance = [
    "requirements/application.md",
    "docs/sgad/README.md",
    "docs/sgad/requirements.md",
    "skills/sgad-workflow/SKILL.md",
    "skills/sgad-workflow/requirements.md",
  ].map(read).join("\n");
  assert.doesNotMatch(currentGuidance, /verification-report\.md|verification reports? template/i);
  assert.match(read("docs/sgad/README.md"), /draft methodology/i);
});

test("AC-REPO-006 · docs, skill, templates, links, and metadata stay aligned", () => {
  for (const name of ["application-requirements.md", "component-requirements.md"]) {
    assert.equal(
      read(`docs/sgad/templates/${name}`),
      read(`skills/sgad-workflow/assets/templates/${name}`),
      `${name} differs from its packaged copy`,
    );
  }

  let links = 0;
  for (const path of repositoryFiles().filter((path) => path.endsWith(".md"))) {
    const document = read(path);
    for (const match of document.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^(?:https?:|mailto:|#)/.test(target)) continue;
      const local = decodeURIComponent(target.split("#")[0]);
      assert.equal(existsSync(resolve(repository, dirname(path), local)), true, `${path} has broken link ${target}`);
      links += 1;
    }
  }
  assert.ok(links >= 20, "expected repository-local Markdown links");

  const metadata = read("skills/sgad-workflow/agents/openai.yaml");
  assert.match(metadata, /display_name:\s*"SGAD Workflow"/);
  assert.match(metadata, /default_prompt:[^\n]*\$sgad-workflow/);
});

test("AC-REPO-007 · website canonical values and assets are local and centralized", () => {
  const documents = [read("website/index.html"), read("website/sgad/index.html")].join("\n");
  assert.doesNotMatch(documents, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(read("website/src/site.ts"), /github\.com\/coryfail\/SleepyHollow/);
  assert.match(read("website/src/site.ts"), /--skill sgad-workflow/);

  for (const path of [
    "website/src/components/SiteHeader.tsx",
    "website/src/pages/sleepy-hollow/SleepyHollowPage.tsx",
    "website/src/pages/sgad/SgadPage.tsx",
  ]) {
    assert.match(read(path), /from ["'](?:\.\.\/)*site["']/, `${path} must use shared site values`);
    assert.doesNotMatch(read(path), /const repositoryUrl|github\.com\/coryfail\/SleepyHollow/);
  }
});

test("AC-REPO-008 AC-REPO-009 · browser and Pages verification use the canonical gate", () => {
  const playwright = read("website/playwright.config.ts");
  for (const name of ["chromium", "firefox", "webkit"]) {
    assert.match(playwright, new RegExp(`name:\\s*["']${name}["']`));
  }

  const workflow = read(".github/workflows/website-pages.yml");
  for (const path of ["website/**", "docs/sgad/**", "skills/sgad-workflow/**", "requirements.md", "requirements/**", "models/**", "cli/**", "core/**"]) {
    assert.match(workflow, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(workflow, /run:\s*npm run verify/);
  assert.match(workflow, /if:\s*github\.event_name == 'push'/);
});

test("AC-REPO-010 · draft product behavior remains unchanged", () => {
  const componentPaths = requirementPaths().filter((path) => /^(?:cli|core|skills\/sleepy-hollow)\//.test(path));
  for (const path of componentPaths) {
    const prior = execFileSync("git", ["show", `HEAD:${path}`], { cwd: repository, encoding: "utf8" });
    const current = read(path);
    assert.equal(section(current, "Acceptance criteria"), section(prior, "Acceptance criteria"), `${path} criteria changed`);
    const previousMetadata = frontmatter(prior, path);
    const currentMetadata = frontmatter(current, path);
    assert.deepEqual(currentMetadata.depends_on, previousMetadata.depends_on, `${path} dependencies changed`);
    assert.deepEqual(currentMetadata.open_decisions ?? [], previousMetadata.open_decisions ?? [], `${path} decisions changed`);
    assert.equal(currentMetadata.status, "draft", `${path} gained implementation authority`);
  }
});

test("AC-REPO-012 · generated and ignored output does not enter the repository", () => {
  for (const path of repositoryFiles()) {
    assert.equal(statSync(resolve(repository, path)).isFile(), true, `${path} is not a file`);
    assert.doesNotMatch(path, /(?:^|\/)(?:dist|test-results|node_modules)\//);
    assert.doesNotMatch(path, /\.tsbuildinfo$/);
  }
});
