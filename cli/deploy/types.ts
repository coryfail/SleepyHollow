import type { CheckResult } from "../check/mod.ts";
import type { ContractChange } from "../generate/mod.ts";

export const DEPLOY_TARGET_KINDS = ["fly"] as const;

export type DeployTargetKind = (typeof DEPLOY_TARGET_KINDS)[number];

export interface DeployTarget {
  readonly kind: DeployTargetKind;
  readonly project: string;
}

export interface SmokeTestDefinition {
  readonly id: string;
  readonly description: string;
  readonly method: string;
  readonly path: string;
  readonly expectedStatus: number;
  readonly required: boolean;
}

export interface SmokeTestOutcome {
  readonly id: string;
  readonly status: "passed" | "failed";
  readonly observedStatus?: number;
  readonly evidence: string;
}

export interface DeployDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly summary: string;
  readonly evidence: readonly string[];
  readonly correction: string;
}

export interface DeployInventory {
  readonly projectRootDisplay: string;
  readonly target: DeployTarget;
  readonly revision: string;
  readonly deployedRevision?: string;
  readonly verification: CheckResult;
  readonly environmentKeys: readonly string[];
  readonly deployedEnvironmentKeys: readonly string[];
  readonly contractChanges: readonly ContractChange[];
  readonly openApiPath: string;
  readonly documentationPath: string;
  readonly smokeTests: readonly SmokeTestDefinition[];
  readonly firstExternalDeployment: boolean;
}

export interface DeployPlan {
  readonly target: DeployTarget;
  readonly revision: string;
  readonly deployedRevision?: string;
  readonly environmentKeyChanges: readonly {
    readonly key: string;
    readonly change: "added" | "removed";
  }[];
  readonly contractChanges: readonly ContractChange[];
  readonly smokeTests: readonly SmokeTestDefinition[];
  readonly requiresConfirmation: boolean;
  readonly unchanged: boolean;
}

export interface DeployUpload {
  readonly url: string;
  readonly revision: string;
}

export interface DeployAdapter {
  upload(
    options: {
      readonly target: DeployTarget;
      readonly revision: string;
      readonly token: string;
    },
  ): DeployUpload | Promise<DeployUpload>;
  health(
    options: { readonly url: string },
  ): SmokeTestOutcome | Promise<SmokeTestOutcome>;
  smoke(
    options: {
      readonly url: string;
      readonly test: SmokeTestDefinition;
    },
  ): SmokeTestOutcome | Promise<SmokeTestOutcome>;
}

export interface DeployResult {
  readonly schema: "sleepy-hollow-deploy-result/v1";
  readonly ok: boolean;
  readonly command: "deploy";
  readonly projectRoot: string;
  readonly outcome:
    | "deployed"
    | "unchanged"
    | "blocked"
    | "confirmation-required"
    | "smoke-failed";
  readonly plan: DeployPlan;
  readonly url?: string;
  readonly deployedRevision?: string;
  readonly openApiPath?: string;
  readonly documentationPath?: string;
  readonly health?: SmokeTestOutcome;
  readonly smokeResults: readonly SmokeTestOutcome[];
  readonly completedAt?: string;
  readonly diagnostics: readonly DeployDiagnostic[];
}

export interface DeployCommandIo {
  readonly cwd: string;
  readonly now: () => string;
  stdout(value: string): void;
  stderr(value: string): void;
}

export interface DeployRequest {
  readonly inventory: DeployInventory;
  readonly token: string;
  readonly confirmed: boolean;
  readonly confirmationSource?: string;
}

export type DeployInventoryLoader = (
  options: { readonly projectRoot: string },
) => DeployInventory | Promise<DeployInventory>;
