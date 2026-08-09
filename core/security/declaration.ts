import { isAbsolute, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import type { NormalizedRoute } from "../routing/mod.ts";
import { createSecurityRouter } from "./security_router.ts";
import {
  type ProjectSecurityOptions,
  SecurityConfigurationError,
  type SecurityDeclaration,
  type SecurityDiagnostic,
  type SecurityRouter,
} from "./types.ts";

function failure(
  code: string,
  summary: string,
  correction: string,
  source?: string,
): SecurityConfigurationError {
  const diagnostic: SecurityDiagnostic = {
    code,
    severity: "error",
    summary,
    ...(source ? { source } : {}),
    correction,
  };
  return new SecurityConfigurationError([diagnostic]);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Declares the security a project shares across its routes: its providers,
 * its rate limit policies, and its cross-origin policy.
 *
 * The declaration is validated here, so a malformed provider is caught at
 * startup rather than on the first request that would have used it.
 *
 * @param declaration The shared providers, policies, and CORS configuration.
 * @returns The same declaration, typed as given.
 * @throws {SecurityConfigurationError} When the declaration is malformed.
 */
export function defineSecurity<const Declaration extends SecurityDeclaration>(
  declaration: Declaration,
): Declaration {
  if (!record(declaration)) {
    throw failure(
      "SH_SECURITY_DECLARATION_INVALID",
      "A security declaration must be one object",
      "Pass one object of providers, rate limits, and CORS to defineSecurity.",
    );
  }
  for (const key of ["providers", "rateLimits"] as const) {
    const value = declaration[key];
    if (value !== undefined) Object.freeze(value);
  }
  return Object.freeze(declaration);
}

function validate(
  declaration: unknown,
  source: string,
): SecurityDeclaration {
  if (!record(declaration)) {
    throw failure(
      "SH_SECURITY_DECLARATION_INVALID",
      `The security module ${source} has no default declaration object`,
      "Default-export the result of defineSecurity.",
      source,
    );
  }

  const providers = declaration.providers;
  if (providers !== undefined) {
    if (!record(providers)) {
      throw failure(
        "SH_SECURITY_DECLARATION_INVALID",
        `The security module ${source} declares malformed providers`,
        "Declare providers as a record of named authentication providers.",
        source,
      );
    }
    for (const [name, provider] of Object.entries(providers)) {
      if (
        !record(provider) || typeof provider.challenge !== "string" ||
        typeof provider.authenticate !== "function"
      ) {
        throw failure(
          "SH_SECURITY_DECLARATION_INVALID",
          `Provider '${name}' in ${source} is not a well-formed provider`,
          "Declare a string challenge and an authenticate function.",
          source,
        );
      }
    }
  }

  const rateLimits = declaration.rateLimits;
  if (rateLimits !== undefined && !record(rateLimits)) {
    throw failure(
      "SH_SECURITY_DECLARATION_INVALID",
      `The security module ${source} declares malformed rate limits`,
      "Declare rateLimits as a record of named policies.",
      source,
    );
  }

  const cors = declaration.cors;
  if (cors !== undefined && !record(cors)) {
    throw failure(
      "SH_SECURITY_DECLARATION_INVALID",
      `The security module ${source} declares malformed CORS`,
      "Declare cors as one explicit deny or allow decision.",
      source,
    );
  }

  return declaration as SecurityDeclaration;
}

async function declared(
  options: ProjectSecurityOptions,
): Promise<SecurityDeclaration> {
  const named = options.securityModule;
  if (named === undefined) return {};
  if (typeof named !== "string" || named.trim() === "" || isAbsolute(named)) {
    throw failure(
      "SH_SECURITY_MODULE_INVALID",
      "The declared security module is not a safe project-relative path",
      "Name one project-contained module in securityModule.",
      typeof named === "string" ? named : undefined,
    );
  }

  const root = resolve(options.root);
  const target = resolve(root, named);
  if (target !== root && !target.startsWith(root + sep)) {
    throw failure(
      "SH_SECURITY_MODULE_ESCAPE",
      `The declared security module ${named} resolves outside the project`,
      "Keep the security module inside the project.",
      named,
    );
  }

  // A lexical check cannot see a symlink pointing out of the project, so the
  // real path is resolved and re-checked before the module is imported. This
  // runs only for a real filesystem import; an injected loader replaces module
  // resolution entirely and has no path to canonicalize.
  if (options.load === undefined) {
    let real: string;
    try {
      real = await Deno.realPath(target);
    } catch {
      throw failure(
        "SH_SECURITY_MODULE_UNRESOLVED",
        `The declared security module ${named} could not be resolved`,
        "Create the named module or correct securityModule.",
        named,
      );
    }
    const realRoot = await Deno.realPath(root).catch(() => root);
    if (real !== realRoot && !real.startsWith(realRoot + sep)) {
      throw failure(
        "SH_SECURITY_MODULE_ESCAPE",
        `The declared security module ${named} resolves outside the project through a symlink`,
        "Keep the security module and anything it links to inside the project.",
        named,
      );
    }
  }

  const specifier = pathToFileURL(target).href;
  let loaded: unknown;
  try {
    loaded = await (options.load ? options.load(specifier) : import(specifier));
  } catch (error) {
    // Reaching here with a real import means the file exists but failed while
    // loading. Reporting that as "could not be resolved" sends the reader
    // looking for a missing file. The error name is safe to name; its message
    // can carry absolute host paths and source text, so it is not repeated.
    const failedToLoad = options.load === undefined;
    throw failure(
      failedToLoad
        ? "SH_SECURITY_MODULE_FAILED"
        : "SH_SECURITY_MODULE_UNRESOLVED",
      failedToLoad
        ? `The declared security module ${named} threw ${
          error instanceof Error ? error.name : "an error"
        } while loading`
        : `The declared security module ${named} could not be resolved`,
      failedToLoad
        ? "Repair the security module so it loads without throwing."
        : "Create the named module or correct securityModule.",
      named,
    );
  }

  const value = record(loaded) && "default" in loaded
    ? loaded.default
    : undefined;
  if (value === undefined) {
    throw failure(
      "SH_SECURITY_DECLARATION_INVALID",
      `The security module ${named} has no default export`,
      "Default-export the result of defineSecurity.",
      named,
    );
  }
  return validate(value, named);
}

/**
 * Builds a secured router by loading the project's own security module.
 *
 * Every route's declaration is resolved against what the module provides, so a
 * route naming a provider or policy that does not exist stops startup rather
 * than failing open at request time.
 *
 * @param routes The discovered route table.
 * @param options The posture, the project root, and where to load from.
 * @returns A router with security applied, and its resolved inventory.
 * @throws {SecurityConfigurationError} When any route cannot be satisfied.
 */
export async function composeProjectSecurity(
  routes: readonly NormalizedRoute[],
  options: ProjectSecurityOptions,
): Promise<SecurityRouter> {
  const declaration = await declared(options);
  return createSecurityRouter(routes, {
    mode: options.mode,
    ...(declaration.providers ? { providers: declaration.providers } : {}),
    ...(declaration.rateLimits ? { rateLimits: declaration.rateLimits } : {}),
    ...(declaration.cors ? { cors: declaration.cors } : {}),
    ...(options.onDiagnostic ? { onDiagnostic: options.onDiagnostic } : {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
  });
}
