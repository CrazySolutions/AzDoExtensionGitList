# Azure DevOps Extension: Git List

This repository generates an [Azure DevOps extension](https://docs.microsoft.com/en-us/azure/devops/extend/overview?view=vsts) containing different contributions to list git repositories.

## Dependencies

The repository depends on a few Azure DevOps packages:

- [azure-devops-extension-sdk](https://github.com/Microsoft/azure-devops-extension-sdk): Required module for Azure DevOps extensions which allows communication between the host page and the extension iframe.
- [azure-devops-extension-api](https://github.com/Microsoft/azure-devops-extension-api): Contains REST client libraries for the various Azure DevOps feature areas.
- [azure-devops-ui](https://developer.microsoft.com/azure-devops): UI library containing the React components used in the Azure DevOps web UI.

Some external dependencies:
- `React` - Is used to render the UI and is a dependency of `azure-devops-ui`.
- `TypeScript` - Project is written in TypeScript and compiled to JavaScript
- `CSS` - Extension is styled using plain CSS, delivered in webpack bundles.
- `webpack` - Is used to gather dependencies into a single javascript bundle for each product.

You must also have tfx-cli installed:

    npm install -g tfx-cli

## Building the project

First the project needs to be initialized with the command:

    npm install

To build an executable run:

    npm run build

This produces a .vsix file which can be uploaded to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/azuredevops)

## Testing

Run the unit test suite with:

    npm test

To generate a coverage report (minimum 80% line coverage is enforced):

    npm run test:coverage

# Content

## My repositories (organisation level)

Available from the collection/organisation start page, this hub lists every git repository across all projects the current user has access to. Columns show the repository name, the project it belongs to, and its size. All columns are sortable.

## Repository list (project level)

Available under the Repos section inside each project, this hub lists all git repositories within that project. Columns show the repository name and its size. All columns are sortable.

## Filtering

Both hubs provide a filter input at the top of the page to narrow the repository list by name:

- **Plain text** — case-insensitive substring match. Typing `auth` shows all repositories whose name contains "auth".
- **Wildcard (`*`)** — glob-style matching. `auth*` matches names starting with "auth"; `*-service` matches names that contain "-service".

The count pill next to the hub title reflects the current view — `42` when unfiltered, `5 of 42` when a filter is active.

# References

The full set of documentation for developing extensions can be found at [https://docs.microsoft.com/en-us/azure/devops/extend](https://docs.microsoft.com/en-us/azure/devops/extend/?view=vsts).
