export interface SleepyHollowProject {
  readonly name: string;
  readonly apiDirectory: string;
  readonly requirementsFile: string;
  readonly generatedDirectory: string;
}

export function defineProject<const Project extends SleepyHollowProject>(
  project: Project,
): Project {
  return Object.freeze(project);
}
