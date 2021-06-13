const { resolve } = require('path');

const arrayToBracedString = (array) => {
  switch (array.length) {
    case 0:
      return '';
    case 1:
      return array[0];
    default:
      return `{${array.join(',')}}`;
  }
};

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

  const concatenatedCodeExtensions = arrayToBracedString(codeExtensions);

  const defaultArtifactDirNames = ['esm', 'commonjs', 'dist'];
  const concatenatedDefaultArtifactDirNames = arrayToBracedString(
    defaultArtifactDirNames,
  );

  const buildableIgnoreGlobs = extraBuildIgnoreGlobs;

  const defaultProjectArtifactsGlobs = [
    `${concatenatedWorkspaces}/${concatenatedDefaultArtifactDirNames}/**`,
    `${concatenatedWorkspaces}/README.md`,
  ];

  const buildArtifactGlobs = [
    ...extraBuildArtifactGlobs,
    ...defaultProjectArtifactsGlobs,
  ];

  const allCodeGlobs = [`**/*.${concatenatedCodeExtensions}`];

  const nonIgnoredSourceFileGlobs = [`${concatenatedWorkspaces}/src/**/*`];

  const nonIgnoredSourceCodeGlobs = nonIgnoredSourceFileGlobs
    .map((glob) => `${glob}.${concatenatedCodeExtensions}`)
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

  const testCodeGlobs = testDirGlobs.map(
    (glob) => `${glob}/**/*.${concatenatedCodeExtensions}`,
  );

  const testableGlobs = [
    `test/**/*.test.${concatenatedCodeExtensions}`,
    `${concatenatedWorkspaces}/**/*.test.${concatenatedCodeExtensions}`,
  ];

  return {
    testDirGlobs,
    testCodeGlobs,
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
    concatenatedCodeExtensions,
    workspaces,
    concatenatedWorkspaces,
    serve,
    extra,
  };
};

module.exports = getConfig();
