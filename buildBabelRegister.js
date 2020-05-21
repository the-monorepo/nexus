/* eslint-disable @typescript-eslint/no-var-requires */
const { relative } = require('path');

const register = require('@babel/register');
const { some } = require('micromatch');

const config = require('@monorepo/config');

const transpilationGlobs = [
  'gulpfile.ts',
  'webpack.config.ts',
  'buildplan.ts',
  'build-cli.ts',
  'test.js',
  ...config.buildableSourceCodeGlobs,
];

const transpilationIgnoreGlobs = config.buildableIgnoreGlobs;

register({
  extensions: config.codeExtensions.map((extension) => `.${extension}`),
  only: [
    (testPath) => {
      const relativePath = relative(process.cwd(), testPath);

      return some(relativePath, transpilationGlobs, { ignore: transpilationIgnoreGlobs });
    },
  ],
});
