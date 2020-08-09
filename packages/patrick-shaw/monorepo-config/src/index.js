const { resolve } = require('path');

const codeExtensions = ["js", "jsx", "ts", "tsx", "mjs", "cjs"];

const createConfigPresets = (rootProjectDir, workspaces = resolve(rootProjectDir, './packages/*/*')) => {
  const dependencyGlobs = [
    ".yarn/cache/**",
    resolve(rootProjectDir, ".pnp.js"),
    ".yarn/unplugged/**",
    "**/node_modules/**",
  ];

  const extraBuildIgnoreGlobs = [
    resolve(rootProjectDir, "./packages/build-packages/**"),
  ];

  const extraFormatIgnoreGlobs = [
    ...dependencyGlobs,
    resolve(rootProjectDir, './pnp.js'),
    resolve(rootProjectDir, './pnp.mjs'),
    resolve(rootProjectDir, './pnp.cjs'),
  ];

  const extraBuildArtifactGlobs = [
    resolve(rootProjectDir, './coverage/**'),
  ];

  const extraTestIgnoreGlobs = [
    ...dependencyGlobs,
  ]

  return {
    dependencyGlobs,
    extraBuildIgnoreGlobs,
    extraFormatIgnoreGlobs,
    extraBuildArtifactGlobs,
    extraTestIgnoreGlobs,
    workspaces,
  };
};

module.exports.codeExtensions = codeExtensions;
module.exports.default = createConfigPresets;
