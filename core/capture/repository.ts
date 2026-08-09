import type {
  CapturedDataOperation,
  CaptureOperationKind,
  CaptureSession,
} from "./types.ts";

type Recordable = Omit<CapturedDataOperation, "sequence" | "attribution">;

const kinds: Readonly<Record<string, CaptureOperationKind>> = {
  get: "get",
  lookupUnique: "get",
  resolve: "get",
  reference: "get",
  list: "query",
  create: "read-modify-write",
  update: "read-modify-write",
  delete: "read-modify-write",
  raw: "raw",
};

function resourceOf(target: object): string {
  const metadata = (target as { metadata?: { resource?: unknown } }).metadata;
  return typeof metadata?.resource === "string" ? metadata.resource : "unknown";
}

function describe(
  method: string,
  resource: string,
  args: readonly unknown[],
): Recordable | undefined {
  const kind = kinds[method];
  if (!kind) return undefined;
  if (kind === "query") {
    const options = args[0] as
      | { index?: unknown; limit?: unknown }
      | undefined;
    return {
      resource,
      kind,
      ...(typeof options?.index === "string" ? { index: options.index } : {}),
      ...(typeof options?.limit === "number" ? { limit: options.limit } : {}),
    };
  }
  if (kind === "raw") {
    const justification = args[0];
    return {
      resource,
      kind,
      ...(typeof justification === "string"
        ? { rawJustification: justification }
        : {}),
    };
  }
  if (kind === "read-modify-write") {
    const versionstamp = args.find((value) => typeof value === "string");
    const checked = method !== "create" && typeof versionstamp === "string";
    return { resource, kind, versionstampCheck: checked, atomic: true };
  }
  return { resource, kind };
}

export function repository<Repository extends object>(
  target: Repository,
  active: CaptureSession,
): Repository {
  const resource = resourceOf(target);
  return new Proxy(target, {
    get(subject, property, receiver) {
      const value = Reflect.get(subject, property, receiver);
      if (typeof value !== "function" || typeof property !== "string") {
        return value;
      }
      return (...args: unknown[]) => {
        const record = describe(property, resource, args);
        const result = (value as (...input: unknown[]) => unknown).apply(
          subject,
          args,
        );
        if (record) active.recordDataOperation(record);
        return result;
      };
    },
  });
}
