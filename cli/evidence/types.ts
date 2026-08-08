import type { RequirementEvidence } from "../../core/testing/mod.ts";
import type { CheckRequirement, CheckRoute } from "../check/mod.ts";

export interface EvidenceDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly line?: number;
  readonly summary: string;
  readonly correction: string;
}

export interface ServiceLocations {
  readonly id: string;
  readonly root: string;
  readonly apiRoot: string;
  readonly requirementsPath: string;
  readonly generatedRoot: string;
  readonly testsRoot: string;
}

export interface ProjectLocations {
  readonly projectRoot: string;
  readonly name: string;
  readonly apiDirectory: string;
  readonly requirementsFile: string;
  readonly generatedDirectory: string;
  readonly services: readonly ServiceLocations[];
}

export interface LoadedRequirement extends RequirementEvidence {
  readonly path: string;
  readonly serviceId?: string;
  readonly approvalBound: boolean;
}

export interface LoadedBehavior {
  readonly routes: readonly CheckRoute[];
  readonly diagnostics: readonly EvidenceDiagnostic[];
}

export interface EvidenceLoadOptions {
  readonly projectRoot: string;
  readonly readTextFile?: (path: string) => Promise<string>;
  readonly listDirectory?: (
    path: string,
  ) => Promise<
    readonly {
      readonly name: string;
      readonly isDirectory: boolean;
      readonly isSymlink: boolean;
    }[]
  >;
}

export interface ProjectConfiguration {
  readonly name: string;
  readonly apiDirectory: string;
  readonly requirementsFile: string;
  readonly generatedDirectory: string;
}

export interface RequirementInventory {
  readonly requirements: readonly LoadedRequirement[];
  readonly checkRequirements: readonly CheckRequirement[];
}
