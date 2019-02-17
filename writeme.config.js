module.exports = {
  projects: {
    category: 'Other',
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
