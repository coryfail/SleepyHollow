export const repositoryUrl = "https://github.com/coryfail/SleepyHollow";
export const sgadGuideUrl = `${repositoryUrl}/tree/main/docs/sgad`;
export const sgadTemplatesUrl = `${sgadGuideUrl}/templates`;
export const sgadSkillInstallCommand = "npx skills add coryfail/SleepyHollow --skill sgad-workflow";

export const jsrPackageUrl = "https://jsr.io/@sleepy-hollow/framework";
export const frameworkInstallCommand = "deno add jsr:@sleepy-hollow/framework";
export const cliInstallCommand = "deno install -A --global --name hollow jsr:@sleepy-hollow/framework/cli";

export const sitePaths = {
  home: import.meta.env.BASE_URL,
  docs: `${import.meta.env.BASE_URL}docs/`,
  sgad: `${import.meta.env.BASE_URL}sgad/`,
  api: `${import.meta.env.BASE_URL}api/`,
} as const;
