/**
 * Capture: recording what a run actually did, as evidence.
 *
 * A capture session wraps repositories, routes, and criterion tests to record
 * the requests, responses, and storage effects a verification run produced.
 * The persisted session is the evidence `hollow check` reads, so a claim that
 * a criterion passes is backed by an observation rather than an assertion.
 *
 * @module
 */
import type { NormalizedRoute } from "../routing/mod.ts";
import { repository } from "./repository.ts";
import { route } from "./route.ts";
import { bind, persist, session } from "./session.ts";
import type { CriterionTestSpec } from "../testing/mod.ts";
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

export function persistCaptureSession(
  active: CaptureSession,
  path: string,
): Promise<void> {
  return persist(active, path);
}

export function captureCriterionTest(
  spec: CriterionTestSpec,
  active: CaptureSession,
): CriterionTestSpec {
  return bind(spec, active);
}
