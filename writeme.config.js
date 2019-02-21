module.exports = {
  projects: {
    overrides: [
      {
        category: 'Linting',
        test: './packages/{t,e}slint-*',
      },
      {
        category: 'Logging',
        test: './packages/{logger,winston-formats}',
      },
    ],
  },
};
