import "./ServiceHub.css";
import 'azure-devops-ui/Core/override.css';
import 'azure-devops-ui/Core/core.css';

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";

import { Table, ITableColumn, ITableRow, renderSimpleCellValue, ColumnSorting, sortItems, SortOrder } from "azure-devops-ui/Table";
import { showRootComponent } from "../common/Common";
import { applyFilter } from "../common/repositoryFilter";
import { GitRepository } from "azure-devops-extension-api/Git/Git";
import { CommonServiceIds, IHostNavigationService, IProjectPageService, getClient } from "azure-devops-extension-api";
import { ISimpleListCell } from "azure-devops-ui/List";
import { GitRestClient } from "azure-devops-extension-api/Git";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Pill, PillSize, PillVariant } from 'azure-devops-ui/Pill';
import { TextField } from "azure-devops-ui/TextField";

interface IRepositoryServiceHubContentState {
    gitRepos?: ArrayItemProvider<GitRepository>;
    columns: ITableColumn<GitRepository>[];
    nbrRepos: number;
    filterText: string;
}

class RepositoryServiceHubContent extends React.Component<{}, IRepositoryServiceHubContentState> {
    private repositories: GitRepository[] = [];
    private navigationService?: IHostNavigationService;

    private sortFunctions: Array<(a: GitRepository, b: GitRepository) => number> = [
        (a, b) => a.name.localeCompare(b.name),
        (a, b) => (Number.isNaN(a.size) ? 0 : a.size) - (Number.isNaN(b.size) ? 0 : b.size)
    ];

    private sortingBehavior = new ColumnSorting<GitRepository>((columnIndex, sortOrder) => {
        sortItems(columnIndex, sortOrder, this.sortFunctions, this.state.columns, this.repositories);
        const filtered = applyFilter(this.repositories, this.state.filterText);
        this.setState({
            gitRepos: new ArrayItemProvider(filtered),
            nbrRepos: filtered.length,
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
                    width: 900
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
            nbrRepos: 0,
            filterText: ""
        };
    }

    public async componentWillMount() {
        SDK.init();

        this.navigationService = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        let repos: GitRepository[] = [];
        if (project) {
            repos = await getClient(GitRestClient).getRepositories(project.name);
        }

        this.repositories = sortItems(0, SortOrder.ascending, this.sortFunctions, this.state.columns, repos);

        this.setState({
            gitRepos: new ArrayItemProvider([...this.repositories]),
            nbrRepos: this.repositories.length
        });
    }

    private onRowActivate = (event: React.SyntheticEvent<HTMLElement>, row: ITableRow<GitRepository>) => {
        this.navigationService?.navigate(row.data.webUrl);
    };

    private onFilterChange = (_: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string) => {
        const filtered = applyFilter(this.repositories, value);
        this.setState({
            filterText: value,
            gitRepos: new ArrayItemProvider(filtered),
            nbrRepos: filtered.length
        });
    };

    public render(): JSX.Element {
        return (
            <Surface background={SurfaceBackground.normal}>
                <Page className="sample-hub flex-grow">

                    <Header
                        title={
                        <div className="flex-row flex-center rhythm-horizontal-8">
                            <span>Git repositories</span>
                            <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                            {this.state.nbrRepos}
                            </Pill>
                        </div>
                        }
                        titleSize={TitleSize.Large}
                    />

                    <div className="git-list-hub">
                        <div className="repo-filter">
                            <TextField
                                value={this.state.filterText}
                                onChange={this.onFilterChange}
                                placeholder="Filter repositories..."
                                prefixIconProps={{ iconName: "Filter" }}
                            />
                        </div>
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

showRootComponent(<RepositoryServiceHubContent />);
