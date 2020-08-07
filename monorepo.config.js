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

export const extra = {
  flMode: 'sbfl',
};

export const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'];

export const workspaces = require('./package.json').workspaces;

export const extraBuildIgnoreGlobs = ['./build-packages/**', ...dependencyGlobs];

export const extraFormatIgnoreGlobs = [
  ...dependencyGlobs,
  ...faultJsBenchmarkerProjectGlobs,
  './pnp.js',
  './pnp.cjs',
];

export const extraBuildArtifactGlobs = ['./coverage/**'];

export const extraTestIgnoreGlobs = [
  ...dependencyGlobs,
  ...faultJsBenchmarkerProjectGlobs,
];

export const serve = {
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
