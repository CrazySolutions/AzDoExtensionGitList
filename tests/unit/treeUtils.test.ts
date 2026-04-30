import { buildProjectNodes, applyFilterToTree, projectWebUrl, ProjectNode } from "../../src/common/treeUtils";
import { GitRepository } from "azure-devops-extension-api/Git";

function makeRepo(name: string, projectId: string, projectName: string, webUrl: string = `https://dev.azure.com/org/${projectName}/_git/${name}`, size: number = 0): GitRepository {
    return {
        id: `${projectId}-${name}`,
        name,
        webUrl,
        size,
        project: { id: projectId, name: projectName }
    } as unknown as GitRepository;
}

describe('projectWebUrl', () => {
    it('strips the /_git/ segment and everything after', () => {
        const repo = makeRepo('my-repo', 'p1', 'ProjectOne', 'https://dev.azure.com/org/ProjectOne/_git/my-repo');
        expect(projectWebUrl(repo)).toBe('https://dev.azure.com/org/ProjectOne');
    });

    it('returns the webUrl unchanged when no /_git/ segment exists', () => {
        const repo = makeRepo('my-repo', 'p1', 'ProjectOne', 'https://dev.azure.com/org/ProjectOne');
        expect(projectWebUrl(repo)).toBe('https://dev.azure.com/org/ProjectOne');
    });
});

describe('buildProjectNodes', () => {
    it('returns an empty array for empty input', () => {
        expect(buildProjectNodes([])).toEqual([]);
    });

    it('creates one node per unique project', () => {
        const repos = [
            makeRepo('repo-a', 'p1', 'Alpha'),
            makeRepo('repo-b', 'p2', 'Beta'),
        ];
        expect(buildProjectNodes(repos)).toHaveLength(2);
    });

    it('groups repos from the same project into one node', () => {
        const repos = [
            makeRepo('repo-a', 'p1', 'Alpha'),
            makeRepo('repo-b', 'p1', 'Alpha'),
        ];
        const nodes = buildProjectNodes(repos);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].repos).toHaveLength(2);
    });

    it('sets projectId and projectName from the repo project', () => {
        const repos = [makeRepo('repo-a', 'proj-42', 'MyProject')];
        const nodes = buildProjectNodes(repos);
        expect(nodes[0].projectId).toBe('proj-42');
        expect(nodes[0].projectName).toBe('MyProject');
    });

    it('derives projectUrl by stripping the /_git/ segment', () => {
        const repos = [makeRepo('repo-a', 'p1', 'Alpha', 'https://dev.azure.com/org/Alpha/_git/repo-a')];
        const nodes = buildProjectNodes(repos);
        expect(nodes[0].projectUrl).toBe('https://dev.azure.com/org/Alpha');
    });

    it('sorts project nodes alphabetically by name', () => {
        const repos = [
            makeRepo('repo', 'p3', 'Zeta'),
            makeRepo('repo', 'p1', 'Alpha'),
            makeRepo('repo', 'p2', 'Mu'),
        ];
        const names = buildProjectNodes(repos).map(n => n.projectName);
        expect(names).toEqual(['Alpha', 'Mu', 'Zeta']);
    });

    it('sorts repos within each project alphabetically by name', () => {
        const repos = [
            makeRepo('zebra', 'p1', 'Alpha'),
            makeRepo('apple', 'p1', 'Alpha'),
            makeRepo('mango', 'p1', 'Alpha'),
        ];
        const repoNames = buildProjectNodes(repos)[0].repos.map(r => r.name);
        expect(repoNames).toEqual(['apple', 'mango', 'zebra']);
    });

    it('sets filteredRepos equal to repos initially', () => {
        const repos = [makeRepo('repo-a', 'p1', 'Alpha'), makeRepo('repo-b', 'p1', 'Alpha')];
        const nodes = buildProjectNodes(repos);
        expect(nodes[0].filteredRepos).toEqual(nodes[0].repos);
    });
});

describe('applyFilterToTree', () => {
    let nodes: ProjectNode[];

    beforeEach(() => {
        nodes = buildProjectNodes([
            makeRepo('auth-service', 'p1', 'Alpha'),
            makeRepo('payment-api', 'p1', 'Alpha'),
            makeRepo('auth-backend', 'p2', 'Beta'),
            makeRepo('frontend', 'p2', 'Beta'),
        ]);
    });

    it('returns all nodes with all repos for an empty pattern', () => {
        const result = applyFilterToTree(nodes, '');
        expect(result).toHaveLength(2);
        expect(result[0].filteredRepos).toHaveLength(2);
        expect(result[1].filteredRepos).toHaveLength(2);
    });

    it('filters repos within each node by the pattern', () => {
        const result = applyFilterToTree(nodes, 'auth');
        const alpha = result.find(n => n.projectName === 'Alpha')!;
        const beta = result.find(n => n.projectName === 'Beta')!;
        expect(alpha.filteredRepos.map(r => r.name)).toEqual(['auth-service']);
        expect(beta.filteredRepos.map(r => r.name)).toEqual(['auth-backend']);
    });

    it('excludes project nodes where no repos match', () => {
        const result = applyFilterToTree(nodes, 'payment');
        expect(result).toHaveLength(1);
        expect(result[0].projectName).toBe('Alpha');
    });

    it('returns an empty array when no repos match at all', () => {
        expect(applyFilterToTree(nodes, 'xyz-no-match')).toHaveLength(0);
    });

    it('supports wildcard patterns', () => {
        const result = applyFilterToTree(nodes, 'auth*');
        expect(result).toHaveLength(2);
        result.forEach(node => {
            node.filteredRepos.forEach(repo => {
                expect(repo.name.toLowerCase()).toContain('auth');
            });
        });
    });

    it('does not mutate the original nodes', () => {
        const originalFilteredLength = nodes[0].filteredRepos.length;
        applyFilterToTree(nodes, 'auth');
        expect(nodes[0].filteredRepos.length).toBe(originalFilteredLength);
    });
});
