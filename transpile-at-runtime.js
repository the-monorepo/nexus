/* eslint-disable @typescript-eslint/no-var-requires */
const { relative } = require('path');

const register = require('@babel/register');
const { matcher } = require('micromatch');

const config = require('@monorepo/config');

const transpilationGlobs = [...config.buildableSourceCodeGlobs, ...config.testCodeGlobs];

const transpilationIgnoreGlobs = config.buildableIgnoreGlobs;

const isMatch = matcher(transpilationGlobs, {
  ignore: transpilationIgnoreGlobs,
});

register({
  extensions: config.codeExtensions.map((extension) => `.${extension}`),
  only: [
    (testPath) => {
      const relativePath = relative(__dirname, testPath);
      switch (relativePath) {
        case 'webpack.config.ts':
        case 'original-code-require-override.ts':
        case 'buildplan.ts':
        case 'build-import-map.ts':
          return true;
        default: {
          if (relativePath.startsWith('buildplan')) {
            return true;
          }
          return isMatch(relativePath);
        }
      }
    },
  ],
});
