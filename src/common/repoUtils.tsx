import * as React from "react";
import { GitRepository } from "azure-devops-extension-api/Git";
import { Icon } from "azure-devops-ui/Icon";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { ISimpleListCell } from "azure-devops-ui/List";

export function repoNameCell(repo: GitRepository, indent?: boolean): ISimpleListCell {
    return {
        textNode: (
            <div className="repo-name-cell">
                {indent && <span className="tree-repo-indent" />}
                <Icon iconName="GitLogo" />
                <span className="repo-name-text">{repo.name}</span>
                {repo.isFork && <Pill size={PillSize.compact} variant={PillVariant.outlined}>Fork</Pill>}
                {repo.isDisabled && <Pill size={PillSize.compact} variant={PillVariant.outlined}>Disabled</Pill>}
                {repo.isInMaintenance && <Pill size={PillSize.compact} variant={PillVariant.outlined}>Maintenance</Pill>}
            </div>
        )
    };
}
