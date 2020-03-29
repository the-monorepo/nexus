module.exports = {
  buildProjects: ['build-packages'],
  projectsDirs: ['misc', 'faultjs', 'semantic-documents'],
  serve: {
    servers: [
      /*{
        input: './faultjs/fault-benchmarker/src/frontend/index.tsx',
      },*/
      {
        input: './misc/my-resume/src/index.tsx',
      },
      {
        input: './misc/page-breaker-chrome/src/index.tsx',
      },
    ],
  },
};
