module.exports = {
  projects: {
    overrides: [
      {
        category: 'Linting',
        test: './packages/tslint-*',
      },
      {
        category: 'Logging',
        test: './packages/{logger,winston-formats}',
      },
    ],
  },
};
