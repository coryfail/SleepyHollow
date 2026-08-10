/**
 * Renders the repository's canonical guides into the website build.
 *
 * Guide prose has one source of truth: the Markdown files under `docs/`. This
 * script reads those exact files and emits, per guide, a static entry document
 * and a rendered HTML fragment. Nothing under `website/src/` holds a copy, so a
 * published page cannot drift from the file it documents (AC-DOCS-003).
 *
 * Run through `npm run docs:build`, which every other website script depends on.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const here = dirname(fileURLToPath(import.meta.url));
const website = resolve(here, "..");
const repository = resolve(website, "..");

const REPOSITORY_URL = "https://github.com/coryfail/SleepyHollow";
const BLOB = `${REPOSITORY_URL}/blob/main`;
const TREE = `${REPOSITORY_URL}/tree/main`;

/** Reading order, not alphabetical order. A missing entry fails the build. */
const READING_ORDER = {
  framework: [
    "getting-started",
    "writing-requirements",
    "routing",
    "data",
    "security",
    "verification",
    "deployment",
    "cli",
    "requirements",
  ],
  sgad: [
    "README",
    "principles",
    "workflow",
    "artifacts-and-lifecycle",
    "verification-model",
    "conformance",
    "adoption-guide",
    "requirements",
  ],
};

/**
 * One-line descriptions for the index. This is website framing copy, which the
 * approved requirement permits; guide bodies are never edited here.
 */
const SUMMARIES = {
  "framework/getting-started": "Install the CLI, create a project, write your first endpoint, and verify it.",
  "framework/writing-requirements": "Authoring and approving the requirements that hollow check verifies against, by hand.",
  "framework/routing": "How the file tree becomes your URL surface, and how methods and parameters are declared.",
  "framework/data": "Typed Deno KV resources, secondary indexes, and why every query carries a bound.",
  "framework/security": "Per-route authentication modes and the one project module that decides who gets in.",
  "framework/verification": "What the framework records while your tests run, and what hollow check refuses to certify.",
  "framework/deployment": "Shipping a verified revision to your own Deno Deploy account, with your own token.",
  "framework/cli": "Every hollow command, its options, and what it reports.",
  "framework/requirements": "The framework documentation set's own governed requirement.",
  "sgad/README": "What Specification-Governed Agentic Development is, and the planes it keeps apart.",
  "sgad/principles": "The principles governing how authority, agent autonomy, and evidence interact.",
  "sgad/workflow": "The phases that turn uncertain intent into bounded authority and independent evidence.",
  "sgad/artifacts-and-lifecycle": "The embedded governance record: what it holds, and when each part is written.",
  "sgad/verification-model": "Validation asks whether the intent is right; verification asks whether the artifacts match it.",
  "sgad/conformance": "The minimum bar for claiming SGAD conformance, plus optional capability profiles.",
  "sgad/adoption-guide": "Introducing SGAD to an existing project, one governed component at a time.",
  "sgad/requirements": "The methodology's own governed requirement — SGAD specified in its own terms.",
};

/**
 * Shorter labels for the sidebar where a guide's own title is too long to sit
 * in a 16rem column. The page still shows the canonical title.
 */
const NAV_TITLES = {
  "framework/writing-requirements": "Writing requirements",
  "framework/requirements": "Documentation requirement",
  "sgad/README": "SGAD overview",
  "sgad/artifacts-and-lifecycle": "Artifacts and lifecycle",
  "sgad/verification-model": "Verification model",
  "sgad/principles": "Principles",
  "sgad/workflow": "Workflow",
  "sgad/conformance": "Conformance",
  "sgad/adoption-guide": "Adopting SGAD",
  "sgad/requirements": "Methodology requirement",
};

export const GROUPS = [
  {
    id: "framework",
    title: "Framework",
    description:
      "Building an API with Sleepy Hollow: routes, data, security, verification, and deployment.",
  },
  {
    id: "sgad",
    title: "SGAD methodology",
    description:
      "The framework-independent method behind the framework. Useful on its own, with any language or toolchain.",
  },
];

const sourceDirectory = (group) => resolve(repository, group === "framework" ? "docs/framework" : "docs/sgad");

const routeFor = (group, slug) =>
  group === "framework" ? `/docs/${slug}/` : slug === "README" ? "/docs/sgad/" : `/docs/sgad/${slug}/`;

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[`*_[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const stripFrontmatter = (markdown) => markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

/**
 * Plans every guide the site will publish.
 *
 * Discovery is from disk so an added guide is published without editing website
 * source; the curated order is checked against disk so a renamed or deleted
 * guide fails the build rather than quietly shortening the site (AC-SITE-015).
 */
export function planGuides(order = READING_ORDER) {
  const planned = [];
  for (const group of ["framework", "sgad"]) {
    const directory = sourceDirectory(group);
    const present = readdirSync(directory)
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.replace(/\.md$/, ""));

    const curated = order[group] ?? [];
    for (const slug of curated) {
      if (!present.includes(slug)) {
        throw new Error(
          `docs/${group === "framework" ? "framework" : "sgad"}/${slug}.md is listed in the reading ` +
            `order but does not exist. Update READING_ORDER in scripts/generate-docs.mjs, or restore the file.`,
        );
      }
    }

    const extras = present.filter((slug) => !curated.includes(slug)).sort();
    for (const slug of [...curated, ...extras]) {
      planned.push({
        group,
        slug,
        sourcePath: posix.join(group === "framework" ? "docs/framework" : "docs/sgad", `${slug}.md`),
        route: routeFor(group, slug),
        summary: SUMMARIES[`${group}/${slug}`] ?? "",
        navTitle: NAV_TITLES[`${group}/${slug}`] ?? null,
      });
    }
  }

  const routes = new Set();
  for (const guide of planned) {
    if (routes.has(guide.route)) throw new Error(`two guides claim the route ${guide.route}`);
    routes.add(guide.route);
  }
  return planned;
}

/** Resolves a Markdown link to a site route, or to the file on the repository host. */
function resolveLink(href, guide, routesBySource) {
  if (/^(?:https?:|mailto:|#)/.test(href)) return href;

  const [target, anchor] = href.split("#");
  if (!target) return href;

  const fromRepository = posix.normalize(posix.join(posix.dirname(guide.sourcePath), target));
  const route = routesBySource.get(fromRepository);
  if (route) return anchor ? `${route}#${anchor}` : route;

  const base = fromRepository.endsWith("/") ? TREE : BLOB;
  const clean = fromRepository.replace(/\/$/, "");
  return anchor ? `${base}/${clean}#${anchor}` : `${base}/${clean}`;
}

function renderGuide(guide, routesBySource) {
  const markdown = stripFrontmatter(readFileSync(resolve(repository, guide.sourcePath), "utf8"));
  const tokens = marked.lexer(markdown);

  const titleIndex = tokens.findIndex((token) => token.type === "heading" && token.depth === 1);
  if (titleIndex < 0) throw new Error(`${guide.sourcePath} has no level-one heading`);
  const title = tokens[titleIndex].text.trim();
  tokens.splice(titleIndex, 1);

  const seen = new Map();
  const renderer = {
    heading({ tokens: inline, depth }) {
      const text = this.parser.parseInline(inline);
      const raw = inline.map((token) => token.raw ?? "").join("");
      let id = slugify(raw);
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`;
      const level = Math.min(depth, 6);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    },
    code({ text, lang }) {
      const language = (lang ?? "").split(/\s+/)[0];
      const className = language ? ` class="language-${escapeHtml(language)}"` : "";
      const label = language ? `<span class="code-block__lang">${escapeHtml(language)}</span>` : "";
      return `<div class="code-block" tabindex="0" role="region" aria-label="${
        language ? `${escapeHtml(language)} code example` : "Code example"
      }">${label}<pre><code${className}>${escapeHtml(text)}</code></pre></div>\n`;
    },
    table(token) {
      const rendered = marked.Renderer.prototype.table.call(this, token);
      return `<div class="table-scroll" tabindex="0" role="region" aria-label="Table">${rendered}</div>\n`;
    },
    link({ href, title: linkTitle, tokens: inline }) {
      const text = this.parser.parseInline(inline);
      const resolved = resolveLink(href, guide, routesBySource);
      const attributes = linkTitle ? ` title="${escapeHtml(linkTitle)}"` : "";
      const external = /^https?:/.test(resolved)
        ? ' rel="noreferrer"'
        : "";
      return `<a href="${escapeHtml(resolved)}"${attributes}${external}>${text}</a>`;
    },
  };

  marked.use({ renderer, async: false, gfm: true });
  const html = marked.parser(tokens);

  const headings = [];
  for (const match of html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)) {
    headings.push({ id: match[1], text: match[2].replace(/<[^>]+>/g, "").trim() });
  }

  return { ...guide, title, html, headings };
}

const documentFor = (guide, guides) => {
  const navigation = guides
    .map((entry) =>
      `<li><a href="${entry.route}"${entry.route === guide.route ? ' aria-current="page"' : ""}>${
        escapeHtml(entry.navTitle ?? entry.title)
      }</a></li>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${escapeHtml(guide.summary || `${guide.title} — Sleepy Hollow documentation.`)}" />
    <meta property="og:title" content="${escapeHtml(guide.title)} · Sleepy Hollow documentation" />
    <meta property="og:description" content="${escapeHtml(guide.summary || `${guide.title} — Sleepy Hollow documentation.`)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://sleepyhollow.io${guide.route}" />
    <link rel="canonical" href="https://sleepyhollow.io${guide.route}" />
    <title>${escapeHtml(guide.title)} · Sleepy Hollow documentation</title>
  </head>
  <body data-page="docs" data-doc="${guide.route}">
    <div id="root"></div>
    <noscript>
      <nav aria-label="Documentation"><ul>${navigation}</ul></nav>
      <main>
        <h1>${escapeHtml(guide.title)}</h1>
        ${guide.html}
        <a href="/docs/">All documentation</a>
        <a href="/">Sleepy Hollow</a>
      </main>
    </noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
};

const indexDocument = (guides) => {
  const groups = GROUPS.map((group) => {
    const items = guides
      .filter((guide) => guide.group === group.id)
      .map((guide) => `<li><a href="${guide.route}">${escapeHtml(guide.title)}</a> — ${escapeHtml(guide.summary)}</li>`)
      .join("");
    return `<section><h2>${escapeHtml(group.title)}</h2><p>${escapeHtml(group.description)}</p><ul>${items}</ul></section>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta
      name="description"
      content="Sleepy Hollow documentation: routing, data, security, verification, deployment, and the SGAD methodology."
    />
    <meta property="og:title" content="Documentation · Sleepy Hollow" />
    <meta property="og:description" content="Guides for building and verifying an API with Sleepy Hollow." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://sleepyhollow.io/docs/" />
    <link rel="canonical" href="https://sleepyhollow.io/docs/" />
    <title>Documentation · Sleepy Hollow</title>
  </head>
  <body data-page="docs" data-doc="/docs/">
    <div id="root"></div>
    <noscript>
      <main>
        <h1>Documentation</h1>
        ${groups}
        <a href="/api/">API reference</a>
        <a href="/">Sleepy Hollow</a>
      </main>
    </noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
};

const contentModule = (guides) => {
  const payload = guides.map((guide) => ({
    group: guide.group,
    slug: guide.slug,
    route: guide.route,
    sourcePath: guide.sourcePath,
    title: guide.title,
    navTitle: guide.navTitle ?? guide.title,
    summary: guide.summary,
    headings: guide.headings,
    html: guide.html,
    next: guide.next,
  }));

  return `// Generated by scripts/generate-docs.mjs. Do not edit; edit the Markdown under docs/.\n` +
    `export const groups = ${JSON.stringify(GROUPS, null, 2)};\n\n` +
    `export const guides = ${JSON.stringify(payload, null, 2)};\n`;
};

const typeDeclaration = () =>
  `// Generated by scripts/generate-docs.mjs.
export interface DocsGroup {
  readonly id: "framework" | "sgad";
  readonly title: string;
  readonly description: string;
}

export interface DocsHeading {
  readonly id: string;
  readonly text: string;
}

export interface Guide {
  readonly group: "framework" | "sgad";
  readonly slug: string;
  readonly route: string;
  readonly sourcePath: string;
  readonly title: string;
  readonly navTitle: string;
  readonly summary: string;
  readonly headings: readonly DocsHeading[];
  readonly html: string;
  readonly next: { readonly route: string; readonly title: string } | null;
}

export declare const groups: readonly DocsGroup[];
export declare const guides: readonly Guide[];
`;

export function build() {
  const planned = planGuides();
  const routesBySource = new Map(planned.map((guide) => [guide.sourcePath, guide.route]));
  const rendered = planned.map((guide) => renderGuide(guide, routesBySource));

  for (const [index, guide] of rendered.entries()) {
    const following = rendered[index + 1];
    guide.next = following ? { route: following.route, title: following.title } : null;
  }

  const entriesRoot = resolve(website, "docs");
  const generatedRoot = resolve(website, "generated");
  rmSync(entriesRoot, { recursive: true, force: true });
  mkdirSync(entriesRoot, { recursive: true });
  mkdirSync(generatedRoot, { recursive: true });

  writeFileSync(join(entriesRoot, "index.html"), indexDocument(rendered), "utf8");
  for (const guide of rendered) {
    const directory = resolve(website, `docs${guide.route.replace(/^\/docs/, "")}`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "index.html"), documentFor(guide, rendered), "utf8");
  }

  writeFileSync(join(generatedRoot, "docs-content.js"), contentModule(rendered), "utf8");
  writeFileSync(join(generatedRoot, "docs-content.d.ts"), typeDeclaration(), "utf8");

  return rendered;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const guides = build();
  const entries = guides.length + 1;
  console.log(`Generated ${guides.length} guide(s) and ${entries} entry document(s) from docs/.`);
}
