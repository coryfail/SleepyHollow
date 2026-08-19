import { test } from "vitest";

// The former nested-test helper has no exact Vitest equivalent. Executing the
// named body preserves its assertions while the suite is split into ordinary
// Vitest tests.
const step = async (_name: string, body: () => unknown): Promise<unknown> => await body();

(test as typeof test & { step?: typeof step }).step = step;
Object.defineProperty(Function.prototype, "step", {
  configurable: true,
  value: step,
});
