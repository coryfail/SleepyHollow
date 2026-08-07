import type {
  MemoryRateLimiterOptions,
  RateLimiter,
  RateLimitInput,
} from "./types.ts";

const RATE_KEY = /^[A-Za-z0-9._:-]{1,256}$/;

export function createMemoryRateLimiter(
  options: MemoryRateLimiterOptions,
): RateLimiter {
  if (!Number.isSafeInteger(options.maxKeys) || options.maxKeys <= 0) {
    throw new TypeError("maxKeys must be a positive integer");
  }

  const clock = options.clock ?? Date.now;
  const windows = new Map<string, { count: number; resetAt: number }>();

  function validate(input: RateLimitInput): void {
    if (!input.policy || !RATE_KEY.test(input.key)) {
      throw new TypeError("policy and a valid bounded key are required");
    }
    if (!Number.isSafeInteger(input.limit) || input.limit <= 0) {
      throw new TypeError("limit must be a positive integer");
    }
    if (!Number.isSafeInteger(input.windowMs) || input.windowMs <= 0) {
      throw new TypeError("windowMs must be a positive integer");
    }
  }

  return {
    scope: "process",
    async consume(input) {
      await Promise.resolve();
      validate(input);
      const now = clock();
      if (!Number.isFinite(now)) {
        throw new TypeError("clock must return a finite value");
      }

      for (const [key, window] of windows) {
        if (window.resetAt <= now) windows.delete(key);
      }

      const storageKey = `${input.policy}\u0000${input.key}`;
      let window = windows.get(storageKey);
      if (!window) {
        if (windows.size >= options.maxKeys) {
          throw new Error("SH_RATE_LIMIT_CAPACITY_EXHAUSTED");
        }
        window = { count: 0, resetAt: now + input.windowMs };
        windows.set(storageKey, window);
      }

      window.count += 1;
      return {
        allowed: window.count <= input.limit,
        remaining: Math.max(0, input.limit - window.count),
        resetAt: window.resetAt,
      };
    },
  };
}
