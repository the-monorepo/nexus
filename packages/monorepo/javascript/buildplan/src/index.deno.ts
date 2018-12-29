import { run } from '@buildplan/core';

import { task } from './tasks/utils/gulp-wrappers.ts';

import { resolve } from 'https://deno.land/std@0.106.0/path/mod.ts';

const __dirname = new URL('.', import.meta.url).pathname;

const importResolve = (path: string) => resolve(__dirname, path);

task('clean', 'Cleans up generated files', importResolve('./tasks/clean.ts'));

task('copy', importResolve('./tasks/copy'));

task('transpile', importResolve('./tasks/transpile.ts'));

task('writeme', 'Generates README doco', importResolve('./tasks/writeme.ts'));

task(
  'watch',
  'Like build but continuously watches for changes',
  importResolve('./tasks/watch.ts'),
);

// task("default", 'Alias for build', build);

task('format', 'Formats all your source code files', importResolve('./tasks/format.ts'));
task(
  'formatStaged',
  "Formats all your source code that's currently staging in Git",
  importResolve('./tasks/formatStaged.ts'),
);

task(
  'check-types',
  'Run TypeScript type checking',
  importResolve('./tasks/checkTypes.ts'),
);

task(
  'check-types-staged',
  'Run TypeScript type checking against files being staged in Git',
  importResolve('./tasks/checkTypesStaged.ts'),
);

task('test', 'Runs unit tests (without building)', importResolve('./tasks/test.ts'));

task(
  'webpack',
  'Bundke all Webpack-bundled packages',
  importResolve('./tasks/webpack.ts'),
);

task('serve', 'Serves Webpack bundled packages', importResolve('./tasks/serve.ts'));
run();
