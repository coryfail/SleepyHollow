/**
 * Typed access to the generated RFC 9457 problem reference.
 * The content is built from the canonical Markdown under docs/problems/.
 */
import { problems } from "../generated/problems-content.js";

export type { ProblemType } from "../generated/problems-content.js";
export { problems };

export function problemForRoute(route: string) {
  return problems.find((problem) => problem.route === route);
}
