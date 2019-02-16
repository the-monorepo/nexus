module.exports = {
  projects: {
    category: 'Other',
    test: ['./packages/*'],
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
