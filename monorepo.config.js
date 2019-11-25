module.exports = {
  buildProjects: ['build-packages'],
  projectsDirs: ['misc', 'faultjs'],
  serve: {
    servers: [
      {
        input: './faultjs/fault-benchmarker/src/frontend/index.tsx',
      },
      {
        input: './misc/my-resume/src/index.tsx',
      },
    ],
  },
};
