/**
 * Configuration, structured logging, and operational endpoints.
 *
 * Configuration is declared per runtime mode and resolved once at startup, so
 * a missing or malformed value stops the process instead of surfacing as a
 * failure on the first request that needs it. Liveness and readiness routes
 * are built from the same declaration.
 *
 * @module
 */
export { defineConfiguration, resolveConfiguration } from "./configuration.ts";
export { createJsonLogger } from "./logger.ts";
export { createOperationalRoutes } from "./operational.ts";
export {
  type ConfigurationDefinition,
  type ConfigurationDiagnostic,
  ConfigurationError,
  type ConfigurationKeyMetadata,
  type ConfigurationMetadata,
  type ConfigurationValues,
  type JsonLogger,
  type JsonLoggerOptions,
  type LogLevel,
  type ModeSchemas,
  type OperationalRouteOptions,
  type ReadinessCheck,
  type ResolveConfigurationOptions,
  type ResolvedConfiguration,
  RUNTIME_MODES,
  type RuntimeMode,
} from "./types.ts";
