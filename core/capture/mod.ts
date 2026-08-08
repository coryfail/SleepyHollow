import type { NormalizedRoute } from "../routing/mod.ts";
import { repository } from "./repository.ts";
import { route } from "./route.ts";
import { session } from "./session.ts";
import type { CaptureSession, CaptureSessionOptions } from "./types.ts";

export * from "./types.ts";

export function createCaptureSession(
  options: CaptureSessionOptions,
): CaptureSession {
  return session(options);
}

export function captureRepository<Repository extends object>(
  target: Repository,
  active: CaptureSession,
): Repository {
  return repository(target, active);
}

export function captureRoute(
  target: NormalizedRoute,
  active: CaptureSession,
): NormalizedRoute {
  return route(target, active);
}
