// CONFIG HERE
const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'];

const projects = require('./package.json').workspaces;

const dependencyGlobs = [
  '.yarn/**',
  '**/node_modules/**',
]

const extraBuildIgnoreGlobs = [
  'build-packages/**',
  ...dependencyGlobs,
];

const extraFormatIgnoreGlobs = [
  ...extraBuildIgnoreGlobs,
];

const extraBuildArtifactGlobs = [
  'coverage/**',
];

const extraTestIgnoreGlobs = [
  ...dependencyGlobs,
  'faultjs/fault-benchmarker/{disabled-projects,projects}/**',
];

const serve = {
  servers: {
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
  }
};

// Automated stuff should go here
const defaultArtifactDirNames = ['esm', 'lib', 'dist'];

const buildIgnoreGlobs = extraBuildIgnoreGlobs;

const defaultProjectArtifactsGlobs = [
  ...projects.map(
    packageGlob => 
      defaultArtifactDirNames.map(artifactDirName => `${packageGlob}/${artifactDirName}/**`)
  ).flat(),
  ...projects.map(packageGlob => `${packageGlob}/README.md`)
];

const buildArtifactGlobs = [
  ...extraBuildArtifactGlobs,
  ...defaultProjectArtifactsGlobs,
];

const allCodeGlobs = codeExtensions.map(extension => `**/*.${extension}`);

const nonIgnoredSourceGlobs = projects.map(
  packageGlobs => `${packageGlobs}/src/**`,
);

const nonIgnoredSourceCodeGlobs = nonIgnoredSourceGlobs.map(
  glob => 
    codeExtensions.map(extension => `${glob}/*.${extension}`),
).flat();

const buildableSourceCodeGlobs = [
  ...nonIgnoredSourceCodeGlobs,
  ...buildIgnoreGlobs.map(glob => `!${glob}`),
];

const buildableSourceAssetGlobs = [
  ...nonIgnoredSourceGlobs,
  ...nonIgnoredSourceCodeGlobs.map(
    glob => `!${glob}/*`
  ),
  ...buildIgnoreGlobs.map(glob => `!${glob}`),
];

const formatIgnoreGlobs = [
  ...buildArtifactGlobs,
  ...extraFormatIgnoreGlobs,
]

const formatableGlobs = [
  ...formatIgnoreGlobs.map(glob => `!${glob}`),
  ...allCodeGlobs,
];

const testIgnoreGlobs = [
  ...buildArtifactGlobs,
  ...extraTestIgnoreGlobs
];

const testableGlobs = [
  ...projects.map(
    project => codeExtensions.map(extension => `${project}/**/*.test.${extension}`)
  ).flat(),
  ...testIgnoreGlobs.map(glob => `!${glob}`),
];

const watchableGlobs = projects.map(project => `${project}/**`);
module.exports = {
  testableGlobs,
  buildableSourceCodeGlobs,
  buildableSourceAssetGlobs,
  watchableGlobs,
  formatableGlobs,
  codeExtensions,
  projects,
  buildIgnoreGlobs,
  buildArtifactGlobs,
  serve,
};
