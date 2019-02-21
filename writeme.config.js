module.exports = {
  projects: {
    overrides: [
      {
        category: "ESLint",
        test: './packages/tslint*'
      },
      {
        category: 'TSLint',
        test: './packages/eslint*',
      },
      {
        category: 'Logging',
        test: './packages/{logger,winston-formats}',
      },
    ],
  },
};
