module.exports = {
  projects: {
    overrides: [
      {
        category: 'Build tooling',
        test: './{build-packages,packages}/{build-util,gulp-*}',
      },
      {
        category: 'Documentation',
        test: './packages/{writeme,markdown-util}',
      },
      {
        category: 'Logging',
        test: './{build-packages,packages}/{winston-formats,logger}',
      },
      {
        category: 'ESLint',
        test: './packages/tslint*',
      },
      {
        category: 'TSLint',
        test: './packages/eslint*',
      },
    ],
  },
};
