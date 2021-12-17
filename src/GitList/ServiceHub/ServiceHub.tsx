import "./ServiceHub.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";

import { Table, ITableColumn, renderSimpleCell, renderSimpleCellValue, TableRow, ITableRow } from "azure-devops-ui/Table";
import { showRootComponent } from "../../Common";
import { GitRepository } from "azure-devops-extension-api/Git/Git";
import { CommonServiceIds, IProjectPageService, getClient } from "azure-devops-extension-api";
import { ISimpleListCell } from "azure-devops-ui/List";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";

interface IRepositoryServiceHubContentState {
    gitRepos?: ArrayItemProvider<GitRepository>;
    columns: ITableColumn<any>[];
    nbrRepos: Number;
}

class RepositoryServiceHubContent extends React.Component<{}, IRepositoryServiceHubContentState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            columns: [{
                id: "name",
                name: "Repository",
                renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<GitRepository>, tableItem: GitRepository): JSX.Element => {
                    const content: ISimpleListCell = { href: tableItem.webUrl, text: tableItem.name }
                    return renderSimpleCellValue<any>(columnIndex, tableColumn, content);
                },
                width: 900
            },
            // {
            //     id: "remoteUrl",
            //     name: "Remote Url",
            //     renderCell: renderSimpleCell,
            //     width: 400
            // },
            {
                id: "size",
                name: "Size",
                renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<GitRepository>, tableItem: GitRepository): JSX.Element => {
                    var size = tableItem.size
                    if (size == NaN) {
                        size = 0
                    }
                    size = (tableItem.size / 1000000) //Size in MB
                    var suffix = "MB"
                    if (size > 1000) {
                        size = size / 1000
                        suffix = "GB"
                    }
                    return renderSimpleCellValue<any>(columnIndex, tableColumn, size.toFixed(2) + suffix);
                },
                width: 120
            }],
            nbrRepos: 0
        };
    }

    public async componentWillMount() {
        SDK.init();

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        var repos = [] as GitRepository[]
        if (project) {
            repos = await getClient(GitRestClient).getRepositories(project.name);
        }

        //Sort the list in alphabetical on repository name
        repos = repos.sort((a, b) => {
            return a.name.localeCompare(b.name)
        });

        this.setState({
            gitRepos: new ArrayItemProvider(repos),
            nbrRepos: repos.length
        });
    }

    public render(): JSX.Element {
        return (
            <Page className="sample-hub flex-grow">

                <Header title={"Git repositories (" + this.state.nbrRepos + ")"}
                titleSize={TitleSize.Medium} />

                <div className="git-list-hub">
                    {
                        !this.state.gitRepos &&
                        <p>Loading...</p>
                    }
                    {
                        this.state.gitRepos &&
                        <Table
                            columns={this.state.columns}
                            itemProvider={this.state.gitRepos}
                        />
                    }
                </div>
            </Page>
        );
    }
}

showRootComponent(<RepositoryServiceHubContent />);