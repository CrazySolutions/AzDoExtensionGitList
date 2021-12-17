# Azure DevOps Extension: Git List

This repository generates an [Azure DevOps extension](https://docs.microsoft.com/en-us/azure/devops/extend/overview?view=vsts) containing different contributions to list git repositories.

## Dependencies

The repository depends on a few Azure DevOps packages:

- [azure-devops-extension-sdk](https://github.com/Microsoft/azure-devops-extension-sdk): Required module for Azure DevOps extensions which allows communication between the host page and the extension iframe.
- [azure-devops-extension-api](https://github.com/Microsoft/azure-devops-extension-api): Contains REST client libraries for the various Azure DevOps feature areas.
- [azure-devops-ui](https://developer.microsoft.com/azure-devops): UI library containing the React components used in the Azure DevOps web UI.

Some external dependencies:
- `React` - Is used to render the UI and is a dependency of `azure-devops-ui`.
- `TypeScript` - Project is written in TypeScript and complied to JavaScript
- `SASS` - Extension is styled using SASS (which is compiled to CSS and delivered in webpack js bundles).
- `webpack` - Is used to gather dependencies into a single javascript bundle for each product.

You must also have tfx-cli installed:

    npm install -g tfx-cli

## Building the project

First the project needs to be initialized with the command:

    npm install

To build an executable run:

    npm run build

This produces a .vsix file which can be uploaded to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/azuredevops)

# Content

## Pivot

Lists all git repositories in all projects the user has access to as a pivot on the collection level.

## ServiceHub

Lists all git repositories in the current project.

# References

The full set of documentation for developing extensions can be found at [https://docs.microsoft.com/en-us/azure/devops/extend](https://docs.microsoft.com/en-us/azure/devops/extend/?view=vsts).
