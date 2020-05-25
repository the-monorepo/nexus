/* eslint-disable @typescript-eslint/no-var-requires */
const { relative } = require('path');

const register = require('@babel/register');
const { some } = require('micromatch');

const config = require('@monorepo/config');

const transpilationGlobs = [
  'webpack.config.ts',
  'buildplan.ts',
  ...config.buildableSourceCodeGlobs,
];

const transpilationIgnoreGlobs = config.buildableIgnoreGlobs;

register({
  extensions: config.codeExtensions.map((extension) => `.${extension}`),
  only: [
    (testPath) => {
      const relativePath = relative(process.cwd(), testPath).replace(/^\.yarn\/\$\$virtual\/[^\/]+\/\d+\//i, '');

      return some(relativePath, transpilationGlobs, { ignore: transpilationIgnoreGlobs });
    },
  ],
});
