# Contributing

## Quick start

1. Install [Nix](https://nix.dev/tutorials/install-nix).
2. Run `nix --experimental-features 'nix-command flakes' develop`
3. `scriptplan start`

To clean artifacts: `scriptplan clean`

To serve webapp packages:
1. `scriptplan serve --name <webpack-config-name>`
2. The CLI will show what port the server is listening on
You can currently find the names of various webpack configs in [webpack.config.ts](./webpack.config.ts);

For anything else:
1. Run `scriptplan help`.

## OS Support

Building/formatting/linting this monorepo is communicated via the `scriptplan` program. There are different versions of this program for different OSs:
- OSX: `./scriptplan`
- Windows: `./scriptplan.exe`

See the quickstart section for how to use it (more documentation pending).

## Prerequisites
Either run `./scriptplan install-osx` or inspect the command itself in [.scripts.yaml](./.scripts.yaml) to install any dependencies required to build the (majority of) the packages in this repo.

### Supported IDEs/Editors
The officially supported editor for this repository is [VSCode](https://code.visualstudio.com/).
Provided that they're lightweight, you're welcome to add any configs/files that make the dev experience for those using your editor/IDE of choice easier.

## Questions/Troubleshooting/Things you may want to do
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

**Most people use editor XXX but it's not supported very well in this repo**
Feel free to raise an issue and submit a PR that improves the editor experience for your editor of choice.

**The master branch seems to have broken tests/builds/etc - It's stopping me from contributing**
Try the `stable` branch. It's a less frequently updated snapshot of the `master` branch and so it's more likely to build. Also consider submitting an issue so people know `master` (or `stable` for that matter) is broken.
