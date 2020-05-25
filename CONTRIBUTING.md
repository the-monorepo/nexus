# Contributing

## Quick start
To build everything:
1. `yarn install`
2. `yarn build`

To clean artifacts: `yarn clean`

To serve webapp packages:
1. `yarn serve --name <webpack-config-name>`
2. The CLI will show what port the server is listening on
You can currently find the names of various webpack configs in [webpack.config.ts](./webpack.config.ts);

For anything else:
1. Run `yarn help`.

## Prerequisites
- You'll need to install [yarn](https://yarnpkg.com/getting-started/install).
- You'll need [git](https://git-scm.com/)
- Officially supported editor is [VSCode](https://code.visualstudio.com/);
That's pretty much it.

## Questions/Things you may want to do
**I want to be able to approve a package that I am a main contributor for**
Submit an issue with the `pr-approval-permission` label asking for permission to do so.

**I try edit documentation but my changes keep dissapearing for some reason**
The file is probably auto-generated from somewhere else. There's no documentation for this ATM so you'll have to do some digging around to fine the source of the generation.

**Committing is so slow :(**
You can try commit files with `--no-verify`. However, this will skip the build steps that get run everytime you commit something to the monorepo.

**What is a monorepo? Why a monorepo?**
- Using a monorepo means that all packages in the monorepo follow a similar folder structure and a unified build system. This makes jumping back and forth between packages much easier. 
- Package releases can be synced
- The contributing process for the packages is unified. No need to read lots of CONTRIBUTING.md fiels
- Makes searching through code for multiple packages easier.
- The versions of external dependencies can be synced between different packages which results in smaller `node_modules` and smaller bundle sizes (if you're using multiple packages from the monorepo).

