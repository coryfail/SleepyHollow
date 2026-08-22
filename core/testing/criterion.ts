import { platform } from "#platform";
import { createHash } from "crypto";
import { test } from "vitest";

import { testingDiagnostic, TestingError } from "./error.ts";
import type {
  CriterionTestDescriptor,
  CriterionTestRegistry,
  CriterionTestSpec,
  RequirementEvidence,
  TestManifest,
} from "./types.ts";

/**
 * Internal hook used by the CLI to inspect criterion registrations without
 * executing the native test runner. Symbol.for keeps the hook shared when a
 * project imports the published testing entry point.
 */
export const CRITERION_TEST_DISCOVERY = Symbol.for(
  "sleepy-hollow.criterion-test-discovery",
);

export interface CriterionTestDiscovery {
  readonly onRegistered: (descriptor: CriterionTestDescriptor) => void;
}

function discoveryHook(): CriterionTestDiscovery | undefined {
  const value = (globalThis as unknown as Record<symbol, unknown>)[
    CRITERION_TEST_DISCOVERY
  ];
  if (!value || typeof value !== "object") return undefined;
  const onRegistered = (value as { onRegistered?: unknown }).onRegistered;
  return typeof onRegistered === "function"
    ? value as CriterionTestDiscovery
    : undefined;
}

const stableId = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const criterionId = /^AC-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

function validateRequirements(
  requirements: readonly RequirementEvidence[],
): ReadonlyMap<string, RequirementEvidence> {
  const byId = new Map<string, RequirementEvidence>();
  for (const requirement of requirements) {
    if (byId.has(requirement.id)) {
      throw new TestingError([testingDiagnostic(
        "SH_TEST_REQUIREMENT_DUPLICATE",
        `Requirement ${requirement.id} is duplicated in testing metadata.`,
        "Provide one current parsed requirement per stable ID.",
        requirement.id,
      )]);
    }
    byId.set(requirement.id, requirement);
  }
  return byId;
}

export function createRegistry(options: {
  readonly requirements: readonly RequirementEvidence[];
  readonly register?: (definition: { readonly name: string; readonly fn: (context?: unknown) => void | Promise<void>; readonly skip?: boolean }) => void;
}): CriterionTestRegistry {
  const requirements = validateRequirements(options.requirements);
  const register = options.register ?? ((definition) => {
    if (discoveryHook()) return;
    test(definition.name, { skip: definition.skip }, definition.fn);
  });
  const descriptors = new Map<string, CriterionTestDescriptor>();

  return Object.freeze({
    criterionTest(spec: CriterionTestSpec): CriterionTestDescriptor {
      const diagnostics = [];
      const requirement = requirements.get(spec.requirementId);
      if (!stableId.test(spec.id)) {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_ID_INVALID",
          `Test ID ${spec.id || "<empty>"} is not stable.`,
          "Use a non-empty ID containing letters, numbers, dots, underscores, or hyphens.",
          spec.id,
        ));
      }
      if (descriptors.has(spec.id)) {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_ID_DUPLICATE",
          `Test ID ${spec.id} is already registered.`,
          "Give every governed test a globally unique stable ID.",
          spec.id,
        ));
      }
      if (!requirement) {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_REQUIREMENT_UNKNOWN",
          `Test ${spec.id} names unknown requirement ${spec.requirementId}.`,
          "Use a requirement from the approved parsed inventory.",
          spec.id,
        ));
      } else {
        const approval = requirement.approval;
        const validApproval = requirement.status !== "draft" &&
          approval?.valid &&
          approval.digest === requirement.governedContentDigest;
        if (!validApproval) {
          diagnostics.push(testingDiagnostic(
            "SH_TEST_REQUIREMENT_NOT_APPROVED",
            `Requirement ${requirement.id} has ${requirement.status} lifecycle state and no valid current approval for test generation.`,
            "Obtain exact-content approval for the current requirement and bounded criteria.",
            requirement.id,
          ));
        }
      }
      if (spec.name.trim() === "") {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_NAME_REQUIRED",
          `Test ${spec.id} has an empty human-readable name.`,
          "Describe the observable behavior in the test name.",
          spec.id,
        ));
      }
      if (spec.sourcePath.trim() === "") {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_SOURCE_REQUIRED",
          `Test ${spec.id} has no source path.`,
          "Record the repository-relative test source path.",
          spec.id,
        ));
      }
      if (
        spec.criteria.length === 0 ||
        spec.criteria.some((id) => !criterionId.test(id))
      ) {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_CRITERIA_INVALID",
          `Test ${spec.id} must name at least one stable acceptance criterion.`,
          "Use unique IDs such as AC-BOOKMARKS-001.",
          spec.id,
        ));
      }
      if (new Set(spec.criteria).size !== spec.criteria.length) {
        diagnostics.push(testingDiagnostic(
          "SH_TEST_CRITERIA_DUPLICATE",
          `Test ${spec.id} repeats a criterion mapping.`,
          "List each mapped criterion exactly once.",
          spec.id,
        ));
      }
      if (requirement) {
        const declared = new Set(requirement.criteria.map((item) => item.id));
        const approved = new Set(requirement.approval?.criteria ?? []);
        for (const id of spec.criteria) {
          if (!declared.has(id) || !approved.has(id)) {
            diagnostics.push(testingDiagnostic(
              "SH_TEST_CRITERION_NOT_APPROVED",
              `Test ${spec.id} maps criterion ${id}, which is not bounded by the current approval.`,
              "Map only current declared and approved criteria.",
              spec.id,
            ));
          }
        }
      }
      if (diagnostics.length > 0) throw new TestingError(diagnostics);

      const registeredName = `${spec.criteria.join(" ")} · ${spec.name.trim()}`;
      const descriptor = Object.freeze({
        id: spec.id,
        requirementId: spec.requirementId,
        criteria: Object.freeze([...spec.criteria]),
        name: spec.name.trim(),
        registeredName,
        sourcePath: spec.sourcePath,
      });
      register({
        name: registeredName,
        fn: spec.fn,
        skip: spec.ignore,
      });
      descriptors.set(spec.id, descriptor);
      discoveryHook()?.onRegistered(descriptor);
      return descriptor;
    },
    descriptors(): readonly CriterionTestDescriptor[] {
      return Object.freeze([...descriptors.values()]);
    },
  });
}

export function manifest(options: {
  readonly descriptors: readonly CriterionTestDescriptor[];
  readonly sources: Readonly<Record<string, string>>;
}): TestManifest {
  const seen = new Set<string>();
  const tests = options.descriptors.map((descriptor) => {
    if (seen.has(descriptor.id)) {
      throw new TestingError([testingDiagnostic(
        "SH_TEST_ID_DUPLICATE",
        `Manifest contains duplicate test ID ${descriptor.id}.`,
        "Give every governed test one globally unique ID.",
        descriptor.id,
      )]);
    }
    seen.add(descriptor.id);
    const source = options.sources[descriptor.sourcePath];
    if (source === undefined) {
      throw new TestingError([testingDiagnostic(
        "SH_TEST_SOURCE_MISSING",
        `Manifest cannot read source ${descriptor.sourcePath} for ${descriptor.id}.`,
        "Provide the exact UTF-8 test source before recording its manifest.",
        descriptor.id,
      )]);
    }
    return Object.freeze({
      ...descriptor,
      criteria: Object.freeze([...descriptor.criteria]),
      sourceDigest: createHash("sha256").update(source, "utf8").digest("hex"),
    });
  }).sort((left, right) =>
    left.requirementId.localeCompare(right.requirementId) ||
    left.id.localeCompare(right.id)
  );
  return Object.freeze({
    schema: "sleepy-hollow-test-manifest/v1",
    tests: Object.freeze(tests),
  });
}
