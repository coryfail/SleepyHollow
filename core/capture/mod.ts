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

/**
 * Opens a recording of what a verification run does.
 *
 * @param options What is producing the recording, and of which revision.
 * @returns An open session; snapshot it with `artifact()`.
 */
export function createCaptureSession(
  options: CaptureSessionOptions,
): CaptureSession {
  return session(options);
}

/**
 * Wraps a repository so its reads and writes are recorded.
 *
 * @param target The repository to observe.
 * @param active The session to record into.
 * @returns A stand-in with the same interface as the target.
 */
export function captureRepository<Repository extends object>(
  target: Repository,
  active: CaptureSession,
): Repository {
  return repository(target, active);
}

/**
 * Wraps a route so the requests it answers are recorded.
 *
 * The route is also declared on the session, so never exercising it is
 * reported rather than passing unnoticed.
 *
 * @param target The route to observe.
 * @param active The session to record into.
 * @returns A route with the same behaviour, under observation.
 */
export function captureRoute(
  target: NormalizedRoute,
  active: CaptureSession,
): NormalizedRoute {
  return route(target, active);
}

/**
 * Writes a session's artifact to disk, where `hollow check` can read it.
 *
 * @param active The session to snapshot.
 * @param path Where to write the artifact.
 */
export function persistCaptureSession(
  active: CaptureSession,
  path: string,
): Promise<void> {
  return persist(active, path);
}

/**
 * Binds a criterion test to a session, so whatever it exercises is attributed
 * to the criterion it verifies.
 *
 * @param spec The criterion test to bind.
 * @param active The session to record into.
 * @returns The same specification, wrapped to attribute its observations.
 */
export function captureCriterionTest(
  spec: CriterionTestSpec,
  active: CaptureSession,
): CriterionTestSpec {
  return bind(spec, active);
}
