import type { NormalizedRoute } from "../routing/mod.ts";
import type { CaptureRequestLocation, CaptureSession } from "./types.ts";

const locations: readonly CaptureRequestLocation[] = [
  "params",
  "query",
  "headers",
  "body",
];

export function route(
  target: NormalizedRoute,
  active: CaptureSession,
): NormalizedRoute {
  active.declareRoute({ method: target.method, path: target.path });
  const handler = target.operation.handler;
  return {
    ...target,
    operation: {
      ...target.operation,
      handler: async (context) => {
        const read = new Set<CaptureRequestLocation>();
        const observed = new Proxy(
          context as unknown as Record<string, unknown>,
          {
            get(subject, property, receiver) {
              if (
                typeof property === "string" &&
                (locations as readonly string[]).includes(property)
              ) {
                read.add(property as CaptureRequestLocation);
              }
              return Reflect.get(subject, property, receiver);
            },
          },
        );
        const response = await handler(
          observed as unknown as Parameters<typeof handler>[0],
        );
        active.recordRequest({
          method: target.method,
          path: target.path,
          readLocations: locations.filter((location) => read.has(location)),
          responseStatus: response.status,
        });
        return response;
      },
    },
  };
}
