/**
 * Governed checks for `framework-documentation` (AC-FWDOC-001 … AC-FWDOC-008).
 *
 * These read the repository's own files rather than a built page. The guide set
 * is prose, and what it must contain is a governance question, not a rendering
 * one — `website-docs-section` already owns how these files are published.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, "../..");
const read = (path) => readFileSync(resolve(repository, path), "utf8");

const SKILL_INSTALL = "npx skills add coryfail/SleepyHollow --skill sleepy-hollow";

/** Every published file, governance included — what AC-FWDOC-007 must cover. */
const frameworkGuides = () =>
  readdirSync(resolve(repository, "docs/framework"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""))
    .sort();

/**
 * Reader-facing prose only.
 *
 * `requirements.md` states what the guides must say, in nearly the words they
 * must say it. Including it here would let this component's own governance
 * satisfy the checks that govern it, which is a green light for an unwritten
 * guide. Content criteria read the guides; AC-FWDOC-007 reads everything.
 */
const guideProse = () =>
  frameworkGuides()
    .filter((slug) => slug !== "requirements")
    .map((slug) => read(`docs/framework/${slug}.md`))
    .join("\n");

test("AC-FWDOC-001 · the guide set gives the skill install command and says what the skill does", () => {
  const prose = guideProse();
  assert.ok(
    prose.includes(SKILL_INSTALL),
    `no framework guide contains the install command: ${SKILL_INSTALL}`,
  );

  const getting = read("docs/framework/getting-started.md");
  assert.ok(
    getting.includes(SKILL_INSTALL),
    "getting-started.md must carry the install command, since it is the onboarding guide",
  );
  // Naming the command without saying what it installs is not documentation.
  assert.match(
    getting,
    /skill[\s\S]{0,400}(?:plan|requirement|test|verif)/i,
    "getting-started.md must describe what the skill does near the install command",
  );
});

test("AC-FWDOC-002 · the guide set states the framework verifies without the skill", () => {
  const prose = guideProse();
  assert.match(
    prose,
    /(?:without|independently of|does not require)[\s\S]{0,120}skill|skill[\s\S]{0,120}(?:is not required|optional)/i,
    "the guides must state that the framework verifies independently of the skill",
  );
});

test("AC-FWDOC-003 · the requirement format is documented for a reader without the skill", () => {
  const guide = read("docs/framework/writing-requirements.md");

  for (const field of ["id", "status", "schema"]) {
    assert.match(
      guide,
      new RegExp(`\\b${field}\\b`),
      `writing-requirements.md must document the ${field} frontmatter field`,
    );
  }
  assert.match(guide, /## Governance record/, "must document the reserved governance boundary");
  assert.match(guide, /AC-[A-Z0-9-]+-\d{3}/, "must show acceptance-criterion identity");
  assert.match(
    guide,
    /requirements\/application\.md/,
    "must document where an application requirement lives",
  );
  assert.match(
    guide,
    /requirements\.md/,
    "must document component requirement placement",
  );
});

test("AC-FWDOC-004 · the guide and the installed skill's reference agree", () => {
  const guide = read("docs/framework/writing-requirements.md");
  const reference = read("skills/sleepy-hollow/references/requirement-format.md");

  // Placement and boundary are the two facts an agent and a human must not
  // learn differently, because both produce files the same verifier reads.
  for (const shared of ["requirements/application.md", "## Governance record"]) {
    assert.ok(
      guide.includes(shared) && reference.includes(shared),
      `both documents must state ${shared}`,
    );
  }

  // Exactly one canonical digest algorithm exists. Neither document may restate
  // it as a competing procedure; both may cite it.
  const restatesAlgorithm = (text) =>
    /omitting the single top-level frontmatter `?status:?`? line/i.test(text)
    && /\bSHA-?256\b/i.test(text);
  assert.equal(
    restatesAlgorithm(guide),
    false,
    "writing-requirements.md must cite the canonical digest algorithm, not restate it",
  );
  assert.match(
    guide,
    /requirements\.md|verification\.md/,
    "writing-requirements.md must point at the canonical digest definition",
  );
});

test("AC-FWDOC-005 · every installable artifact a guide names resolves", () => {
  const prose = guideProse();
  const skills = readdirSync(resolve(repository, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const [, name] of prose.matchAll(/--skill ([a-z0-9-]+)/g)) {
    assert.ok(skills.includes(name), `guides name skill '${name}', which has no directory under skills/`);
  }

  const { name } = JSON.parse(read("deno.json"));
  for (const [, specifier] of prose.matchAll(/jsr:(@[a-z0-9-]+\/[a-z0-9-]+)/g)) {
    assert.equal(specifier, name, `guides install '${specifier}' but deno.json publishes '${name}'`);
  }
});

test("AC-FWDOC-006 · every surface states the install command identically", () => {
  const surfaces = {
    "README.md": read("README.md"),
    "docs/framework": guideProse(),
    "website/src/site.ts": read("website/src/site.ts"),
  };
  for (const [surface, text] of Object.entries(surfaces)) {
    assert.ok(
      text.includes(SKILL_INSTALL),
      `${surface} must state the install command exactly: ${SKILL_INSTALL}`,
    );
  }
});

test("AC-FWDOC-007 · every framework guide has a reading-order position and a summary", () => {
  const generator = read("website/scripts/generate-docs.mjs");
  const order = generator.match(/framework: \[([\s\S]*?)\]/)?.[1] ?? "";
  const listed = [...order.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

  for (const slug of frameworkGuides()) {
    assert.ok(listed.includes(slug), `docs/framework/${slug}.md has no READING_ORDER position`);
    assert.match(
      generator,
      new RegExp(`"framework/${slug}":\\s*"[^"]+"`),
      `docs/framework/${slug}.md has no one-line summary`,
    );
  }
});

test("AC-FWDOC-008 · getting-started introduces identifiers before it depends on them", () => {
  const guide = read("docs/framework/getting-started.md");

  // The guide hands the reader a requirementId and a criterion ID inside a test
  // example. Whatever position those appear in, the guide must have already
  // explained where an approved requirement comes from.
  const dependency = guide.search(/requirementId:/);
  assert.notEqual(dependency, -1, "expected the criterionTest example to remain in the guide");

  const introduction = guide.search(/writing-requirements|npx skills add/);
  assert.notEqual(
    introduction,
    -1,
    "getting-started.md must introduce how an approved requirement is produced",
  );
  assert.ok(
    introduction < dependency,
    "getting-started.md depends on a requirement ID before telling the reader how to create one",
  );
});
