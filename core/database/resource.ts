import { DatabaseConfigurationError } from "./errors.ts";
import type { ResourceDefinition } from "./types.ts";

const identifier = /^[a-z][a-z0-9_]*$/;

/** Defines the portable relational subset accepted by framework repositories. */
export function defineResource(definition: ResourceDefinition): ResourceDefinition {
  if (!identifier.test(definition.name)) {
    throw new DatabaseConfigurationError("Resource names must be lowercase SQL identifiers.");
  }
  if (!Object.hasOwn(definition.fields, definition.primaryKey)) {
    throw new DatabaseConfigurationError("The resource primary key must name a declared field.");
  }
  for (const field of Object.keys(definition.fields)) {
    if (!identifier.test(field)) {
      throw new DatabaseConfigurationError("Resource field names must be lowercase SQL identifiers.");
    }
  }
  return Object.freeze({
    ...definition,
    fields: Object.freeze({ ...definition.fields })
  });
}
