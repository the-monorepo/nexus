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
        test: './packages/{logger,winston-formats}',
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
