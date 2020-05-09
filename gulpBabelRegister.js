/* eslint-disable @typescript-eslint/no-var-requires */

/*const micromatch = require('micromatch');

const config = require('@monorepo/config');

const matcher = micromatch.matcher('build-packages/*');*/

require('@babel/register')({
  only: ['gulpfile.ts', 'webpack.config.ts'],
});
