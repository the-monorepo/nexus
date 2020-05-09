/* eslint-disable @typescript-eslint/no-var-requires */

const config = require('@monorepo/config');

const transpilationGlobs = [
  'gulpfile.ts',
  'webpack.config.ts',
  ...config.buildableSourceCodeGlobs,
];

require('@babel/register')({
  only: transpilationGlobs,
  ignore: [...config.buildableIgnoreGlobs],
});
