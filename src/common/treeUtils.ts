import { GitRepository } from "azure-devops-extension-api/Git";
import { applyFilter } from "./repositoryFilter";

export interface ProjectNode {
    projectId: string;
    projectName: string;
    projectUrl: string;
    repos: GitRepository[];
    filteredRepos: GitRepository[];
}

export function projectWebUrl(repo: GitRepository): string {
    const gitIndex = repo.webUrl.indexOf("/_git/");
    return gitIndex !== -1 ? repo.webUrl.substring(0, gitIndex) : repo.webUrl;
}

export function buildProjectNodes(repos: GitRepository[]): ProjectNode[] {
    const map = new Map<string, ProjectNode>();

    for (const repo of repos) {
        const id = repo.project.id;
        if (!map.has(id)) {
            map.set(id, {
                projectId: id,
                projectName: repo.project.name,
                projectUrl: projectWebUrl(repo),
                repos: [],
                filteredRepos: []
            });
        }
        map.get(id)!.repos.push(repo);
    }

    const nodes = Array.from(map.values());
    for (const node of nodes) {
        node.repos.sort((a, b) => a.name.localeCompare(b.name));
        node.filteredRepos = [...node.repos];
    }
    nodes.sort((a, b) => a.projectName.localeCompare(b.projectName));

    return nodes;
}

export function applyFilterToTree(nodes: ProjectNode[], pattern: string): ProjectNode[] {
    if (!pattern) {
        return nodes.map(node => ({ ...node, filteredRepos: node.repos }));
    }

    return nodes
        .map(node => ({ ...node, filteredRepos: applyFilter(node.repos, pattern) }))
        .filter(node => node.filteredRepos.length > 0);
}
