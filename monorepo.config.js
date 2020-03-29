module.exports = {
  buildProjects: ['build-packages'],
  projectsDirs: ['misc', 'faultjs', 'semantic-documents', 'patrick-shaw'],
  serve: {
    servers: [
      {
        input: './faultjs/fault-benchmarker/src/frontend/index.tsx',
      },
      {
        input: './patrick-shaw/my-resume/src/index.tsx',
      },
      {
        input: './misc/page-breaker-chrome/src/index.tsx',
      },
    ],
  },
};
