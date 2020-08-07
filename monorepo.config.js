// CONFIG HERE
const dependencyGlobs = [
  '.yarn/cache/**',
  '.pnp.js',
  '.yarn/unplugged/**',
  '**/node_modules/**',
];

const faultJsBenchmarkerProjectGlobs = [
  './faultjs/fault-benchmark/{disabled-projects,projects}/**',
];

module.exports.extra = {
  flMode: 'sbfl',
};

module.exports.codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'];

module.exports.workspaces = require('./package.json').workspaces;

module.exports.extraBuildIgnoreGlobs = ['./build-packages/**', ...dependencyGlobs];

module.exports.extraFormatIgnoreGlobs = [
  ...dependencyGlobs,
  ...faultJsBenchmarkerProjectGlobs,
  './pnp.js',
  './pnp.cjs',
];

module.exports.extraBuildArtifactGlobs = ['./coverage/**'];

module.exports.extraTestIgnoreGlobs = [
  ...dependencyGlobs,
  ...faultJsBenchmarkerProjectGlobs,
];

module.exports.serve = {
  servers: {
    servers: [
      {
        input: './packages/faultjs/fault-benchmark/src/frontend/index.tsx',
      },
      {
        input: './packages/patrick-shaw/my-resume/src/index.tsx',
      },
      {
        input: './packages/misc/page-breaker-chrome/src/index.tsx',
      },
    ],
  },
};
