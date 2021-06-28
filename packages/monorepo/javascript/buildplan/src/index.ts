import 'source-map-support/register.js';

import { run } from '@buildplan/core';

import { task } from './tasks/utils/gulp-wrappers.ts';

task('clean', 'Cleans up generated files', require.resolve('./tasks/clean.ts'));

task('copy', require.resolve('./tasks/copy.ts'));

task('transpile', require.resolve('./tasks/transpile.ts'));

task('writeme', 'Generates README doco', require.resolve('./tasks/writeme.ts'));

task(
  'watch',
  'Like build but continuously watches for changes',
  require.resolve('./tasks/watch.ts'),
);

// task("default", 'Alias for build', build);

task(
  'format',
  'Formats all your source code files',
  require.resolve('./tasks/format.ts'),
);
task(
  'formatStaged',
  "Formats all your source code that's currently staging in Git",
  require.resolve('./tasks/formatStaged.ts'),
);

task(
  'check-types',
  'Run TypeScript type checking',
  require.resolve('./tasks/checkTypes.ts'),
);

task(
  'check-types-staged',
  'Run TypeScript type checking against files being staged in Git',
  require.resolve('./tasks/checkTypesStaged.ts'),
);

task('test', 'Runs unit tests (without building)', require.resolve('./tasks/test.ts'));

task(
  'webpack',
  'Bundke all Webpack-bundled packages',
  require.resolve('./tasks/webpack.ts'),
);

task('serve', 'Serves Webpack bundled packages', require.resolve('./tasks/serve.ts'));
run();
