import "./Pivot.css";
import 'azure-devops-ui/Core/override.css';
import 'azure-devops-ui/Core/core.css';

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { showRootComponent } from "../common/Common";
import { applyFilter } from "../common/repositoryFilter";
import { buildProjectNodes, applyFilterToTree, projectWebUrl, ProjectNode } from "../common/treeUtils";
import { repoNameCell } from "../common/repoUtils";
import { formatRelativeDate } from "../common/dateUtils";
import { RepoTreeView } from "./RepoTreeView";

import { getClient, IHostNavigationService, CommonServiceIds } from "azure-devops-extension-api";
import { CoreRestClient, TeamProjectReference } from "azure-devops-extension-api/Core";
import { GitRestClient, GitRepository } from "azure-devops-extension-api/Git";

import { Table, ITableColumn, ITableRow, renderSimpleCellValue, ColumnSorting, sortItems, SortOrder } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ISimpleListCell } from "azure-devops-ui/List";
import { Card } from "azure-devops-ui/Card";
import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Pill, PillSize, PillVariant } from 'azure-devops-ui/Pill';
import { TextField } from "azure-devops-ui/TextField";
import { Button } from "azure-devops-ui/Button";

type ViewMode = "list" | "tree";

interface IPivotContentState {
    projects?: ArrayItemProvider<TeamProjectReference>;
    gitRepos?: ArrayItemProvider<GitRepository>;
    columns: ITableColumn<GitRepository>[];
    nbrRepos: number;
    filterText: string;
    viewMode: ViewMode;
    expandedProjects: Set<string>;
    filterExpandedProjects: Set<string>;
}

class PivotContent extends React.Component<{}, IPivotContentState> {
    private repositories: GitRepository[] = [];
    private allProjectNodes: ProjectNode[] = [];
    private navigationService?: IHostNavigationService;
    private _mounted = false;
    private lastPushByRepoId: Map<string, Date | null> = new Map();

    // Column indices: 0=name, 1=project, 2=lastPush, 3=size
    private sortFunctions: Array<(a: GitRepository, b: GitRepository) => number> = [
        (a, b) => a.name.localeCompare(b.name),
        (a, b) => a.project.name.localeCompare(b.project.name),
        (a, b) => (this.lastPushByRepoId.get(a.id)?.getTime() ?? -1) - (this.lastPushByRepoId.get(b.id)?.getTime() ?? -1),
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
                        return renderSimpleCellValue<any>(columnIndex, tableColumn, repoNameCell(tableItem));
                    },
                    width: -1
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
                    id: "lastPush",
                    name: "Last push",
                    sortProps: {},
                    renderCell: (rowIndex, columnIndex, tableColumn, tableItem): JSX.Element => {
                        return renderSimpleCellValue<any>(columnIndex, tableColumn, formatRelativeDate(this.lastPushByRepoId.get(tableItem.id)));
                    },
                    width: 130
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
            filterText: "",
            viewMode: "list",
            expandedProjects: new Set(),
            filterExpandedProjects: new Set()
        };
    }

    public componentDidMount() {
        this._mounted = true;
        SDK.init();
        this.initializeComponent();
    }

    public componentWillUnmount() {
        this._mounted = false;
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
        this.allProjectNodes = buildProjectNodes(this.repositories);

        this.setState({
            projects: new ArrayItemProvider(projects),
            gitRepos: new ArrayItemProvider([...this.repositories]),
            nbrRepos: this.repositories.length,
            expandedProjects: new Set(this.allProjectNodes.map(n => n.projectId))
        });

        this.loadPushDates(this.repositories);
    }

    private async loadPushDates(repos: GitRepository[]): Promise<void> {
        const BATCH_SIZE = 50;
        for (let i = 0; i < repos.length; i += BATCH_SIZE) {
            if (!this._mounted) return;
            const batch = repos.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(
                batch.map(async (repo): Promise<{ id: string; date: Date | null }> => {
                    try {
                        const pushes = await getClient(GitRestClient).getPushes(repo.id, repo.project.name, undefined, 1);
                        return { id: repo.id, date: pushes.length > 0 ? pushes[0].date : null };
                    } catch {
                        return { id: repo.id, date: null };
                    }
                })
            );
            if (!this._mounted) return;
            results.forEach(({ id, date }) => this.lastPushByRepoId.set(id, date));
            const filtered = applyFilter(this.repositories, this.state.filterText);
            this.setState({ gitRepos: new ArrayItemProvider(filtered) });
        }
    }

    private onRowActivate = (event: React.SyntheticEvent<HTMLElement>, row: ITableRow<GitRepository>) => {
        this.navigationService?.navigate(row.data.webUrl);
    };

    private onFilterChange = (_: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string) => {
        const filtered = applyFilter(this.repositories, value);

        const filterExpandedProjects = value
            ? new Set(applyFilterToTree(this.allProjectNodes, value).map(n => n.projectId))
            : new Set<string>();

        this.setState({
            filterText: value,
            gitRepos: new ArrayItemProvider(filtered),
            nbrRepos: filtered.length,
            filterExpandedProjects
        });
    };

    private onToggleViewMode = (mode: ViewMode) => {
        this.setState({ viewMode: mode });
    };

    private onToggleProject = (projectId: string) => {
        this.setState(prevState => {
            const next = new Set(prevState.expandedProjects);
            next.has(projectId) ? next.delete(projectId) : next.add(projectId);
            return { expandedProjects: next };
        });
    };

    private pillContent(): string | number {
        const { filterText, nbrRepos } = this.state;
        if (filterText) {
            return `${nbrRepos} of ${this.repositories.length}`;
        }
        return this.repositories.length;
    }

    private activeExpandedProjects(): Set<string> {
        return this.state.filterText
            ? this.state.filterExpandedProjects
            : this.state.expandedProjects;
    }

    public render(): JSX.Element {
        const { viewMode, filterText, gitRepos } = this.state;
        const isFiltering = filterText !== "";

        return (
            <Surface background={SurfaceBackground.neutral}>
                <Page className="page-pivot flex-grow">

                    <Header
                        title={
                        <div className="flex-row flex-center rhythm-horizontal-8">
                            <span>My repositories</span>
                            <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                                {this.pillContent()}
                            </Pill>
                        </div>
                        }
                        titleSize={TitleSize.Large}
                    />

                    <div className="git-list-pivot">
                        <div className="repo-filter repo-filter--with-toggle">
                            <TextField
                                value={filterText}
                                onChange={this.onFilterChange}
                                placeholder="Filter repositories..."
                                prefixIconProps={{ iconName: "Filter" }}
                            />
                            <div className="view-toggle-buttons">
                                <div className={`view-toggle-wrapper${viewMode === "list" ? " view-toggle-wrapper--active" : ""}`}>
                                    <Button
                                        subtle={true}
                                        iconProps={{ iconName: "BulletedList" }}
                                        ariaLabel="List view"
                                        ariaPressed={viewMode === "list"}
                                        onClick={() => this.onToggleViewMode("list")}
                                    />
                                </div>
                                <div className={`view-toggle-wrapper${viewMode === "tree" ? " view-toggle-wrapper--active" : ""}`}>
                                    <Button
                                        subtle={true}
                                        iconProps={{ iconName: "Group" }}
                                        ariaLabel="Tree view"
                                        ariaPressed={viewMode === "tree"}
                                        onClick={() => this.onToggleViewMode("tree")}
                                    />
                                </div>
                            </div>
                        </div>

                        {!gitRepos && <p>Loading...</p>}

                        {gitRepos && viewMode === "list" && (
                            <Card className="flex-column bolt-table-card bolt-card-white" contentProps={{ contentPadding: false }}>
                                <Table
                                    behaviors={[this.sortingBehavior]}
                                    columns={this.state.columns}
                                    itemProvider={gitRepos}
                                    singleClickActivation={true}
                                    onActivate={this.onRowActivate}
                                />
                            </Card>
                        )}

                        {gitRepos && viewMode === "tree" && (
                            <RepoTreeView
                                nodes={applyFilterToTree(this.allProjectNodes, filterText)}
                                expandedProjects={this.activeExpandedProjects()}
                                onToggleProject={this.onToggleProject}
                                onNavigateToRepo={(url) => this.navigationService?.navigate(url)}
                                filterActive={isFiltering}
                                lastPushByRepoId={this.lastPushByRepoId}
                            />
                        )}
                    </div>

                </Page>
            </Surface>
        );
    }
}

showRootComponent(<PivotContent />);
