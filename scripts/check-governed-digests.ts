/**
 * Verifies that every named requirement's recorded approval binds its exact
 * governed content, reading the staged blob rather than the working tree so the
 * check matches what a commit would actually contain.
 *
 * This exists because governed Markdown has twice been rewritten after
 * approval by a formatting command, silently detaching an exact-content
 * approval from the content it claims to authorize. `deno.json` excludes these
 * files from `deno fmt`, which prevents that specific cause; this check is
 * cause-independent and catches any edit that moves governed bytes.
 *
 * The digest algorithm is the canonical one defined in the SGAD documentation
 * and implemented in `skills/sleepy-hollow/planning/parser.ts` and
 * `website/tests/repository-consistency.test.mjs`: the exact UTF-8 bytes before
 * the `## Governance record` heading, omitting the single top-level frontmatter
 * `status:` line and its line ending. Keep the three in agreement.
 */
import { createHash } from "node:crypto";

interface Failure {
  readonly path: string;
  readonly reason: string;
}

async function git(args: string[]): Promise<string | null> {
  const output = await new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "null",
  }).output();
  if (!output.success) return null;
  return new TextDecoder().decode(output.stdout);
}

/** Staged blob when gating a commit, otherwise what is actually on disk. */
async function contents(
  path: string,
  fromIndex: boolean,
): Promise<string | null> {
  if (fromIndex) return await git(["show", `:${path}`]);
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
}

async function tracked(): Promise<string[]> {
  const listed = await git([
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
  ]) ?? "";
  return listed.split("\n").filter((path) => path.endsWith(".req.md"));
}

function governedDigest(source: string): string | null {
  const markers = [...source.matchAll(/^## Governance record\r?$/gm)];
  if (markers.length !== 1) return null;
  const governed = source.slice(0, markers[0].index);
  const frontmatter = governed.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)?.[0];
  if (!frontmatter) return null;
  const normalized = frontmatter.replace(/^status:[^\r\n]*(?:\r?\n)/m, "");
  if (normalized === frontmatter) return null;
  return createHash("sha256")
    .update(normalized + governed.slice(frontmatter.length))
    .digest("hex");
}

const fromIndex = Deno.args.includes("--staged");
const named = Deno.args.filter((argument) => !argument.startsWith("--"));
const paths = named.length > 0 ? named : await tracked();

const failures: Failure[] = [];
let checked = 0;

for (const path of paths) {
  const source = await contents(path, fromIndex);
  if (source === null) continue;

  const status = /^status:\s*(\S+)/m.exec(source)?.[1] ?? "";
  if (status !== "approved" && status !== "verified") continue;

  const digest = governedDigest(source);
  if (digest === null) {
    failures.push({
      path,
      reason:
        "governed content has no single governance boundary, frontmatter, or status projection",
    });
    continue;
  }

  checked += 1;
  const record = source.slice(source.indexOf("## Governance record"));
  if (!record.includes(`sha256:${digest}`)) {
    failures.push({
      path,
      reason:
        `status is '${status}' but no recorded digest binds the current governed content\n` +
        `    current governed-content digest: sha256:${digest}`,
    });
  }
}

if (failures.length > 0) {
  console.error(
    `\nGoverned content changed without a matching approval in ${failures.length} file(s):\n`,
  );
  for (const failure of failures) {
    console.error(`  ${failure.path}\n    ${failure.reason}\n`);
  }
  console.error(
    "An exact-content approval authorizes exact bytes. Either restore the\n" +
      "governed content, or record a new approval for the digest above and set\n" +
      "status to draft until it is granted.\n",
  );
  Deno.exit(1);
}

if (checked > 0) {
  console.log(`Governed digests bind for ${checked} requirement(s).`);
}
