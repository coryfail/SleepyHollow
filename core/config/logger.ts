import { redactSecurityData } from "../security/mod.ts";
import {
  type JsonLogger,
  type JsonLoggerOptions,
  type LogLevel,
  RUNTIME_MODES,
} from "./types.ts";

const EVENT = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const RESERVED = new Set(["level", "timestamp", "event", "mode", "requestId"]);

function customRedaction(
  value: unknown,
  sensitive: ReadonlySet<string>,
): unknown {
  const active = new WeakSet<object>();
  function visit(current: unknown): unknown {
    if (current === null || typeof current !== "object") return current;
    if (
      current instanceof Request || current instanceof Headers ||
      current instanceof Response || current instanceof Error ||
      current instanceof Date
    ) return current;
    if (active.has(current)) return "[Circular]";
    active.add(current);
    const result = Array.isArray(current)
      ? current.map(visit)
      : Object.fromEntries(
        Object.entries(current).map(([key, item]) => [
          key,
          sensitive.has(key) ? "[REDACTED]" : visit(item),
        ]),
      );
    active.delete(current);
    return result;
  }
  return redactSecurityData(visit(value));
}

function safeContext(
  value: unknown,
  sensitive: ReadonlySet<string>,
): Record<string, unknown> {
  const redacted = customRedaction(value, sensitive);
  if (!redacted || typeof redacted !== "object" || Array.isArray(redacted)) {
    return value === undefined ? {} : { context: redacted };
  }
  return Object.fromEntries(
    Object.entries(redacted).filter(([key]) => !RESERVED.has(key)),
  );
}

/**
 * Builds a logger that writes one JSON object per line.
 *
 * Fields named as sensitive are redacted before serialization, so a secret
 * passed in context never reaches the sink.
 *
 * @param options The mode, the sink, and which fields to redact.
 * @returns A logger, derivable per request with `withRequest`.
 */
export function createJsonLogger(options: JsonLoggerOptions): JsonLogger {
  if (!RUNTIME_MODES.includes(options.mode)) {
    throw new TypeError("Logger mode must be explicit");
  }
  if (typeof options.sink !== "function") {
    throw new TypeError("Logger sink is required");
  }
  const sensitive = new Set(options.sensitiveFields ?? []);
  if ([...sensitive].some((field) => !field)) {
    throw new TypeError("Sensitive field names must be non-empty");
  }
  const clock = options.clock ?? (() => new Date());

  function build(requestId?: string): JsonLogger {
    function write(level: LogLevel, event: string, context?: unknown): void {
      if (!EVENT.test(event)) throw new TypeError("Log event name is invalid");
      const instant = clock();
      if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
        throw new TypeError("Logger clock returned an invalid date");
      }
      options.sink(JSON.stringify({
        ...safeContext(context, sensitive),
        level,
        timestamp: instant.toISOString(),
        event,
        mode: options.mode,
        ...(requestId ? { requestId } : {}),
      }));
    }

    return Object.freeze({
      debug: (event: string, context?: unknown) =>
        write("debug", event, context),
      info: (event: string, context?: unknown) => write("info", event, context),
      warn: (event: string, context?: unknown) => write("warn", event, context),
      error: (event: string, context?: unknown) =>
        write("error", event, context),
      withRequest(nextRequestId: string) {
        if (!REQUEST_ID.test(nextRequestId)) {
          throw new TypeError("Request ID is invalid");
        }
        return build(nextRequestId);
      },
    });
  }

  return build();
}
