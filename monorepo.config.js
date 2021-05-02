const { default: createPresetConfig, codeExtensions } = require('@pshaw/monorepo-config');

const workspaces = require('./package.json').workspaces;

const pshawConfig = createPresetConfig(__dirname, workspaces);

module.exports.workspaces = workspaces;

module.exports.codeExtensions = codeExtensions;

module.exports.extra = {
  flMode: 'sbfl',
};

module.exports.extraBuildIgnoreGlobs = pshawConfig.extraBuildIgnoreGlobs;

module.exports.extraFormatIgnoreGlobs = [...pshawConfig.extraFormatIgnoreGlobs];

module.exports.extraBuildArtifactGlobs = pshawConfig.extraBuildArtifactGlobs;

module.exports.extraTestIgnoreGlobs = [...pshawConfig.extraTestIgnoreGlobs];

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
