/* eslint-disable @typescript-eslint/no-var-requires */

const micromatch = require('micromatch');

const config = require('@monorepo/config');

const transpilationGlobs = [
  'gulpfile.ts',
  'webpack.config.ts',
  ...config.buildableSourceCodeGlobs,
];

require('@babel/register')({
  only: ['gulpfile.js'],
});
