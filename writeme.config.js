module.exports = {
  projects: {
    overrides: [
      {
        category: 'Cinder',
        test: './cinder/*/',
      },
      {
        category: 'Build tooling',
        test: ['./{pipelines,buildplan}/*', './misc/{stream}'],
      },
      {
        category: 'Semantic documents',
        test: './semantic-documents/*',
      },
      {
        category: 'By Example',
        test: './byexample/*',
      },
      {
        category: 'Documentation',
        test: './{build-packages,misc,faultjs}/{writeme-*,markdown-util}',
      },
      {
        category: 'Logging',
        test: './{build-packages,misc,faultjs}/{winston-formats,logger}',
      },
      {
        category: 'ESLint',
        test: './patrick-shaw/eslint-*',
      },
      {
        category: 'TSLint',
        test: './patrick-shaw/tslint-*',
      },
      {
        category: 'FaultJS',
        test: ['./faultjs/fault-*'],
      },
    ],
  },
  isDevPackage: true,
};
