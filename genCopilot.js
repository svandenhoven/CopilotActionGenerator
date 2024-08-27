// Imports
const fs = require('fs');
const minimist = require('minimist');
const { execSync } = require('child_process');

// Constants
const actionsJsonFile = "/src/prompts/planner/actions.json"
const promptFile = "/src/prompts/planner/skprompt.txt"
const actionsTsFile = "/src/app/actions.ts"
const appSrcPath = "/src/app"
const appTsFile = appSrcPath+"/app.ts"
const repoUrl = 'https://github.com/svandenhoven/TemplateAgentApp.git';

function getActions(actionsFile) {
    // read the actions file
    return JSON.parse(fs.readFileSync(actionsFile));
    
}

function isFunctionDefined(filePath, functionName) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const functionPattern = new RegExp(`function\\s+${functionName}\\s*\\(`);
    return functionPattern.test(fileContent);
}

function getFunctionName(actionName) {
    return actionName;
}

function addFunctionParametersInterface(action) {
    const interfaceName = `${getFunctionName(action.name)}Parameters`;
    const interfaceTemplate = `
export interface ${interfaceName} {
    // Add parameters here
}
`;
    const properties = action.parameters.properties;
    let parametersCode = '';
    for (const [key, value] of Object.entries(properties)) {
        parametersCode += `    ${key}: ${value.type};\n`;
    }

    interfaceContent = interfaceTemplate.replace('// Add parameters here', parametersCode.trim());

    const interfaceFile = `${appSrcFolder}/${interfaceName}.ts`;
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

function addActivitiesToPrompt(activities) {
    const prompt = fs.readFileSync(promptFilePath, 'utf-8');
    const promptContent = activities.join('');
    const newPromptContent = prompt.replace("{{Actions}}", promptContent);
    fs.writeFileSync(promptFilePath, newPromptContent);
}

function processActions(actions) {
    // list of activities
    let activities = [];
    // process the actions
    actions.forEach(action => {
        // check in actions.ts in actionsTsPath if the action is already defined
        // if not, add it to the list of activities
        activities.push(`- ${action.name}: ${action.description}\n`);
        if (!isFunctionDefined(actionsCodeFile, getFunctionName(action.name))) {

            const interfaceName = addFunctionParametersInterface(action);
            addImportToActionFile(actionsCodeFile, interfaceName);
            const functionName = addFunctionToActionsFile(actionsCodeFile, action, interfaceName);
            addFunctionToAppFile(appCodeFile, functionName);
        }
    });
    addActivitiesToPrompt(activities);
    return activities;
}

function cloneRepo(repoUrl, projectPath) {
    try {
        execSync(`git clone ${repoUrl} ${projectPath}`, { stdio: 'inherit' });
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
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



// Main

// Parse command-line arguments
const args = minimist(process.argv.slice(2));

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

// Set Path constants
const actionsFile = projectPath + actionsJsonFile;
const promptFilePath = projectPath + promptFile;
const actionsCodeFile = projectPath + actionsTsFile;
const appCodeFile = projectPath + appTsFile;
const appSrcFolder = projectPath + appSrcPath;
const customActionsFileDefined = false;

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

// check if projectPath exists, if not create it
if (!fs.existsSync(projectPath)) {
    console.info(`ProjectPath does not exist: ${projectPath}. Let create it`);
    fs.mkdirSync(projectPath);
    // clone the project
    console.info(`Clone the project from: ${repoUrl} into ${projectPath}`);
    cloneRepo(repoUrl, projectPath);
    createTestToolSecretsFile(projectPath, openAIKey, openAIEndpoint, openAIDeployment);
}

// When custom actions file is defined, copy it to the project
// Access the value of the --actions flag
const definedActionsFile = args.actions;
if (definedActionsFile) {
    // copy custom actions file to the project
    fs.copyFileSync(definedActionsFile, actionsFile);
}

// Read the actions file
console.info(`Get the actions from: ${actionsFile}`);
const actions = getActions(actionsFile);
// Process the actions to generate code for the actions
console.info(`Generate code for actions`);
const activities = processActions(actions);

console.log(`Code created for\n: ${activities}`);