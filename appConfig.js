const appConfig = Object.freeze({
    actionsJsonFile: "/src/prompts/planner/actions.json",
    promptFile: "/src/prompts/planner/skprompt.txt",
    actionsTsFile: "/src/app/actions.ts",
    appSrcPath: "/src/app",
    appTsFile: "/src/app/app.ts",
    repoUrl: 'https://github.com/svandenhoven/TemplateAgentApp.git',
    systemPrompt: `You are a system generating action plans based on the input of the user. 
    The action plan must be a list and always returning a json list and have the below structure which is example for action to manage lights.
    Do not add parameters property if these are not needed.\n`
  });
  
  module.exports = {
    appConfig
};
