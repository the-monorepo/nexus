const { resolve } = require('path');

const getConfig = () => {
  const monorepoConfigPath = resolve(process.cwd(), 'monorepo.config');
  const {
    codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
    workspaces = [],
    extraBuildIgnoreGlobs = [],
    extraFormatIgnoreGlobs = [],
    extraBuildArtifactGlobs = [],
    extraTestIgnoreGlobs = [],
    serve = {},
    extra = {},
  } = require(monorepoConfigPath);

  const compiledCodeExtensionsGlob = `{${codeExtensions.join(',')}}`;

  const defaultArtifactDirNames = ['esm', 'lib', 'dist'];

  const buildableIgnoreGlobs = extraBuildIgnoreGlobs;

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

  const buildArtifactGlobs = [
    ...extraBuildArtifactGlobs,
    ...defaultProjectArtifactsGlobs,
  ];

  const allCodeGlobs = `**/*.${compiledCodeExtensionsGlob}`;

  const nonIgnoredSourceFileGlobs = workspaces.map(
    (packageGlobs) => `${packageGlobs}/src/**/*`,
  );

  const nonIgnoredSourceCodeGlobs = nonIgnoredSourceFileGlobs
    .map((glob) => `${glob}.${compiledCodeExtensionsGlob}`)
    .flat();

  const buildableSourceCodeGlobs = [...nonIgnoredSourceCodeGlobs];

  const buildableSourceAssetGlobs = [
    ...nonIgnoredSourceFileGlobs.map((glob) => `${glob}`),
    ...nonIgnoredSourceCodeGlobs.map((glob) => `!${glob}`),
  ];

  const buildableSourceFileGlobs = [...nonIgnoredSourceFileGlobs];

  const formatableIgnoreGlobs = [...buildArtifactGlobs, ...extraFormatIgnoreGlobs];

  const formatableGlobs = [...allCodeGlobs];

  const testableIgnoreGlobs = [...buildArtifactGlobs, ...extraTestIgnoreGlobs];

  const testDirGlobs = ['test', ...workspaces.map((project) => [`${project}/test`])];

  const testableGlobs = [
    `test/**/*.test.${compiledCodeExtensionsGlob}`,
    ...workspaces
      .map((project) => `${project}/**/*.test.${compiledCodeExtensionsGlob}`)
      .flat(),
  ];

  return {
    testDirGlobs,
    testableGlobs,
    testableIgnoreGlobs,
    buildableSourceFileGlobs,
    buildableSourceCodeGlobs,
    buildableSourceAssetGlobs,
    buildableIgnoreGlobs,
    formatableIgnoreGlobs,
    formatableGlobs,
    buildArtifactGlobs,
    codeExtensions,
    workspaces,
    serve,
    extra,
  };
};

module.exports = getConfig();
