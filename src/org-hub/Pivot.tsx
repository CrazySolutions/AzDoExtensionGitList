import "./Pivot.css";
import 'azure-devops-ui/Core/override.css';
import 'azure-devops-ui/Core/core.css';

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { showRootComponent } from "../common/Common";

import { getClient, IHostNavigationService, CommonServiceIds } from "azure-devops-extension-api";
import { CoreRestClient, TeamProjectReference } from "azure-devops-extension-api/Core";
import { GitRestClient, GitRepository } from "azure-devops-extension-api/Git";

import { Table, ITableColumn, ITableRow, renderSimpleCellValue, ColumnSorting, sortItems, SortOrder } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISimpleListCell } from "azure-devops-ui/List";
import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";

interface IPivotContentState {
    projects?: ArrayItemProvider<TeamProjectReference>;
    gitRepos?: ArrayItemProvider<GitRepository>;
    columns: ITableColumn<GitRepository>[];
    nbrRepos: number;
}

function projectWebUrl(repo: GitRepository): string {
    const gitIndex = repo.webUrl.indexOf("/_git/");
    return gitIndex !== -1 ? repo.webUrl.substring(0, gitIndex) : repo.webUrl;
}

class PivotContent extends React.Component<{}, IPivotContentState> {
    private repositories: GitRepository[] = [];
    private navigationService?: IHostNavigationService;

    private sortFunctions: Array<(a: GitRepository, b: GitRepository) => number> = [
        (a, b) => a.name.localeCompare(b.name),
        (a, b) => a.project.name.localeCompare(b.project.name),
        (a, b) => (Number.isNaN(a.size) ? 0 : a.size) - (Number.isNaN(b.size) ? 0 : b.size)
    ];

    private sortingBehavior = new ColumnSorting<GitRepository>((columnIndex, sortOrder) => {
        sortItems(columnIndex, sortOrder, this.sortFunctions, this.state.columns, this.repositories);
        this.setState({
            gitRepos: new ArrayItemProvider([...this.repositories]),
            columns: [...this.state.columns]
        });
    });

    constructor(props: {}) {
        super(props);

        this.state = {
            columns: [
                {
                    id: "name",
                    name: "Repository",
                    sortProps: { sortOrder: SortOrder.ascending },
                    renderCell: (rowIndex, columnIndex, tableColumn, tableItem): JSX.Element => {
                        const content: ISimpleListCell = { href: tableItem.webUrl, text: tableItem.name };
                        return renderSimpleCellValue<any>(columnIndex, tableColumn, content);
                    },
                    width: 700
                },
                {
                    id: "project",
                    name: "Project",
                    sortProps: {},
                    renderCell: (rowIndex, columnIndex, tableColumn, tableItem): JSX.Element => {
                        const content: ISimpleListCell = { href: projectWebUrl(tableItem), text: tableItem.project.name };
                        return renderSimpleCellValue<any>(columnIndex, tableColumn, content);
                    },
                    width: 200
                },
                {
                    id: "size",
                    name: "Size",
                    sortProps: {},
                    renderCell: (rowIndex, columnIndex, tableColumn, tableItem): JSX.Element => {
                        const rawSize = Number.isNaN(tableItem.size) ? 0 : tableItem.size;
                        let size = rawSize / 1000000;
                        const suffix = size > 1000 ? (size /= 1000, "GB") : "MB";
                        return renderSimpleCellValue<any>(columnIndex, tableColumn, size.toFixed(2) + suffix);
                    },
                    width: 120
                }
            ],
            nbrRepos: 0
        };
    }

    public componentDidMount() {
        SDK.init();
        this.initializeComponent();
    }

    private async initializeComponent() {
        this.navigationService = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);

        const projects = await getClient(CoreRestClient).getProjects();
        let repositories: GitRepository[] = [];
        for (const project of projects) {
            const repos = await getClient(GitRestClient).getRepositories(project.name);
            repositories = repositories.concat(repos);
        }

        this.repositories = sortItems(0, SortOrder.ascending, this.sortFunctions, this.state.columns, repositories);

        this.setState({
            projects: new ArrayItemProvider(projects),
            gitRepos: new ArrayItemProvider([...this.repositories]),
            nbrRepos: this.repositories.length
        });
    }

    private onRowActivate = (event: React.SyntheticEvent<HTMLElement>, row: ITableRow<GitRepository>) => {
        this.navigationService?.navigate(row.data.webUrl);
    };

    public render(): JSX.Element {
        return (
            <Surface background={SurfaceBackground.neutral}>
                <Page className="page-pivot flex-grow">

                    <Header title={"My repositories (" + this.state.nbrRepos + ")"}
                        titleSize={TitleSize.Medium} />

                    <div className="git-list-pivot">
                        {!this.state.gitRepos && <p>Loading...</p>}
                        {this.state.gitRepos &&
                            <Table
                                behaviors={[this.sortingBehavior]}
                                columns={this.state.columns}
                                itemProvider={this.state.gitRepos}
                                singleClickActivation={true}
                                onActivate={this.onRowActivate}
                            />
                        }
                    </div>

                </Page>
            </Surface>
        );
    }
}

showRootComponent(<PivotContent />);
