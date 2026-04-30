import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { RepoTreeView } from "../../src/org-hub/RepoTreeView";
import { ProjectNode } from "../../src/common/treeUtils";
import { GitRepository } from "azure-devops-extension-api/Git";

jest.mock("azure-devops-ui/Card", () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>
}));

jest.mock("azure-devops-ui/Icon", () => ({
    Icon: ({ iconName, className }: any) => <span data-testid="icon" data-icon={iconName} className={className} />
}));

jest.mock("azure-devops-ui/Pill", () => ({
    Pill: ({ children }: any) => <span data-testid="pill">{children}</span>,
    PillSize: { compact: "compact" },
    PillVariant: { outlined: "outlined" }
}));

jest.mock("azure-devops-ui/Table", () => ({
    Table: ({ itemProvider, onActivate, columns }: any) => {
        const items: any[] = itemProvider.value;
        const nameCol = columns?.find((c: any) => c.id === "name");
        const lastPushCol = columns?.find((c: any) => c.id === "lastPush");
        return (
            <div data-testid="tree-table">
                {items.map((item: any, i: number) => {
                    const nameCell = nameCol?.renderCell?.(i, 0, nameCol, item);
                    if (item.kind === "project") {
                        return (
                            <div
                                key={item.node.projectId}
                                data-testid="project-row"
                                data-project-id={item.node.projectId}
                                data-expanded={String(item.expanded)}
                                onClick={() => onActivate?.({}, { data: item })}
                            >
                                {nameCell}
                            </div>
                        );
                    }
                    const lastPushCell = lastPushCol?.renderCell?.(i, 1, lastPushCol, item);
                    return (
                        <div
                            key={item.repo.id || i}
                            data-testid="repo-row"
                            onClick={() => onActivate?.({}, { data: item })}
                        >
                            {nameCell}
                            <span data-testid="last-push-cell">{lastPushCell}</span>
                        </div>
                    );
                })}
            </div>
        );
    },
    renderSimpleCellValue: (_colIdx: any, _tableCol: any, content: any) => {
        if (content?.textNode) {
            return <>{content.textNode}</>;
        }
        return <>{typeof content === "string" ? content : null}</>;
    }
}));

jest.mock("azure-devops-ui/Utilities/Provider", () => ({
    ArrayItemProvider: class {
        private _items: any[];
        constructor(items: any[]) { this._items = items; }
        get value() { return this._items; }
        get length() { return this._items.length; }
    }
}));

function makeRepo(name: string, id: string, overrides: Partial<GitRepository> = {}): GitRepository {
    return {
        id,
        name,
        webUrl: `https://dev.azure.com/org/proj/_git/${name}`,
        size: 1000000,
        isFork: false,
        isDisabled: false,
        isInMaintenance: false,
        ...overrides
    } as unknown as GitRepository;
}

function makeNode(projectId: string, projectName: string, repoNames: string[]): ProjectNode {
    const repos = repoNames.map((name, i) => makeRepo(name, `${projectId}-${i}`));
    return {
        projectId,
        projectName,
        projectUrl: `https://dev.azure.com/org/${projectName}`,
        repos,
        filteredRepos: repos
    };
}

let container: HTMLDivElement;

beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
});

afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
});

function render(ui: JSX.Element) {
    act(() => { ReactDOM.render(ui, container); });
}

const defaultProps = {
    expandedProjects: new Set<string>(),
    onToggleProject: () => {},
    onNavigateToRepo: () => {},
    filterActive: false,
    lastPushByRepoId: new Map<string, Date | null>()
};

describe('RepoTreeView', () => {
    const nodes = [
        makeNode('p1', 'Alpha', ['auth-service', 'payment-api']),
        makeNode('p2', 'Beta', ['frontend']),
    ];

    it('renders inside a Card', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} />);
        expect(container.querySelector('[data-testid="card"]')).not.toBeNull();
    });

    it('renders one project row per entry in nodes', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} />);
        expect(container.querySelectorAll('[data-testid="project-row"]')).toHaveLength(2);
    });

    it('renders a Folder icon for each project row', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} />);
        const projectRows = container.querySelectorAll('[data-testid="project-row"]');
        projectRows.forEach(row => {
            expect(row.querySelector('[data-testid="icon"][data-icon="Folder"]')).not.toBeNull();
        });
    });

    it('renders no repo rows when all projects are collapsed', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} />);
        expect(container.querySelectorAll('[data-testid="repo-row"]')).toHaveLength(0);
    });

    it('renders repo rows only for expanded projects', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} expandedProjects={new Set(['p1'])} />);
        expect(container.querySelectorAll('[data-testid="repo-row"]')).toHaveLength(2);
    });

    it('calls onToggleProject with the correct projectId when a project row is clicked', () => {
        const handler = jest.fn();
        render(<RepoTreeView nodes={nodes} {...defaultProps} onToggleProject={handler} />);
        act(() => {
            (container.querySelector('[data-testid="project-row"]') as HTMLElement).click();
        });
        expect(handler).toHaveBeenCalledWith('p1');
    });

    it('calls onNavigateToRepo when a repo row is activated', () => {
        const handler = jest.fn();
        render(<RepoTreeView nodes={nodes} {...defaultProps} expandedProjects={new Set(['p1'])} onNavigateToRepo={handler} />);
        act(() => {
            (container.querySelector('[data-testid="repo-row"]') as HTMLElement).click();
        });
        expect(handler).toHaveBeenCalledWith('https://dev.azure.com/org/proj/_git/auth-service');
    });

    it('renders ChevronDown icon for expanded projects and ChevronRight for collapsed', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} expandedProjects={new Set(['p1'])} />);
        const projectRows = container.querySelectorAll('[data-testid="project-row"]');
        expect(projectRows[0].querySelector('[data-icon="ChevronDown"]')).not.toBeNull();
        expect(projectRows[1].querySelector('[data-icon="ChevronRight"]')).not.toBeNull();
    });

    it('shows the repo name in each repo row', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} expandedProjects={new Set(['p1'])} />);
        const repoRows = container.querySelectorAll('[data-testid="repo-row"]');
        expect(repoRows[0].textContent).toContain('auth-service');
    });

    it('shows plain count in pill when filter is not active', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} />);
        const pills = container.querySelectorAll('[data-testid="pill"]');
        expect(pills[0].textContent).toBe('2');
    });

    it('shows "X of Y" in pill when filter is active and counts differ', () => {
        const filteredNodes = [{ ...nodes[0], filteredRepos: [nodes[0].repos[0]] }];
        render(<RepoTreeView nodes={filteredNodes} {...defaultProps} filterActive={true} />);
        const pill = container.querySelector('[data-testid="pill"]')!;
        expect(pill.textContent).toBe('1 of 2');
    });

    it('renders nothing inside the card when nodes is empty', () => {
        render(<RepoTreeView nodes={[]} {...defaultProps} />);
        expect(container.querySelectorAll('[data-testid="project-row"]')).toHaveLength(0);
    });

    it('shows "—" in last push cell when push date is not yet loaded', () => {
        render(<RepoTreeView nodes={nodes} {...defaultProps} expandedProjects={new Set(['p1'])} />);
        const lastPushCells = container.querySelectorAll('[data-testid="last-push-cell"]');
        expect(lastPushCells[0].textContent).toBe('—');
    });

    it('shows "Never" in last push cell when repo has no pushes', () => {
        const map = new Map<string, Date | null>([['p1-0', null]]);
        render(<RepoTreeView nodes={nodes} {...defaultProps} expandedProjects={new Set(['p1'])} lastPushByRepoId={map} />);
        const lastPushCells = container.querySelectorAll('[data-testid="last-push-cell"]');
        expect(lastPushCells[0].textContent).toBe('Never');
    });

    it('shows relative date in last push cell when push date is loaded', () => {
        const yesterday = new Date(Date.now() - 86_400_000);
        const map = new Map<string, Date | null>([['p1-0', yesterday]]);
        render(<RepoTreeView nodes={nodes} {...defaultProps} expandedProjects={new Set(['p1'])} lastPushByRepoId={map} />);
        const lastPushCells = container.querySelectorAll('[data-testid="last-push-cell"]');
        expect(lastPushCells[0].textContent).toBe('Yesterday');
    });

    it('shows Fork badge for forked repositories', () => {
        const forkNodes = [makeNode('p1', 'Alpha', [])];
        const forkRepo = makeRepo('forked-repo', 'p1-0', { isFork: true });
        forkNodes[0].repos = [forkRepo];
        forkNodes[0].filteredRepos = [forkRepo];
        render(<RepoTreeView nodes={forkNodes} {...defaultProps} expandedProjects={new Set(['p1'])} />);
        const repoRow = container.querySelector('[data-testid="repo-row"]')!;
        const pills = repoRow.querySelectorAll('[data-testid="pill"]');
        expect(Array.from(pills).some(p => p.textContent === 'Fork')).toBe(true);
    });

    it('shows Disabled badge for disabled repositories', () => {
        const disabledNodes = [makeNode('p1', 'Alpha', [])];
        const disabledRepo = makeRepo('disabled-repo', 'p1-0', { isDisabled: true });
        disabledNodes[0].repos = [disabledRepo];
        disabledNodes[0].filteredRepos = [disabledRepo];
        render(<RepoTreeView nodes={disabledNodes} {...defaultProps} expandedProjects={new Set(['p1'])} />);
        const repoRow = container.querySelector('[data-testid="repo-row"]')!;
        const pills = repoRow.querySelectorAll('[data-testid="pill"]');
        expect(Array.from(pills).some(p => p.textContent === 'Disabled')).toBe(true);
    });
});
