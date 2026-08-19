import { createHash } from "crypto";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

export function digest(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function stableSummary(value: unknown): string {
  return JSON.stringify(stable(value));
}
