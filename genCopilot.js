// Imports
const fs = require('fs');
const minimist = require('minimist');
const { execSync } = require('child_process');
const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const { get } = require('http');
const path = require('path');

// Constants
const actionsJsonFile = "/src/prompts/planner/actions.json"
const promptFile = "/src/prompts/planner/skprompt.txt"
const actionsTsFile = "/src/app/actions.ts"
const appSrcPath = "/src/app"
const appTsFile = appSrcPath+"/app.ts"
const repoUrl = 'https://github.com/svandenhoven/TemplateAgentApp.git';

function getActions(actionsFile) {
    // read the actions file
    try {
        const actionsContent = fs.readFileSync(actionsFile, 'utf-8');
        const actions = JSON.parse(actionsContent);
        return actions;
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }   
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



// ----------------------------------
// Main Process
// ----------------------------------

async function main() {

    if (definedActionsFile) {
        //check if the file exists
        if (!fs.existsSync(definedActionsFile)) {
            console.error(`Error: The file ${definedActionsFile} does not exist.`);
            process.exit(1);
        }
        // check if the defined action file is valid json
        try {

            JSON.parse(fs.readFileSync(definedActionsFile));
        }
        catch (err) {
            console.error(`Error: The file ${definedActionsFile} is not a valid json file.`);
            process.exit(1);
        }
    }

    let generateActions = '';
    if (definedPrompt) {
        const sampleActions = getActions(path.resolve(__dirname, 'sample/actions.lights.json'));
        const client = new OpenAIClient(openAIEndpoint, new AzureKeyCredential(openAIKey), );
        const messages = [
            { role: "system", content: systemPrompt + JSON.stringify(sampleActions, null, 2) },
            { role: "user", content: definedPrompt },
          ];
        console.log(`Generated the action plan from the prompt`);
        const { id, created, choices, usage } = await client.getChatCompletions(openAIDeployment, messages, {temperature: 0.7, topP: 0.95} );

        // get the action plan from the response
        if (choices && choices[0] && choices[0].message && choices[0].message.content) {
            const content = choices[0].message.content;
            const match = content.match(/```json([\s\S]*?)```/);
            if (match && match[1]) {
                const jsonString = match[1].trim();
                generateActions = jsonString;
            } else {
                console.log("No JSON content found between ```json and ```");
                generateActions = content;
            }
        } else {
            console.log("No content found in choices[0].message.content");
        }
    }

    // check if projectPath exists, if not create it
    if (!fs.existsSync(projectPath)) {
        console.info(`ProjectPath does not exist: ${projectPath}. Let create it`);
        fs.mkdirSync(projectPath);
        // clone the project
        console.info(`Clone the project from: ${repoUrl} into ${projectPath}`);
        cloneRepo(repoUrl, projectPath);
        console.info(`Project cloned successfully`);
        console.info(`Create the secrets file.`);
        createTestToolSecretsFile(projectPath, openAIKey, openAIEndpoint, openAIDeployment);
        if (definedActionsFile) {
            // copy custom actions file to the project
            fs.copyFileSync(definedActionsFile, actionsFile);
        }
        if (definedPrompt) {
            fs.writeFileSync(actionsFile, generateActions);
        }
    }

    // Read the actions file
    console.info(`Get the actions from: ${actionsFile}`);
    const actions = getActions(actionsFile);
    // Process the actions to generate code for the actions
    console.info(`Generate code for actions`);
    const activities = processActions(actions);

    console.log(`Code created for\n: ${activities}`);
    console.log(`The code is generated in the folder: ${projectPath}`);
}

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

// Constants 
const systemPrompt = `You are a system generating action plans based on the input of the user. 
The action plan must be a list and always returning a json list and have the below structure which is example for action to manage lights.
 Do not add parameters property if these are not needed.\n`;

// Set Path constants
const actionsFile = projectPath + actionsJsonFile;
const promptFilePath = projectPath + promptFile;
const actionsCodeFile = projectPath + actionsTsFile;
const appCodeFile = projectPath + appTsFile;
const appSrcFolder = projectPath + appSrcPath;

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

// When custom actions file is defined, copy it to the project
// Access the value of the --actions flag
const definedActionsFile = args.actions;

// When prompt is defined, use it to generate actions
const definedPrompt = args.prompt

main().catch(err => {
    console.error(`Error: ${err}`);
    process.exit(1);
});