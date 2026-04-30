import * as React from "react";
import { GitRepository } from "azure-devops-extension-api/Git";
import { ProjectNode } from "../common/treeUtils";
import { repoNameCell } from "../common/repoUtils";
import { formatRelativeDate } from "../common/dateUtils";
import { Card } from "azure-devops-ui/Card";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { Table, ITableColumn, ITableRow, renderSimpleCellValue } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";

type TreeItem =
    | { kind: "project"; node: ProjectNode; expanded: boolean }
    | { kind: "repo"; repo: GitRepository };

export interface IRepoTreeViewProps {
    nodes: ProjectNode[];
    expandedProjects: Set<string>;
    onToggleProject: (projectId: string) => void;
    onNavigateToRepo: (url: string) => void;
    filterActive: boolean;
    lastPushByRepoId: Map<string, Date | null>;
}

function formatSize(bytes: number): string {
    const raw = Number.isNaN(bytes) ? 0 : bytes;
    let size = raw / 1000000;
    if (size > 1000) {
        return (size / 1000).toFixed(2) + "GB";
    }
    return size.toFixed(2) + "MB";
}

function projectPillContent(node: ProjectNode, filterActive: boolean): string | number {
    if (filterActive && node.filteredRepos.length !== node.repos.length) {
        return `${node.filteredRepos.length} of ${node.repos.length}`;
    }
    return node.filteredRepos.length;
}

function buildFlatItems(nodes: ProjectNode[], expandedProjects: Set<string>): TreeItem[] {
    const items: TreeItem[] = [];
    for (const node of nodes) {
        const expanded = expandedProjects.has(node.projectId);
        items.push({ kind: "project", node, expanded });
        if (expanded) {
            for (const repo of node.filteredRepos) {
                items.push({ kind: "repo", repo });
            }
        }
    }
    return items;
}

function buildColumns(
    filterActive: boolean,
    lastPushByRepoId: Map<string, Date | null>
): ITableColumn<TreeItem>[] {
    return [
        {
            id: "name",
            name: "Repository",
            renderCell: (_rowIndex, columnIndex, tableColumn, item) => {
                if (item.kind === "project") {
                    const content = {
                        textNode: (
                            <div className="tree-project-cell">
                                <Icon iconName={item.expanded ? "ChevronDown" : "ChevronRight"} className="flex-noshrink" />
                                <Icon iconName="Folder" className="flex-noshrink" />
                                <span className="tree-project-name">{item.node.projectName}</span>
                                <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                                    {projectPillContent(item.node, filterActive)}
                                </Pill>
                            </div>
                        )
                    };
                    return renderSimpleCellValue<any>(columnIndex, tableColumn, content);
                }
                return renderSimpleCellValue<any>(columnIndex, tableColumn, repoNameCell(item.repo, true));
            },
            width: -1
        },
        {
            id: "lastPush",
            name: "Last push",
            renderCell: (_rowIndex, columnIndex, tableColumn, item) => {
                if (item.kind === "project") {
                    return renderSimpleCellValue<any>(columnIndex, tableColumn, "");
                }
                return renderSimpleCellValue<any>(columnIndex, tableColumn, formatRelativeDate(lastPushByRepoId.get(item.repo.id)));
            },
            width: 130
        },
        {
            id: "size",
            name: "Size",
            renderCell: (_rowIndex, columnIndex, tableColumn, item) => {
                if (item.kind === "project") {
                    return renderSimpleCellValue<any>(columnIndex, tableColumn, "");
                }
                return renderSimpleCellValue<any>(columnIndex, tableColumn, formatSize(item.repo.size));
            },
            width: 80
        }
    ];
}

export function RepoTreeView({ nodes, expandedProjects, onToggleProject, onNavigateToRepo, filterActive, lastPushByRepoId }: IRepoTreeViewProps): JSX.Element {
    const items = buildFlatItems(nodes, expandedProjects);
    const columns = buildColumns(filterActive, lastPushByRepoId);

    const onActivate = (_event: React.SyntheticEvent<HTMLElement>, row: ITableRow<TreeItem>) => {
        const item = row.data;
        if (item.kind === "project") {
            onToggleProject(item.node.projectId);
        } else {
            onNavigateToRepo(item.repo.webUrl);
        }
    };

    return (
        <Card className="flex-column bolt-table-card bolt-card-white" contentProps={{ contentPadding: false }}>
            <Table<TreeItem>
                columns={columns}
                itemProvider={new ArrayItemProvider(items)}
                singleClickActivation={true}
                onActivate={onActivate}
            />
        </Card>
    );
}
