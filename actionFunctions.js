const fs = require('fs');

const { 
    isFunctionDefined, 
    getFunctionName,
    addFunctionParametersInterface,
    addImportToActionFile,
    addFunctionToActionsFile,
    addFunctionToAppFile,
    addActivitiesToPrompt
} = require('./codegenFunctions');

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

function processActions(actions, config) {
    // list of activities
    let activities = [];
    // process the actions
    actions.forEach(action => {
        // check in actions.ts in actionsTsPath if the action is already defined
        // if not, add it to the list of activities
        activities.push(`- ${action.name}: ${action.description}\n`);
        if (!isFunctionDefined(config.actionsCodeFile, getFunctionName(action.name))) {

            const interfaceName = addFunctionParametersInterface(action, config);
            addImportToActionFile(config.actionsCodeFile, interfaceName);
            const functionName = addFunctionToActionsFile(config.actionsCodeFile, action, interfaceName);
            addFunctionToAppFile(config.appCodeFile, functionName);
        }
    });
    addActivitiesToPrompt(activities, config);
    return activities;
}

module.exports = {
    getActions,
    processActions
};
