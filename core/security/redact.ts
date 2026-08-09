const SECRET_FIELD =
  /^(authorization|proxyauthorization|cookie|setcookie|.*token.*|.*secret.*|.*password.*|.*session.*|.*apikey.*|.*credential.*)$/i;

function normalizedField(value: PropertyKey): string {
  return String(value).replace(/[^a-z0-9]/gi, "");
}

/**
 * Strips credentials and other sensitive fields from a value before it is
 * logged or reported.
 *
 * Traversal is bounded and cycle-safe: it truncates beyond a fixed depth and
 * will not loop on a self-referencing object, so redacting untrusted input
 * cannot hang the process.
 *
 * @param value Any value bound for a log line or a diagnostic.
 * @returns A copy with sensitive fields replaced.
 */
export function redactSecurityData(value: unknown): unknown {
  const active = new WeakSet<object>();

  function visit(current: unknown, depth: number): unknown {
    if (current === null || typeof current !== "object") return current;
    if (depth > 12) return "[Truncated]";
    if (current instanceof Request) {
      const url = new URL(current.url);
      return { kind: "Request", method: current.method, path: url.pathname };
    }
    if (current instanceof Headers) return "[REDACTED_HEADERS]";
    if (current instanceof Response) {
      return { kind: "Response", status: current.status };
    }
    if (current instanceof Error) return { name: current.name };
    if (current instanceof Date) return current.toISOString();
    if (active.has(current)) return "[Circular]";

    active.add(current);
    let result: unknown;
    if (Array.isArray(current)) {
      result = current.map((item) => visit(item, depth + 1));
    } else {
      const object: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(current)) {
        object[key] = SECRET_FIELD.test(normalizedField(key))
          ? "[REDACTED]"
          : visit(item, depth + 1);
      }
      result = object;
    }
    active.delete(current);
    return result;
  }

  return visit(value, 0);
}
