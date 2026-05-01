# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Keep this file up to date.** Whenever new functionality, design decisions, architectural patterns, or ways of working are introduced, update the relevant section or add a new one. This file is the shared source of truth for all developers and AI assistants working on this project.

**Keep `overview.md` up to date.** This file is the marketplace listing that end users read before installing the extension. It must always reflect the current state of the extension's functionality. Any time a user-facing feature is added, changed, or removed — new columns, filter behaviour, stale threshold, hub locations, compatibility, etc. — `overview.md` must be updated in the same PR. The same goes for `README.md`.

**Documentation is part of every change.** Whenever a feature is implemented or modified, `README.md`, `overview.md`, and `CLAUDE.md` must all be updated in the same branch before the PR is raised. This is not optional and not a follow-up task — it is part of the definition of done for every change.

**ADO REST API version must not exceed 7.1.** The extension targets Azure DevOps Server (on-premises) which only supports REST API up to version 7.1. The `azure-devops-extension-api` package hardcodes `7.2-preview` in all its client methods, so every method we call is overridden in `src/common/apiClients.ts` using `GitClient71` and `CoreClient71` — subclasses that force `apiVersion: "7.1"`. Never call `getClient(GitRestClient)` or `getClient(CoreRestClient)` directly; always use these wrappers. If a new API method is needed, add an override for it in `apiClients.ts` with `apiVersion: "7.1"`.

**All UI must feel like a natural part of Azure DevOps.** Every design decision — spacing, typography, colour, row height, hover states, dividers, icons — must follow the ADO design language. Use ADO design tokens (`--palette-*`, `--color-*`) rather than hard-coded values. Reach for `azure-devops-ui` components before writing custom HTML. When in doubt, look at how ADO itself renders a similar pattern (branches list, work item list, table) and match it. Never introduce visual styles that feel foreign to the ADO shell.

## Project Overview

This is an Azure DevOps (ADO) extension named **Git repository list** (id: `git-repository-list`, publisher: `CrazySolutions`). It displays git repositories in a more convenient way and targets Azure DevOps Services and Server via `Microsoft.VisualStudio.Services` in `azure-devops-extension.json`.

The extension contributes two hubs:

| Hub | Location | Contribution target |
|---|---|---|
| `git-list-pivot` | Suite home / collection start page | `ms.vss-tfs-web.suite-home-pivots` |
| `git-list-hub` | Code section inside each project | `ms.vss-code-web.code-hub-group` |

## Commands

| Command | Purpose |
|---|---|
| `npm run build` | Production webpack bundle → `dist/` |
| `npm run build:dev` | Development bundle with source maps |
| `npm run watch` | Incremental dev build on file change |
| `npm test` | Run Jest unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run package` | Build + create `.vsix` via `tfx` |

## Versioning

The extension version is calculated automatically by the CI workflow — do not edit the `version` field in `azure-devops-extension.json` by hand.

### Scheme

- **major.minor** — taken from the most recent git tag (e.g. `v1.2` or `1.2`). Tags must be in `X.Y` format. Defaults to `0.1` if no tag exists.
- **patch** — number of commits on `origin/master` since that tag.
- **master builds**: `major.minor.patch`
- **PR builds**: `major.minor.patch.run_number` — the 4th segment guarantees each PR build is unique and always higher than the current master release, so it can be installed on top for testing. After the PR merges and master CI runs, the incremented patch makes the master build higher again.

### Bumping major or minor

Create a new tag on the commit that should start the new version:

```
git tag v1.0
git push origin v1.0
```

Pushing a tag triggers CI immediately and produces `1.0.0` (0 commits since tag).

## Extension Variants

Two extension variants are maintained from a single codebase:

| Variant | Manifest | Extension ID | Public | Purpose |
|---|---|---|---|---|
| Production | `vss-extension.json` | `my-branches` | `true` | Marketplace release |
| Dev | `vss-extension.dev.json` (override) | `my-branches-dev` | `false` | Verification installs |

`vss-extension.dev.json` only overrides `id`, `name`, and `public` — all other fields come from `vss-extension.json`. Because the IDs differ, both variants can be installed simultaneously in the same ADO organisation.

### CI artifacts

- **Dev VSIX** (`my-branches-dev-<version>`) — built on every run (PRs and master). For installing and verifying before merging.
- **Prod VSIX** (`my-branches-<version>`) — built on master and tag pushes only. For uploading to the marketplace.

### Publishing

Publishing is **manual**. Download the prod VSIX artifact from a master or tag CI run and upload it at `marketplace.visualstudio.com/manage`. There is no automated publish step in CI and no PAT secret is required.

## Asset Constraints

**SVG files are not supported in ADO extension packages.** The marketplace rejects any `.vsix` that contains an SVG. All icons and images must be PNG or JPG.

The `files` array in `vss-extension.json` includes the entire `images/` directory, so **every file placed there is bundled into the VSIX** — not just files referenced by the manifest. Never place an SVG anywhere inside `images/`.

Always generate icons as PNG. The `images/hub-icon.png` and `images/logo.png` files are produced by the inline Node.js scripts in the git history — re-run those scripts if the source needs to change.

## Git Commit Messages

Write commit messages in the imperative mood — phrase the subject as a command, as if completing the sentence "If applied, this commit will…":

> Add branch filter for case-insensitive email match

### Structure

```
<subject — max 50 characters>
<blank line>
<body>
```

### Subject line

- Keep it at 50 characters or fewer.
- Capitalise the first word.
- Do not end with a period.
- Use the imperative mood: "Fix", "Add", "Remove", "Update", "Refactor" — not "Fixed", "Adding", or "Adds".
- Do not include AI co-author attribution (`Co-Authored-By`) in any commit.

### Body

- Separate from the subject with a blank line.
- Wrap lines at 72 characters.
- Explain **what** changed and **why** — not how (the diff shows how).
- Use bullet points where multiple distinct changes need listing.

### Examples

```
Add git-list-hub to the code hub group

Register the hub as a contribution targeting
ms.vss-code-web.code-hub-group so it appears in the
Repos section for each project.
```

## Code Quality Standards

### Clean Code Principles

All code in this project must follow Clean Code principles:

- **Meaningful names**: Variables, functions, and classes must clearly express intent. Avoid abbreviations and single-letter names outside of loop counters.
- **Small functions**: Each function does one thing only. If a function needs a comment to explain what it does, it should be broken down further.
- **No duplication**: Extract repeated logic. Follow DRY (Don't Repeat Yourself).
- **Single Responsibility**: Each module, class, and function has one reason to change.
- **Minimal side effects**: Functions should not produce unexpected side effects. Prefer pure functions where possible.
- **No dead code**: Remove unused variables, functions, imports, and commented-out code.

### Automated Testing

The vast majority of code must be covered by automated tests. Specifically:

- Write tests before or alongside implementation — do not leave testing as an afterthought.
- Unit tests are required for all business logic, utility functions, and non-trivial computations.
- Integration tests are required for API calls, storage interactions, and cross-module behavior.
- Do not consider a feature complete until its automated tests pass.
- Tests must be readable and follow the same Clean Code standards as production code.

## Architecture Notes

### Tech stack

| Tool | Role |
|---|---|
| TypeScript 6 | Language |
| Webpack 5 | Bundler — two explicit entry points, outputs to `dist/` |
| React 16 | UI rendering |
| Jest 30 + ts-jest 29 | Unit testing (jsdom environment) |
| CSS | Plain CSS files, loaded via style-loader/css-loader in webpack |
| `azure-devops-extension-sdk` | SDK init |
| `azure-devops-ui` | Azure DevOps UI components |
| `tfx-cli` | Packages the extension into a `.vsix` |

### Source layout

```
src/
  common/
    Common.tsx            # Shared showRootComponent helper
    repositoryFilter.ts   # Wildcard/substring filter logic for repo name filtering
    treeUtils.ts          # ProjectNode type, buildProjectNodes, applyFilterToTree
    styles.css            # Shared styles
  org-hub/
    Pivot.tsx             # Entry point for the suite-home tab (collection page)
    RepoTreeView.tsx      # Tree view component — repos grouped by project
    index.html
    Pivot.css
    Pivot.json            # Contribution manifest fragment
  repos-hub/
    ServiceHub.tsx        # Entry point for the code-hub-group hub (project repos)
    index.html
    ServiceHub.css
    servicehub.json       # Contribution manifest fragment
  declarations.d.ts       # Module declarations for .css and .scss imports
static/
  git-icon-128.png        # Hub icon referenced in servicehub.json
tests/
  unit/
  __mocks__/
    styleMock.js          # CSS/SCSS stub for Jest
```

### Key design rules

- Webpack entry points are declared explicitly in `webpack.config.js` (`Pivot` → `src/org-hub/Pivot.tsx`, `ServiceHub` → `src/repos-hub/ServiceHub.tsx`). HTML files are copied to `dist/` by `copy-webpack-plugin`. To add a new hub, add an entry and a copy pattern there.
- CSS files are processed by style-loader and css-loader in webpack.
- Tests use `tsconfig.jest.json` (which sets `module: commonjs`) rather than `tsconfig.json` (which targets ES2020 modules for the browser). Do not change `tsconfig.json` module settings for test compatibility — override in `tsconfig.jest.json` instead.
- Tests enforce a minimum **80% line coverage** threshold (`npm run test:coverage`).

### Tree view architecture

The organisation-level hub (`Pivot.tsx`) supports two view modes toggled by the user: `"list"` (default, native ADO `Table` component) and `"tree"` (`RepoTreeView` component).

- `treeUtils.ts` owns the `ProjectNode` shape and two pure functions: `buildProjectNodes` (groups repos by `project.id`, sorts alphabetically) and `applyFilterToTree` (runs the repository filter per project, drops empty nodes).
- `RepoTreeView.tsx` is a stateless functional component that receives pre-computed `nodes`, `expandedProjects` (a `Set<string>`), and callbacks. It renders a header row and one project node per entry.
- Expand state is split across two `Set<string>` instances in `Pivot` state: `expandedProjects` (user's manual choices, all projects seeded on load) and `filterExpandedProjects` (auto-computed when filter is active). `activeExpandedProjects()` returns whichever is current.
- The `azure-devops-ui` package does **not** include a Tree component. The visual treatment (folder background `--palette-neutral-4`, 36px row height, border separators, inset chevrons) is implemented in plain CSS to match the ADO branches list.
- View toggle buttons are always `subtle={true}`; the active state is indicated with `box-shadow: inset 0 0 0 2px` to avoid layout shift from border/padding changes.
