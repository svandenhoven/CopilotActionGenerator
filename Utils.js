function processCmdArgument(args, appConfig) {
        // If help is requested, print help and exit
    if (args.help) {
        console.log("\nUsage: node genCopilot.js --path <projectPath> --actions <actionsFile> --key <openAIKey> --endpoint <openAIEndpoint> --deployment <openAIDeployment>\n");
        process.exit(0);
    }

    // Access the value of the --path flag
    const projectPath = args.path;
    if (!projectPath) {
        console.error("Error: --path flag is not provided.");
        process.exit(1);
    }

    // Access the value of the --openAIKey flag
    let openAIKey = args.key;
    if (!openAIKey) {
        openAIKey = "<<Your_Azure_OpenAI_API_Key>>";
    }

    // Access the value of the --openAIKey flag
    let openAIEndpoint = args.endpoint;
    if (!openAIEndpoint) {
        openAIEndpoint = "<<Your_Azure_OpenAI_API_Endpoint>>";
    }

    // Access the value of the --openAIKey flag
    let openAIDeployment = args.deployment;
    if (!openAIDeployment) {
        openAIDeployment = "<<Your_Azure_OpenAI_API_Deployment>>";
    }

    // Set Path constants
    const config = {
        projectPath: projectPath,
        actionsFile:projectPath + appConfig.actionsJsonFile,
        promptFilePath: projectPath + appConfig.promptFile,
        actionsCodeFile: projectPath + appConfig.actionsTsFile,
        appCodeFile: projectPath + appConfig.appTsFile,
        appSrcFolder: projectPath + appConfig.appSrcPath,
        definedActionsFile: args.actions,
        definedPrompt: args.prompt,
        openAIKey: openAIKey,
        openAIEndpoint: openAIEndpoint,
        openAIDeployment: openAIDeployment
    };

    return config
}

module.exports = {
    processCmdArgument 
};