/* eslint-disable @typescript-eslint/no-var-requires */
const { relative, join } = require('path');

const register = require('@babel/register');
const { some } = require('micromatch');

const config = require('@monorepo/config');

const transpilationGlobs = [
  'webpack.config.ts',
  'buildplan.ts',
  '.yarn/$$virtual/**/*',
  ...config.buildableSourceCodeGlobs,
];

const transpilationIgnoreGlobs = config.buildableIgnoreGlobs;

register({
  extensions: config.codeExtensions.map((extension) => `.${extension}`),
  only: [
    (testPath) => {
      const relativePath = relative(__dirname, testPath);
      return some(relativePath, transpilationGlobs, { ignore: transpilationIgnoreGlobs });
    },
  ],
});
