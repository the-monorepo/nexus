import 'source-map-support/register';

import { run } from '@buildplan/core';

import { task } from './buildplan/utils/gulp-wrappers.ts';

task('clean', 'Cleans up generated files', require.resolve('./buildplan/clean.ts'));

task('copy', require.resolve('./buildplan/copy'));

task('transpile', require.resolve('./buildplan/transpile.ts'));

task('writeme', 'Generates README doco', require.resolve('./buildplan/writeme.ts'));

task(
  'watch',
  'Like build but continuously watches for changes',
  require.resolve('./buildplan/watch.ts'),
);

// task("default", 'Alias for build', build);

task(
  'format',
  'Formats all your source code files',
  require.resolve('./buildplan/format.ts'),
);
task(
  'formatStaged',
  "Formats all your source code that's currently staging in Git",
  require.resolve('./buildplan/formatStaged.ts'),
);

task(
  'check-types',
  'Run TypeScript type checking',
  require.resolve('./buildplan/checkTypes.ts'),
);

task(
  'check-types-staged',
  'Run TypeScript type checking against files being staged in Git',
  require.resolve('./buildplan/checkTypesStaged.ts'),
);

task(
  'test',
  'Runs unit tests (without building)',
  require.resolve('./buildplan/test.ts'),
);

task(
  'webpack',
  'Bundke all Webpack-bundled packages',
  require.resolve('./buildplan/webpack.ts'),
);

task('serve', 'Serves Webpack bundled packages', require.resolve('./buildplan/serve.ts'));
run();
