export const repositoryUrl = "https://github.com/coryfail/SleepyHollow";
export const sgadGuideUrl = `${repositoryUrl}/tree/main/docs/sgad`;
export const sgadTemplatesUrl = `${sgadGuideUrl}/templates`;
export const sgadSkillInstallCommand = "npx skills add coryfail/SleepyHollow --skill sgad-workflow";

export const sitePaths = {
  home: import.meta.env.BASE_URL,
  sgad: `${import.meta.env.BASE_URL}sgad/`,
} as const;
