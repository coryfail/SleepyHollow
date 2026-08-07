import { z } from "zod";

import {
  type ConfigurationDefinition,
  type ConfigurationDiagnostic,
  ConfigurationError,
  type ConfigurationValues,
  type ModeSchemas,
  type ResolveConfigurationOptions,
  type ResolvedConfiguration,
  RUNTIME_MODES,
  type RuntimeMode,
} from "./types.ts";

function diagnostic(
  code: string,
  expected: string,
  correction: string,
  mode?: RuntimeMode,
  key?: string,
): ConfigurationDiagnostic {
  return {
    code,
    severity: "error",
    ...(mode ? { mode } : {}),
    ...(key ? { key } : {}),
    expected,
    correction,
  };
}

function schemaKeys(schema: z.ZodObject): readonly string[] {
  return Object.keys(schema.shape).sort();
}

function strictObject(schema: unknown): schema is z.ZodObject {
  if (!(schema instanceof z.ZodObject)) return false;
  try {
    const contract = z.toJSONSchema(schema, { io: "input" });
    return contract.type === "object" &&
      contract.additionalProperties === false;
  } catch {
    return false;
  }
}

export function defineConfiguration<const Schemas extends ModeSchemas>(
  definition: ConfigurationDefinition<Schemas>,
): ConfigurationDefinition<Schemas> {
  const diagnostics: ConfigurationDiagnostic[] = [];
  const modes = definition?.modes as
    | Readonly<Record<string, unknown>>
    | undefined;
  for (const mode of RUNTIME_MODES) {
    if (!modes || !strictObject(modes[mode])) {
      diagnostics.push(diagnostic(
        "SH_CONFIG_SCHEMA_INVALID",
        "a strict Zod 4 object schema",
        `Declare a strict configuration schema for ${mode}.`,
        mode,
      ));
    }
  }

  const allKeys = new Set<string>();
  if (modes) {
    for (const mode of RUNTIME_MODES) {
      const schema = modes[mode];
      if (schema instanceof z.ZodObject) {
        for (const key of schemaKeys(schema)) allKeys.add(key);
      }
    }
  }
  for (const key of definition?.sensitiveKeys ?? []) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || !allKeys.has(key)) {
      diagnostics.push(diagnostic(
        "SH_CONFIG_SENSITIVE_KEY_INVALID",
        "a declared configuration key",
        "List only declared configuration keys in sensitiveKeys.",
        undefined,
        key,
      ));
    }
  }

  const files = definition?.localEnvFiles as
    | Readonly<Record<string, unknown>>
    | undefined;
  for (const [mode, path] of Object.entries(files ?? {})) {
    if (!(["development", "test"] as string[]).includes(mode)) {
      diagnostics.push(diagnostic(
        "SH_CONFIG_ENV_FILE_MODE_INVALID",
        "a development or test local environment file",
        "Remove local environment files from preview and production.",
        RUNTIME_MODES.includes(mode as RuntimeMode)
          ? mode as RuntimeMode
          : undefined,
      ));
    } else if (typeof path !== "string" || !path.trim()) {
      diagnostics.push(diagnostic(
        "SH_CONFIG_ENV_FILE_INVALID",
        "a non-empty explicit local file path",
        "Declare a concrete local environment-file path.",
        mode as RuntimeMode,
      ));
    }
  }

  if (diagnostics.length > 0) throw new ConfigurationError(diagnostics);
  return Object.freeze({
    ...definition,
    sensitiveKeys: Object.freeze([...(definition.sensitiveKeys ?? [])]),
    localEnvFiles: Object.freeze({ ...(definition.localEnvFiles ?? {}) }),
  });
}

function envFileError(
  code: string,
  mode: RuntimeMode,
  key?: string,
): ConfigurationError {
  return new ConfigurationError([diagnostic(
    code,
    key
      ? "one unique KEY=VALUE declaration"
      : "a readable valid environment file",
    key
      ? "Remove duplicate or malformed declarations from the local environment file."
      : "Provide the declared local environment file or remove its configuration.",
    mode,
    key,
  )]);
}

function parseEnvFile(text: string, mode: RuntimeMode): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) throw envFileError("SH_ENV_FILE_INVALID", mode);
    const key = match[1];
    if (Object.hasOwn(values, key)) {
      throw envFileError("SH_ENV_FILE_DUPLICATE", mode, key);
    }
    let value = match[2].trim();
    if (value.startsWith("'") || value.startsWith('"')) {
      const quote = value[0];
      if (value.length < 2 || value.at(-1) !== quote) {
        throw envFileError("SH_ENV_FILE_INVALID", mode, key);
      }
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

export async function resolveConfiguration<
  const Schemas extends ModeSchemas,
  const M extends RuntimeMode,
>(
  definition: ConfigurationDefinition<Schemas>,
  options: ResolveConfigurationOptions<M>,
): Promise<
  ResolvedConfiguration<
    M,
    ConfigurationValues<ConfigurationDefinition<Schemas>, M>
  >
> {
  if (!RUNTIME_MODES.includes(options.mode)) {
    throw new ConfigurationError([diagnostic(
      "SH_CONFIG_MODE_INVALID",
      "development, test, preview, or production",
      "Pass one explicit supported runtime mode.",
    )]);
  }

  const schema = definition.modes[options.mode];
  const keys = schemaKeys(schema);
  let fileValues: Record<string, string> = {};
  const filePath = definition.localEnvFiles
    ?.[options.mode as "development" | "test"];
  if (filePath) {
    const reader = options.readTextFile ??
      ((path: string) => Deno.readTextFile(path));
    try {
      fileValues = parseEnvFile(await reader(filePath), options.mode);
    } catch (error) {
      if (error instanceof ConfigurationError) throw error;
      throw envFileError("SH_ENV_FILE_READ_FAILED", options.mode);
    }
  }

  const environment = options.environment ?? Deno.env.toObject();
  const input: Record<string, string> = {};
  for (const key of keys) {
    if (fileValues[key] !== undefined) input[key] = fileValues[key];
    if (environment[key] !== undefined) input[key] = environment[key]!;
  }

  const parsed = await schema.safeParseAsync(input);
  if (!parsed.success) {
    const diagnostics = parsed.error.issues.map((issue) => {
      const key = typeof issue.path[0] === "string" ? issue.path[0] : undefined;
      return diagnostic(
        "SH_CONFIG_VALUE_INVALID",
        `a value accepted by the ${key ?? "selected mode"} schema`,
        "Provide the required configuration key in its declared safe form.",
        options.mode,
        key,
      );
    });
    throw new ConfigurationError(diagnostics);
  }

  const output = parsed.data as ConfigurationValues<
    ConfigurationDefinition<Schemas>,
    M
  >;
  const sensitive = new Set(definition.sensitiveKeys ?? []);
  const metadata = Object.freeze({
    mode: options.mode,
    keys: Object.freeze(keys.map((name) => {
      const source = environment[name] !== undefined
        ? "environment" as const
        : fileValues[name] !== undefined
        ? "env-file" as const
        : Object.hasOwn(output as object, name)
        ? "default" as const
        : "absent" as const;
      return Object.freeze({
        name,
        source,
        present: Object.hasOwn(output as object, name),
        sensitive: sensitive.has(name),
      });
    })),
  });

  return Object.freeze({
    mode: options.mode,
    values: Object.freeze(output),
    metadata,
  });
}
