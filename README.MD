# Documentation for `Copilot Action Generator`

## Overview

`genCopilot.js` is a Node.js script designed to automate certain tasks related to project setup and management. This script can clone a GitHub repository into a specified directory and perform additional setup tasks.

The Copilot Action Generator will create an Teams Toolkit App. It uses a template that is created from Teams Toolkit Generated App. This is **Custom Engine Copilot**, **AI Agent**, **Build New** application in Typescript.

It will read the actions.json in the /prompts/planner/actions.json file and will generate code for the actions defined.

When the secrets for Azure OpenAI are defined (see below) you can open the project in Visual Code (with Teams Toolkit Installed) and press F5 to run it.

## Prerequisites

- Teams Toolkit installed in Visual Code
- Node.js installed on your machine.
- Git installed on your machine.
- `minimist` library for parsing command-line arguments.

## Installation

1. **Clone the Repository**:

    ```sh
    git clone https://github.com/svandenhoven/CopilotActionGenerator
    ```

2. **Navigate to the Project Directory**:

    ```sh
    cd your-repo-directory
    ```

3. **Install Dependencies**:

    ```sh
    npm install
    ```

## Usage

To run the `genCopilot.js` script, use the following command:

```sh
node genCopilot.js --path <projectPath> --actions <pathToActionsFile> --key <yourOpenAIKey> --endpoint <yourEndpoint> --deployment <yourDeployment>
```

### Parameters

- path: Specifies the directory where the GitHub repository should be cloned and the setup tasks should be performed.
- actions: Specifies the path of the actions plan to start the generation from. If omitted it uses the default action plan that is in template.
- key: Your Azure OpenAI API key.
- endpoint: Endpoint to your Azure Open AI resource
- deployment: Your Azure OpenAI API deployment name.

### Example

```sh
node genCopilot.js --path "c:\repos\generatedcopilot" -actions "c:\samples\actionplan.json" --key "123456" --endpoint https://sample.openai.azure.com --deployment gpt-4
```

## Script Details

The genCopilot.js script performs the following tasks:

1. Parse Command-Line Arguments: Uses minimist to parse the --path, --actions, --openAIKey, and --deployment flags.
1. Check and Create Directory: Checks if the specified directory exists. If not, it creates the directory.
1. Clone GitHub Repository: Clones a specified GitHub repository into the provided directory.
1. Create Secrets File: Creates a secrets file with the provided OpenAI key and deployment information.
1. Setup Paths: Sets up various paths for actions and source files.
1. Read Actions File: Reads the actions file from the specified path. It will use actionsplan if defined and copy it to project. If not defined it will use the default on. 
1. Generate Code for Actions: Processes the actions to generate code.

## Error Handling

If the --path flag is not provided, the script will output an error message and exit.
If there are any issues during the cloning process, the script will output the error message.


## Sample actions plan

In this repo in [sample action plan](./sample/actions.lights.json) you can find sample custom action plan that you can use.

```json
[
    {
        "name": "GetProductInfo",
        "description": "Get information about a defined product",
        "parameters": {
            "type": "object",
            "properties": {
                "productId": {
                    "type": "string",
                    "description": "The ID of the product to get information about"
                }
            },
            "required": [
                "productId"
            ]
        }
    },
    {
        "name": "ListProducts",
        "description": "List all products",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "The maximum number of products to return"
                }
            }
        }
    }
]
```

## Conclusion

The genCopilot.js script is a powerful tool for automating project setup tasks. By specifying the --path, --openAIKey, and --deployment parameters, you can easily clone a GitHub repository and perform additional setup tasks in the specified directory.
