import 'source-map-support/register';

import chalk from 'chalk';

import gulp from 'gulp';

import changed from 'gulp-changed';

import rename from 'gulp-rename';

import getStagableFiles from 'lint-staged/lib/getStagedFiles.js';

import config from '@monorepo/config';
import logger from './buildplan/utils/logger.ts';

import filter from 'stream-filter-glob';

import { run } from '@buildplan/core';

import { createSrcDirSwapper } from './buildplan/utils/path.ts';
import transpile from './buildplan/transpile';

import { parallel, task, oldStreamToPromise } from './buildplan/utils/gulp-wrappers.ts';
import { packagesSrcAssetStream, packagesSrcCodeStagedStream, packagesSrcCodeStream } from './buildplan/utils/path.ts';
import { simplePipeLogger } from './buildplan/utils/simplePipeLogger.ts';


const formatStream = (options?) =>
  gulp.src(
    [
      ...config.formatableGlobs,
      ...config.formatableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    {
      base: '.',
      nodir: true,
      ...options,
    },
  );

const formatStagedStream = async () => {
  const { Readable } = await import('stream');
  const stagedPaths = await getStagableFiles();
  const stagedStream =
    stagedPaths.length > 0
      ? gulp.src(stagedPaths, {
          base: '.',
          nodir: true,
        })
      : Readable.from([]);
  return stagedStream.pipe(filter(config.formatableGlobs, config.formatableIgnoreGlobs));
};

const clean = async () => {
  const { default: del } = await import('del');
  await del(config.buildArtifactGlobs);
};
task('clean', 'Cleans up generated files', clean);

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

const prettierPipes = async (stream) => {
  const { default: prettier } = await import('gulp-prettier');
  const l = logger.child(chalk.magentaBright('prettier'));
  return stream.pipe(simplePipeLogger(l)).pipe(prettier());
};

const lintPipes = async (stream, lintOptions) => {
  const { default: eslint } = await import('gulp-eslint');

  const l = logger.child(chalk.magentaBright('eslint'));
  return (
    stream
      .pipe(simplePipeLogger(l))
      .pipe(eslint(lintOptions))
      .pipe(eslint.format('unix'))
      // TODO: Need to halt build process/throw error
      .pipe(eslint.failAfterError())
  );
};

const formatPipes = async (stream) => {
  return await prettierPipes(await lintPipes(stream, { fix: true }));
};

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

const formatPrettier = async () => {
  return (await prettierPipes(formatStream())).pipe(gulp.dest('.'));
};
task('format:prettier', formatPrettier);

const formatStagedPrettier = async () => {
  return (await prettierPipes(await formatStagedStream())).pipe(gulp.dest('.'));
};
task('format-staged:prettier', formatStagedPrettier);

const formatStagedLint = async () => {
  return lintPipes(await formatStagedStream(), { fix: true });
};
formatStagedLint.description =
  'Corrects any automatically fixable linter warnings or errors. Note that this command will ' +
  'overwrite files without creating a backup.';
task('format-staged:lint', formatStagedLint);

const format = async () => {
  return (await formatPipes(formatStream())).pipe(gulp.dest('.'));
};
task('format', 'Formats all your source code files', format);

const formatStaged = async () => {
  return (await formatPipes(await formatStagedStream())).pipe(gulp.dest('.'));
};
task(
  'format-staged',
  "Formats all your source code that's currently staging in Git",
  formatStaged,
);

let withTypeCheckPipes = async (stream) => {
  const gulpTypescript = await import('gulp-typescript');

  const tsProjectPromise = (async () => {
    const typescript = await import('typescript');
    const tsProject = await gulpTypescript.createProject('tsconfig.json', {
      typescript,
    });

    return tsProject;
  })();

  withTypeCheckPipes = async (stream) => {
    const tsProject = await tsProjectPromise;
    return stream.pipe(tsProject(gulpTypescript.reporter.defaultReporter()));
  };

  return withTypeCheckPipes(stream);
};

const checkTypes = async () => {
  return withTypeCheckPipes(
    packagesSrcCodeStream([
      ...config.buildableSourceCodeGlobs,
      ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
    ]),
  );
};
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
task('check-types', 'Run TypeScript type checking', checkTypes);

const checkTypesStaged = async () => {
  return withTypeCheckPipes(await packagesSrcCodeStagedStream());
};
task(
  'check-types-staged',
  'Run TypeScript type checking against files being staged in Git',
  checkTypesStaged,
);

task('test', 'Runs unit tests (without building)', require.resolve('./buildplan/test.ts'));

task('webpack', 'Bundke all Webpack-bundled packages', require.resolve('./buildplan/webpack.ts'));

task('serve', 'Serves Webpack bundled packages', require.resolve('./buildplan/serve.ts'));
run();
