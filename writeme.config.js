module.exports = {
  projects: {
    overrides: [
      {
        category: 'Cinder',
        test: './packages/cinder/*/',
      },
      {
        category: 'Build tooling',
        test: ['./packages/{pipelines,buildplan}/*', './misc/stream-*/*'],
      },
      {
        category: 'Contextual documents',
        test: './packages/contextual-documents/*',
      },
      {
        category: 'By Example',
        test: './packages/byexample/*',
      },
      {
        category: 'Documentation',
        test: './packages/{build-packages,misc,writeme}/{writeme-*,markdown-util}',
      },
      {
        category: 'Logging',
        test: './packages/{build-packages,misc}/{winston-formats,logger}',
      },
      {
        category: 'ESLint',
        test: './packages/patrick-shaw/eslint-*',
      },
      {
        category: 'TSLint',
        test: './packages/patrick-shaw/tslint-*',
      },
      {
        category: 'FaultJS',
        test: './packages/faultjs/*',
      },
      {
        category: 'Personal (Patrick Shaw)',
        test: './packages/patrick-shaw/*',
      },
    ],
  },
  isDevPackage: true,
};
