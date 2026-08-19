/**
 * Adds a route back to the site from the generated API reference.
 *
 * The Node API documentation generator produces a self-contained site with no
 * knowledge of the pages that link to it: its wordmark points at its own index
 * and nothing points home. Linking to it from the documentation section would
 * therefore strand every visitor who followed that link.
 *
 * This walks the generated output and inserts one bar at the top of each
 * document. It touches nothing else — the toolchain still owns the reference's
 * markup, layout, and theme. Styles are inline because the generated pages do
 * not load this site's stylesheet.
 *
 * Run through `npm run docs:api`, after the reference is generated.
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../dist/api");

const BAR = `<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;` +
  `padding:0.625rem 1rem;background:oklch(13% 0.018 250);color:oklch(83% 0.012 85);` +
  `font:600 0.875rem/1 'Avenir Next',Avenir,'Segoe UI',Helvetica,Arial,sans-serif;">` +
  `<a href="/" style="color:oklch(95% 0.009 85);text-decoration:none;">Sleepy Hollow</a>` +
  `<span aria-hidden="true" style="opacity:0.5;">·</span>` +
  `<a href="/docs/" style="color:oklch(76% 0.15 58);text-decoration:none;">&#8592; Back to the documentation</a>` +
  `<span style="opacity:0.7;font-weight:400;">Generated API reference</span>` +
  `</div>`;

const MARKER = "data-sleepy-hollow-return";
const BANNER = BAR.replace("<div ", `<div ${MARKER} `);

export function brandGeneratedReference(directory = root) {
  const documents = globSync(resolve(directory, "**/*.html"));
  let updated = 0;

  for (const path of documents) {
    const source = readFileSync(path, "utf8");
    if (source.includes(MARKER)) continue;

    const body = source.match(/<body[^>]*>/);
    if (!body) continue;

    const at = source.indexOf(body[0]) + body[0].length;
    writeFileSync(path, source.slice(0, at) + BANNER + source.slice(at), "utf8");
    updated += 1;
  }

  return { documents: documents.length, updated };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { documents, updated } = brandGeneratedReference();
  console.log(`Linked ${updated} of ${documents} generated reference page(s) back to the site.`);
}
