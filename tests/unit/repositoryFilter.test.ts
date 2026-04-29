import { matchesFilter, applyFilter } from "../../src/common/repositoryFilter";
import { GitRepository } from "azure-devops-extension-api/Git";

function makeRepo(name: string): GitRepository {
    return { name } as GitRepository;
}

describe('matchesFilter', () => {
    describe('empty pattern', () => {
        it('matches any name', () => {
            expect(matchesFilter('my-repo', '')).toBe(true);
            expect(matchesFilter('', '')).toBe(true);
        });
    });

    describe('substring match (no wildcard)', () => {
        it('matches when name contains pattern', () => {
            expect(matchesFilter('authentication-service', 'auth')).toBe(true);
        });

        it('does not match when name lacks pattern', () => {
            expect(matchesFilter('payment-api', 'auth')).toBe(false);
        });

        it('is case insensitive', () => {
            expect(matchesFilter('Auth-Service', 'auth')).toBe(true);
            expect(matchesFilter('auth-service', 'AUTH')).toBe(true);
        });

        it('matches full name', () => {
            expect(matchesFilter('auth', 'auth')).toBe(true);
        });
    });

    describe('wildcard match', () => {
        it('matches prefix with trailing star', () => {
            expect(matchesFilter('auth-service', 'auth*')).toBe(true);
            expect(matchesFilter('my-auth-service', 'auth*')).toBe(false);
        });

        it('matches suffix with leading star', () => {
            expect(matchesFilter('my-auth-service', '*service')).toBe(true);
            expect(matchesFilter('service-my', '*service')).toBe(false);
        });

        it('matches substring with surrounding stars', () => {
            expect(matchesFilter('my-auth-service', '*auth*')).toBe(true);
            expect(matchesFilter('payment-api', '*auth*')).toBe(false);
        });

        it('matches entire name with lone star', () => {
            expect(matchesFilter('any-repo', '*')).toBe(true);
            expect(matchesFilter('', '*')).toBe(true);
        });

        it('is case insensitive', () => {
            expect(matchesFilter('Auth-Service', 'auth*')).toBe(true);
            expect(matchesFilter('my-AUTH-service', '*auth*')).toBe(true);
        });

        it('supports multi-segment wildcard patterns', () => {
            expect(matchesFilter('auth-web-service', 'auth*service')).toBe(true);
            expect(matchesFilter('auth-service-web', 'auth*service')).toBe(false);
        });

        it('treats regex special characters as literals', () => {
            expect(matchesFilter('repo.backend', 'repo.backend')).toBe(true);
            expect(matchesFilter('repo-backend', 'repo.backend')).toBe(false);
            expect(matchesFilter('repo.backend', 'repo.*')).toBe(true);
            expect(matchesFilter('repo-backend', 'repo.*')).toBe(false);
        });
    });
});

describe('applyFilter', () => {
    const repos = [
        makeRepo('auth-service'),
        makeRepo('payment-api'),
        makeRepo('auth-backend'),
        makeRepo('frontend'),
    ];

    it('returns all repos for empty pattern', () => {
        expect(applyFilter(repos, '')).toHaveLength(4);
    });

    it('filters by substring', () => {
        const result = applyFilter(repos, 'auth');
        expect(result).toHaveLength(2);
        expect(result.map(r => r.name)).toEqual(['auth-service', 'auth-backend']);
    });

    it('filters by wildcard prefix', () => {
        const result = applyFilter(repos, '*api');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('payment-api');
    });

    it('returns empty array when nothing matches', () => {
        expect(applyFilter(repos, 'xyz')).toHaveLength(0);
    });

    it('returns empty array unchanged for empty input', () => {
        expect(applyFilter([], 'auth')).toHaveLength(0);
    });
});
