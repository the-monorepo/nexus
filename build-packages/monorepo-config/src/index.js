const { resolve } = require('path');

const arrayToBracedString = (array) => `{${array.join(',')}}`;

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
  const concatenatedWorkspaces = arrayToBracedString(workspaces);

  const concatenatedCodeExtensionsGlob = arrayToBracedString(codeExtensions);

  const defaultArtifactDirNames = ['esm', 'lib', 'dist'];
  const concatenatedDefaultArtifactDirNames = arrayToBracedString(defaultArtifactDirNames);

  const buildableIgnoreGlobs = extraBuildIgnoreGlobs;

  const defaultProjectArtifactsGlobs = [
    `${concatenatedWorkspaces}/${concatenatedDefaultArtifactDirNames}/**`,
    `${concatenatedWorkspaces}/README.md`,
  ];

  const buildArtifactGlobs = [
    ...extraBuildArtifactGlobs,
    ...defaultProjectArtifactsGlobs,
  ];

  const allCodeGlobs = `**/*.${concatenatedCodeExtensionsGlob}`;

  const nonIgnoredSourceFileGlobs = [`${concatenatedWorkspaces}/src/**/*`];

  const nonIgnoredSourceCodeGlobs = nonIgnoredSourceFileGlobs
    .map((glob) => `${glob}.${concatenatedCodeExtensionsGlob}`)
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

  const testDirGlobs = ['test', `${concatenatedWorkspaces}/test`];

  const testableGlobs = [
    `test/**/*.test.${concatenatedCodeExtensionsGlob}`,
    `${concatenatedWorkspaces}/**/*.test.${concatenatedCodeExtensionsGlob}`
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
