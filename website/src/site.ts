export const repositoryUrl = "https://github.com/coryfail/SleepyHollow";
export const sgadGuideUrl = `${repositoryUrl}/tree/main/docs/sgad`;
export const sgadTemplatesUrl = `${sgadGuideUrl}/templates`;
export const sgadSkillInstallCommand = "npx skills add coryfail/SleepyHollow --skill sgad-workflow";
export const frameworkSkillInstallCommand = "npx skills add coryfail/SleepyHollow --skill sleepy-hollow";

export const npmPackageUrl = "https://www.npmjs.com/package/@sleepy-hollow/framework";
export const frameworkInstallCommand = "npm install @sleepy-hollow/framework";
export const cliInstallCommand = "npm install -g @sleepy-hollow/framework";

export const sitePaths = {
  home: import.meta.env.BASE_URL,
  docs: `${import.meta.env.BASE_URL}docs/`,
  sgad: `${import.meta.env.BASE_URL}sgad/`,
  api: `${import.meta.env.BASE_URL}api/`,
} as const;
