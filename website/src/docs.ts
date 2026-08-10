/**
 * Typed access to the guides generated from the canonical Markdown under
 * `docs/`. The content module is build output; see `scripts/generate-docs.mjs`.
 */
import { groups, guides } from "../generated/docs-content.js";

export type { DocsGroup, Guide } from "../generated/docs-content.js";
export { groups, guides };

export function guideForRoute(route: string) {
  return guides.find((guide) => guide.route === route);
}

export function guidesInGroup(id: string) {
  return guides.filter((guide) => guide.group === id);
}
