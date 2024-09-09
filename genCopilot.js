// Imports
const fs = require('fs');
const minimist = require('minimist');
const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const { get } = require('http');
const path = require('path');
const { getActions, processActions } = require('./actionFunctions');
const { createTestToolSecretsFile } = require('./codegenFunctions');
const { cloneRepo } = require('./commandLineFunctions');
const { appConfig } = require('./appConfig.js');
const { processCmdArgument } = require('./Utils');

// ----------------------------------
// Main Process
// ----------------------------------

async function main(config) {

    if (config.definedActionsFile) {
        //check if the file exists
        if (!fs.existsSync(config.definedActionsFile)) {
            console.error(`Error: The file ${config.definedActionsFile} does not exist.`);
            process.exit(1);
        }
        // check if the defined action file is valid json
        try {

            JSON.parse(fs.readFileSync(config.definedActionsFile));
        }
        catch (err) {
            console.error(`Error: The file ${config.definedActionsFile} is not a valid json file.`);
            process.exit(1);
        }
    }

    let generateActions = '';
    if (config.definedPrompt) {
        const sampleActions = getActions(path.resolve(__dirname, 'sample/actions.lights.json'));
        const client = new OpenAIClient(config.openAIEndpoint, new AzureKeyCredential(config.openAIKey), );
        const messages = [
            { role: "system", content: appConfig.systemPrompt + JSON.stringify(sampleActions, null, 2) },
            { role: "user", content: config.definedPrompt },
          ];
        console.log(`Generated the action plan from the prompt`);
        const { id, created, choices, usage } = await client.getChatCompletions(config.openAIDeployment, messages, {temperature: 0.7, topP: 0.95} );

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
    if (!fs.existsSync(config.projectPath)) {
        console.info(`ProjectPath does not exist: ${config.projectPath}. Let create it`);
        fs.mkdirSync(config.projectPath);
        // clone the project
        console.info(`Clone the project from: ${appConfig.repoUrl} into ${config.projectPath}`);
        cloneRepo(appConfig.repoUrl, config.projectPath);
        console.info(`Project cloned successfully`);
        console.info(`Create the secrets file.`);
        createTestToolSecretsFile(config.projectPath, config.openAIKey, config.openAIEndpoint, config.openAIDeployment);
        if (config.definedActionsFile) {
            // copy custom actions file to the project
            fs.copyFileSync(config.definedActionsFile, actionsFile);
        }
        if (config.definedPrompt) {
            fs.writeFileSync(config.actionsFile, generateActions);
        }
    }

    // Read the actions file
    console.info(`Get the actions from: ${config.actionsFile}`);
    const actions = getActions(config.actionsFile);
    
    // Process the actions to generate code for the actions
    console.info(`Generate code for actions`);
    const activities = processActions(actions, config);

    console.log(`Code created for\n: ${activities}`);
    console.log(`The code is generated in the folder: ${config.projectPath}`);
}

// Parse command-line arguments
const args = minimist(process.argv.slice(2));
const config = processCmdArgument(args, appConfig);


main(config).catch(err => {
    console.error(`Error: ${err}`);
    process.exit(1);
});