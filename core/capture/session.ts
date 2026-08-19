import { platform } from "#platform";
import type { CriterionTestSpec } from "../testing/mod.ts";
import type {
  CaptureArtifact,
  CaptureAttribution,
  CapturedDataOperation,
  CapturedRequest,
  CaptureRouteIdentity,
  CaptureSession,
  CaptureSessionOptions,
} from "./types.ts";

function routeKey(route: CaptureRouteIdentity): string {
  return `${route.method} ${route.path}`;
}

export function session(options: CaptureSessionOptions): CaptureSession {
  const attributions: CaptureAttribution[] = [];
  const dataOperations: CapturedDataOperation[] = [];
  const requests: CapturedRequest[] = [];
  const declared = new Map<string, CaptureRouteIdentity>();
  const exercised = new Set<string>();
  let sequence = 0;

  const current = (): CaptureAttribution | undefined =>
    attributions[attributions.length - 1];

  return {
    runner: options.runner,
    revision: options.revision,

    enter(attribution) {
      attributions.push(attribution);
    },

    exit() {
      attributions.pop();
    },

    declareRoute(route) {
      declared.set(routeKey(route), {
        method: route.method,
        path: route.path,
      });
    },

    recordDataOperation(record) {
      const attribution = current();
      sequence += 1;
      dataOperations.push({
        sequence,
        ...record,
        ...(attribution ? { attribution } : {}),
      });
    },

    recordRequest(record) {
      const attribution = current();
      sequence += 1;
      exercised.add(routeKey(record));
      requests.push({
        sequence,
        ...record,
        ...(attribution ? { attribution } : {}),
      });
    },

    artifact(): CaptureArtifact {
      const uncaptured = [...declared.entries()]
        .filter(([key]) => !exercised.has(key))
        .map(([, route]) => route)
        .sort((left, right) => routeKey(left).localeCompare(routeKey(right)));
      return {
        schema: "sleepy-hollow-capture/v1",
        runner: options.runner,
        revision: options.revision,
        requests: [...requests].sort((left, right) =>
          left.sequence - right.sequence
        ),
        dataOperations: [...dataOperations].sort((left, right) =>
          left.sequence - right.sequence
        ),
        uncapturedRoutes: uncaptured,
      };
    },
  };
}

export async function persist(
  active: CaptureSession,
  path: string,
): Promise<void> {
  const staging = `${path}.partial`;
  const body = `${JSON.stringify(active.artifact(), null, 2)}\n`;
  try {
    await platform.writeTextFile(staging, body);
  } catch (error) {
    await platform.remove(staging).catch(() => undefined);
    throw error;
  }
  try {
    await platform.rename(staging, path);
  } catch (error) {
    await platform.remove(staging).catch(() => undefined);
    throw error;
  }
}

export function bind(
  spec: CriterionTestSpec,
  active: CaptureSession,
): CriterionTestSpec {
  const attribution = {
    requirementId: spec.requirementId,
    criterionId: spec.criteria[0] ?? "",
  };
  return {
    ...spec,
    fn: async (context) => {
      active.enter(attribution);
      try {
        await (spec.fn as (input: unknown) => unknown)(context);
      } finally {
        active.exit();
      }
    },
  };
}
