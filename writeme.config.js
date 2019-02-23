module.exports = {
  projects: {
    overrides: [
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
