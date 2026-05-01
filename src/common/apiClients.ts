import { GitRestClient } from "azure-devops-extension-api/Git";
import { GitPush, GitPushSearchCriteria, GitRepository } from "azure-devops-extension-api/Git/Git";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { TeamProjectReference } from "azure-devops-extension-api/Core/Core";
import { PagedList } from "azure-devops-extension-api/WebApi/WebApi";
import { deserializeVssJsonObject } from "azure-devops-extension-api/Common/Util/Serialization";

// ADO Server only supports REST API up to version 7.1.
// The azure-devops-extension-api package hardcodes 7.2-preview in all methods,
// so we override every method we call to pin it to 7.1.
// Never upgrade past 7.1 without verifying on-prem compatibility.

export class GitClient71 extends GitRestClient {
    public getRepositories(project?: string, includeLinks?: boolean, includeAllUrls?: boolean, includeHidden?: boolean): Promise<GitRepository[]> {
        return this.beginRequest<GitRepository[]>({
            apiVersion: "7.1",
            routeTemplate: "{project}/_apis/git/Repositories/{repositoryId}",
            routeValues: { project },
            queryParams: { includeLinks, includeAllUrls, includeHidden }
        });
    }

    public getPushes(repositoryId: string, project?: string, skip?: number, top?: number, searchCriteria?: GitPushSearchCriteria): Promise<GitPush[]> {
        return this.beginRequest<GitPush[]>({
            apiVersion: "7.1",
            routeTemplate: "{project}/_apis/git/repositories/{repositoryId}/pushes/{pushId}",
            routeValues: { project, repositoryId },
            queryParams: { '$skip': skip, '$top': top, searchCriteria }
        });
    }
}

export class CoreClient71 extends CoreRestClient {
    public getProjects(stateFilter?: unknown, top?: number, skip?: number, continuationToken?: number, getDefaultTeamImageUrl?: boolean): Promise<PagedList<TeamProjectReference>> {
        return this.beginRequest<Response>({
            apiVersion: "7.1",
            routeTemplate: "_apis/projects/{*projectId}",
            queryParams: { stateFilter, '$top': top, '$skip': skip, continuationToken, getDefaultTeamImageUrl },
            returnRawResponse: true
        }).then(async (response: Response) => {
            const body = await response.text().then(deserializeVssJsonObject) as PagedList<TeamProjectReference>;
            body.continuationToken = response.headers.get("x-ms-continuationtoken");
            return body;
        });
    }
}
