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
That's pretty much it.

## Questions
### I want to be able to approve a package that I am a main contributor for 
Submit an issue with the `pr-approval-permission` label asking for permission to do so.
