const { resolve } = require('path');
const getConfig = () => {
  const {
    codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
    workspaces = [],
    extraBuildIgnoreGlobs = [],
    extraFormatIgnoreGlobs = [],
    extraBuildArtifactGlobs = [],
    extraTestIgnoreGlobs = [],
    serve = {},
  } = require(resolve(process.cwd(), 'monorepo.config'));

  const defaultArtifactDirNames = ['esm', 'lib', 'dist'];

  const buildIgnoreGlobs = extraBuildIgnoreGlobs;

  const defaultProjectArtifactsGlobs = [
    ...workspaces
      .map((packageGlob) =>
        defaultArtifactDirNames.map(
          (artifactDirName) => `${packageGlob}/${artifactDirName}/**`,
        ),
      )
      .flat(),
    ...workspaces.map((packageGlob) => `${packageGlob}/README.md`),
  ];

  const buildArtifactGlobs = [...extraBuildArtifactGlobs, ...defaultProjectArtifactsGlobs];

  const allCodeGlobs = codeExtensions.map((extension) => `**/*.${extension}`);

  const nonIgnoredSourceGlobs = workspaces.map((packageGlobs) => `${packageGlobs}/src/**`);

  const nonIgnoredSourceCodeGlobs = nonIgnoredSourceGlobs
    .map((glob) => codeExtensions.map((extension) => `${glob}/*.${extension}`))
    .flat();

  const buildableSourceCodeGlobs = [
    ...nonIgnoredSourceCodeGlobs,
    ...buildIgnoreGlobs.map((glob) => `!${glob}`),
  ];

  const buildableSourceAssetGlobs = [
    ...nonIgnoredSourceGlobs,
    ...nonIgnoredSourceCodeGlobs.map((glob) => `!${glob}/*`),
    ...buildIgnoreGlobs.map((glob) => `!${glob}`),
  ];

  const formatIgnoreGlobs = [...buildArtifactGlobs, ...extraFormatIgnoreGlobs];

  const formatableGlobs = [...allCodeGlobs, ...formatIgnoreGlobs.map((glob) => `!${glob}`)];

  const testIgnoreGlobs = [...buildArtifactGlobs, ...extraTestIgnoreGlobs];

  const testableGlobs = [
    ...workspaces
      .map((project) =>
        codeExtensions.map((extension) => `${project}/**/*.test.${extension}`),
      )
      .flat(),
    ...testIgnoreGlobs.map((glob) => `!${glob}`),
  ];

  const watchableGlobs = workspaces.map((project) => `${project}/**`);
  return {
    testableGlobs,
    buildableSourceCodeGlobs,
    buildableSourceAssetGlobs,
    watchableGlobs,
    formatableGlobs,
    codeExtensions,
    workspaces,
    buildIgnoreGlobs,
    buildArtifactGlobs,
    serve,
  };
}

module.exports = getConfig();