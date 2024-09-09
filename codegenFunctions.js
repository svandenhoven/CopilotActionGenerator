const fs = require('fs');

function isFunctionDefined(filePath, functionName) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const functionPattern = new RegExp(`function\\s+${functionName}\\s*\\(`);
    return functionPattern.test(fileContent);
}

function getFunctionName(actionName) {
    return actionName;
}

function addFunctionParametersInterface(action, config) {
    const interfaceName = `${getFunctionName(action.name)}Parameters`;
    const interfaceTemplate = `
export interface ${interfaceName} {
    // Add parameters here
}
`;
    let interfaceContent = interfaceTemplate;
    if (action.parameters) {
        const properties = action.parameters.properties;
        let parametersCode = '';
        for (const [key, value] of Object.entries(properties)) {
            // replace integer by number for TypeScript reasons
            let type = value.type;
            if (value.type.toLowerCase() === 'integer') {
                type = 'number';
            }
            parametersCode += `    ${key}: ${type};\n`;
        }
        interfaceContent = interfaceTemplate.replace('// Add parameters here', parametersCode.trim());
    }

    const interfaceFile = `${config.appSrcFolder}/${interfaceName}.ts`;
    fs.writeFileSync(interfaceFile, interfaceContent);
    return interfaceName;
}

function addImportToActionFile(filePath, interfaceName) {
    const importStatement = `import { ${interfaceName} } from './${interfaceName}';\n`;

    const actionsTsContent = fs.readFileSync(filePath, 'utf-8');
    // add the interface import to the actions.ts file
    let newActionsTsContent = actionsTsContent.replace("// End <<Import interfaces>>", importStatement + '\n// End <<Import interfaces>>');
    fs.writeFileSync(filePath, newActionsTsContent);
}

function addFunctionToActionsFile(filePath, action, parametersType) {
    const functionName = getFunctionName(action.name);

    const functionTemplate = `
export async function ${functionName}(
    context: TurnContext,
    state: ApplicationTurnState,
    parameters: ${parametersType}
): Promise<string> {
    console.log("[Action Called]: ${functionName}:", parameters);

    // Add your code here

    return "The action ${functionName} is done, think about your next action";
}
`;
    fs.appendFileSync(filePath, functionTemplate);
    return functionName;
}

function addFunctionToAppFile(filePath, functionName) {
    const functionCall = `app.ai.action("${functionName}", ${functionName});\n`;

    const appTsContent = fs.readFileSync(filePath, 'utf-8');
    // add the function import to the app.ts file
    let newAppTsContent = appTsContent.replace("// End <<Import actions>>", `import { ${functionName} } from './actions';\n// End <<Import actions>>`);
    newAppTsContent = newAppTsContent.replace("// <<Actions End>>", `${functionCall}\n// <<Actions End>>`);
    fs.writeFileSync(filePath, newAppTsContent);
}

function addActivitiesToPrompt(activities, config) {
    const prompt = fs.readFileSync(config.promptFilePath, 'utf-8');
    const promptContent = activities.join('');
    const newPromptContent = prompt.replace("{{Actions}}", promptContent);
    fs.writeFileSync(config.promptFilePath, newPromptContent);
}

function createTestToolSecretsFile(projectPath, openAIKey, openAIEndpoint, openAIDeployment) {
    const secretsFile = projectPath + "/env/.env.testtool.user";
    const secrets = `
# Test Tool Secrets
# Add your test tool secrets here
SECRET_AZURE_OPENAI_API_KEY='${openAIKey}'
AZURE_OPENAI_ENDPOINT='${openAIEndpoint}'
AZURE_OPENAI_DEPLOYMENT_NAME='${openAIDeployment}'
`;
    fs.writeFileSync(secretsFile, secrets);
}

module.exports = {
    isFunctionDefined,
    getFunctionName,
    addFunctionParametersInterface,
    addImportToActionFile,
    addFunctionToActionsFile,
    addFunctionToAppFile,
    addActivitiesToPrompt,
    createTestToolSecretsFile
};