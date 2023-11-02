import "./Pivot.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { showRootComponent } from "../../Common";

import { getClient, IHostNavigationService, CommonServiceIds } from "azure-devops-extension-api";
import { CoreRestClient, ProjectVisibility, TeamProjectReference } from "azure-devops-extension-api/Core";
import { GitRestClient, GitRepository } from "azure-devops-extension-api/Git"

import { Table, ITableColumn, renderSimpleCell, renderSimpleCellValue, TableRow, ITableRow } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISimpleListCell } from "azure-devops-ui/List";
import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";

interface IPivotContentState {
    projects?: ArrayItemProvider<TeamProjectReference>;
    gitRepos?: ArrayItemProvider<GitRepository>;
    columns: ITableColumn<any>[];
    nbrRepos: Number;
}

class PivotContent extends React.Component<{}, IPivotContentState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            columns: [{
                id: "project",
                name: "Project",
                renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<GitRepository>, tableItem: GitRepository): JSX.Element => {
                    const content: ISimpleListCell = { text: tableItem.project.name }
                    return renderSimpleCellValue<any>(columnIndex, tableColumn, content);
                },
                width: 200
            },
            {
                id: "name",
                name: "Repository",
                renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<GitRepository>, tableItem: GitRepository): JSX.Element => {
                    const content: ISimpleListCell = { href: tableItem.webUrl, text: tableItem.name }
                    return renderSimpleCellValue<any>(columnIndex, tableColumn, content);
                },
                width: 700
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

    public componentDidMount() {
        SDK.init();
        this.initializeComponent();
    }

    private async initializeComponent() {
        const projects = await getClient(CoreRestClient).getProjects();
        var repositories = [] as GitRepository[];
        for (let i = 0; i < projects.length; i++) {
            const repos: GitRepository[] = await getClient(GitRestClient).getRepositories(projects[i].name);
            repositories = repositories.concat(repos);
        }
        //Sort the list in alphabetical on repository name
        repositories = repositories.sort((a, b) => {
            return a.name.localeCompare(b.name)
        });
        this.setState({
            projects: new ArrayItemProvider(projects),
            gitRepos: new ArrayItemProvider(repositories),
            nbrRepos: repositories.length
        });
    }

    public render(): JSX.Element {
        return (
            <Page className="page-pivot flex-grow">

                <Header title={"My repositories (" + this.state.nbrRepos + ")"}
                    titleSize={TitleSize.Medium} />

                <div className="git-list-pivot">
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

showRootComponent(<PivotContent />);
