module.exports = {
  projects: {
    overrides: [
      {
        category: 'Cinder',
        test: './cinder/*/',
      },
      {
        category: 'Semantic documents',
        test: './semantic-documents/*',
      },
      {
        category: 'By Example',
        test: './byexample/*'
      },
      {
        category: 'Build tooling',
        test: './{build-packages,misc,faultjs}/{build-util,gulp-*}',
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
        test: './{build-packages,misc,faultjs}/tslint*',
      },
      {
        category: 'TSLint',
        test: './{build-packages,misc,faultjs}/eslint*',
      },
      {
        category: 'FaultJS',
        test: ['./{build-packages,misc,faultjs}/fault-*'],
      },
    ],
  },
};
