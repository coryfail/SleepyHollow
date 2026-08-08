import { release } from "./release.ts";
import type { ReleaseRequest, ReleaseResult } from "./types.ts";

export * from "./types.ts";

export function gateRelease(request: ReleaseRequest): ReleaseResult {
  return release(request);
}
