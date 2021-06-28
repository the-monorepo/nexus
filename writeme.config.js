module.exports = {
  projects: {
    overrides: [
      {
        category: 'Cinder',
        test: './packages/cinder/javascript/*/',
      },
      {
        category: 'Build tooling',
        test: ['./packages/{pipelines,buildplan}/javascript/*', './misc/stream-*/*'],
      },
      {
        category: 'Contextual documents',
        test: './packages/contextual-documents/javascript/*',
      },
      {
        category: 'By Example',
        test: './packages/byexample/javascript/*',
      },
      {
        category: 'Documentation',
        test: './packages/{build-packages,misc,writeme}/javascript{writeme-*,markdown-util}',
      },
      {
        category: 'Logging',
        test: './packages/{build-packages,misc}/javascript{winston-formats,logger}',
      },
      {
        category: 'ESLint',
        test: './packages/monorepo/javascript/eslint-*',
      },
      {
        category: 'TSLint',
        test: './packages/patrick-shaw/javascript/tslint-*',
      },
      {
        category: 'FaultJS',
        test: './packages/faultjs/javascript/*',
      },
      {
        category: 'Personal (Patrick Shaw)',
        test: './packages/patrick-shaw/javascript/*',
      },
    ],
  },
  isDevPackage: true,
};
