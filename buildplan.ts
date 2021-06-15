import 'source-map-support/register';

import chalk from 'chalk';

import gulp from 'gulp';

import changed from 'gulp-changed';

import rename from 'gulp-rename';

import getStagableFiles from 'lint-staged/lib/getStagedFiles.js';

import config from '@monorepo/config';
import logger from './buildplan/utils/logger.ts';

import { run } from '@buildplan/core';

import { createSrcDirSwapper } from './buildplan/utils/path.ts';
import transpile from './buildplan/transpile';

import { parallel, task, oldStreamToPromise } from './buildplan/utils/gulp-wrappers.ts';
import { packagesSrcAssetStream } from './buildplan/utils/path.ts';
import { simplePipeLogger } from './buildplan/utils/simplePipeLogger.ts';

task('clean', 'Cleans up generated files', require.resolve('./buildplan/clean.ts'));

const copyPipes = (stream, l, dir) => {
  const renamePath = createSrcDirSwapper(dir);
  return stream
    .pipe(changed('.', { transformPath: renamePath }))
    .pipe(simplePipeLogger(l))
    .pipe(
      rename((filePath) => {
        filePath.dirname = renamePath(filePath.dirname);
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
};

const copy = async () => {
  const stream = packagesSrcAssetStream();

  const libLogger = logger.child(
    chalk.yellowBright('copy'),
    chalk.rgb(200, 255, 100)('lib'),
  );
  const esmLoger = logger.child(
    chalk.yellowBright('copy'),
    chalk.rgb(255, 200, 100)('esm'),
  );

  const streams = [
    copyPipes(stream, libLogger, 'commonjs'),
    copyPipes(stream, esmLoger, 'esm'),
  ];

  return Promise.all(
    streams.map((aStream) => aStream.pipe(gulp.dest('.'))).map(oldStreamToPromise),
  );
};
task('copy', copy);

task('transpile', require.resolve('./buildplan/transpile.ts'));

task('writeme', 'Generates README doco', require.resolve('./buildplan/writeme.ts'));

const watch = async () => {
  // TODO: Never resolves :3 (on purpose but should find a better way)
  return gulp.watch(
    config.buildableSourceFileGlobs,
    {
      ignoreInitial: false,
      ignored: config.buildableIgnoreGlobs,
      events: 'all',
    },
    () => {
      logger.info(`Rerunning ${chalk.cyan('watch')}`);
      return parallel(copy, transpile)();
    },
  );
};
task('watch', 'Like build but continuously watches for changes', watch);

// task("default", 'Alias for build', build);

task('format', 'Formats all your source code files', require.resolve('./buildplan/format.ts'));
task(
  'formatStaged',
  "Formats all your source code that's currently staging in Git",
  require.resolve('./buildplan/formatStaged.ts'),
);

task('check-types', 'Run TypeScript type checking', require.resolve('./buildplan/checkTypes.ts'));

task(
  'check-types-staged',
  'Run TypeScript type checking against files being staged in Git',
  require.resolve('./buildplan/checkTypesStaged.ts'),
);

task('test', 'Runs unit tests (without building)', require.resolve('./buildplan/test.ts'));

task('webpack', 'Bundke all Webpack-bundled packages', require.resolve('./buildplan/webpack.ts'));

task('serve', 'Serves Webpack bundled packages', require.resolve('./buildplan/serve.ts'));
run();
