import { GitRepository } from "azure-devops-extension-api/Git";

function wildcardToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}`, 'i');
}

export function matchesFilter(name: string, pattern: string): boolean {
    if (!pattern) return true;
    if (pattern.includes('*')) {
        return wildcardToRegex(pattern).test(name);
    }
    return name.toLowerCase().includes(pattern.toLowerCase());
}

export function applyFilter(repos: GitRepository[], pattern: string): GitRepository[] {
    if (!pattern) return repos;
    return repos.filter(repo => matchesFilter(repo.name, pattern));
}
