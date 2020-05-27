import 'source-map-support/register';
/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
import { join, sep, relative } from 'path';

import chalk from 'chalk';

import gulp from 'gulp';
import changed from 'gulp-changed';

import rename from 'gulp-rename';

import getStagableFiles from 'lint-staged/lib/getStagedFiles';
import streamToPromise from 'stream-to-promise';
import through from 'through2';

import {
  task as buildplanTask,
  run,
  series as buildplanSeries,
  parallel as buildplanParallel,
} from '@buildplan/core';

import config from '@monorepo/config';
import * as pshawLogger from '@pshaw/logger';

import filter from 'stream-filter-glob';

const oldStreamToPromise = async (something) => {
  const value = await something;
  if (
    value !== undefined &&
    value !== null &&
    value !== undefined &&
    value.constructor !== undefined &&
    value.constructor.name === 'Pumpify'
  ) {
    return streamToPromise(value);
  }

  return value;
};

const task = (name: string, callback) =>
  buildplanTask(name, () => oldStreamToPromise(callback()));
const series = (...tasks) =>
  buildplanSeries(...tasks.map((aTask) => () => oldStreamToPromise(aTask())));
const parallel = (...tasks) =>
  buildplanParallel(...tasks.map((aTask) => () => oldStreamToPromise(aTask())));

const swapSrcWith = (srcPath, newDirName) => {
  // Should look like /packages/<package-name>/src/<rest-of-the-path>
  srcPath = relative(__dirname, srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[2] = newDirName;
  const resultingPath = join(...parts);
  return resultingPath;
};

const createSrcDirSwapper = (dir) => {
  return (srcPath) => swapSrcWith(srcPath, dir);
};

const logger = pshawLogger.logger().add(pshawLogger.consoleTransport());

const packagesSrcAssetStream = (options?) => {
  return gulp.src(
    [
      ...config.buildableSourceAssetGlobs,
      ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    {
      base: '.',
      nodir: true,
      ...options,
    },
  );
};

const packagesSrcCodeStream = (options?) => {
  return gulp.src(
    [
      ...config.buildableSourceCodeGlobs,
      ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    {
      base: `.`,
      nodir: true,
      ...options,
    },
  );
};

const packagesSrcCodeStagedStream = async (options?) => {
  return gulp
    .src(await getStagableFiles(), {
      base: `.`,
      nodir: true,
      ...options,
    })
    .pipe(filter(config.buildableSourceCodeGlobs, config.buildableIgnoreGlobs));
};

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

const simplePipeLogger = (l, verb) => {
  return through.obj((file, enc, callback) => {
    l.info(`${verb} '${chalk.cyan(file.relative)}'`);
    callback(null, file);
  });
};

const clean = async () => {
  const { default: del } = await import('del');
  await del(config.buildArtifactGlobs);
};
task('clean', clean);

const copyPipes = (stream, l, dir) => {
  return stream
    .pipe(changed('.', { transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, 'Copying'))
    .pipe(
      rename((filePath) => {
        filePath.dirname = swapSrcWith(filePath.dirname, dir);
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
};

const copyScript = () => {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.blueBright('lib')] });
  return copyPipes(packagesSrcAssetStream(), l, 'lib');
};

const copyEsm = () => {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.cyanBright('esm')] });
  return copyPipes(packagesSrcAssetStream(), l, 'esm');
};

const copy = parallel(copyScript, copyEsm);

const transpilePipes = async (stream, babelOptions, dir, chalkFn) => {
  const sourcemaps = await import('gulp-sourcemaps');
  const { default: babel } = await import('gulp-babel');
  const l = logger.child({ tags: [chalk.blue('transpile'), chalkFn(dir)] });

  return stream
    .pipe(changed('.', { extension: '.js', transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, 'Transpiling'))
    .pipe(sourcemaps.init())
    .pipe(babel(babelOptions))
    .pipe(
      rename((filePath) => {
        filePath.dirname = swapSrcWith(filePath.dirname, dir);
        return filePath;
      }),
    )
    .pipe(sourcemaps.mapSources((filePath) => filePath.replace(/.*\/src\//g, '../src/')))
    .pipe(sourcemaps.write('.', undefined));
};

const scriptTranspileStream = async (wrapStreamFn = (stream) => stream) => {
  return wrapStreamFn(
    await transpilePipes(packagesSrcCodeStream(), undefined, 'lib', chalk.blueBright),
  ).pipe(gulp.dest('.'));
};

const esmTranspileStream = async (wrapStreamFn = (stream) => stream) => {
  return wrapStreamFn(
    await transpilePipes(
      packagesSrcCodeStream(),
      {
        envName: 'esm',
      },
      'esm',
      chalk.cyanBright,
    ),
  ).pipe(gulp.dest('.'));
};

const transpileScript = () => {
  return scriptTranspileStream();
};

const transpileEsm = () => {
  return esmTranspileStream();
};

const prettierPipes = async (stream) => {
  const { default: prettier } = await import('gulp-prettier');
  const l = logger.child({ tags: [chalk.magentaBright('prettier')] });
  return stream.pipe(simplePipeLogger(l, 'Formatting')).pipe(prettier());
};

const lintPipes = async (stream, lintOptions) => {
  const { default: eslint } = await import('gulp-eslint');

  const l = logger.child({ tags: [chalk.magenta('eslint')] });
  return (
    stream
      .pipe(simplePipeLogger(l, 'Formatting'))
      .pipe(eslint(lintOptions))
      .pipe(eslint.format('unix'))
      // TODO: Need to halt build process/throw error
      .pipe(eslint.failAfterError())
  );
};

const formatPipes = async (stream) => {
  return await prettierPipes(await lintPipes(stream, { fix: true }));
};

const printFriendlyAbsoluteDir = (dir) => {
  if (relative(dir, __dirname) === '') {
    return '.';
  }
  return relative(join(__dirname), dir);
};

const transpile = parallel(transpileScript, transpileEsm);
task('transpile', transpile);

const writeme = async () => {
  const { default: writeReadmeFromPackageDir } = await import('@writeme/core');
  const l = logger.child({ tags: [chalk.green('writeme')] });
  await writeReadmeFromPackageDir(__dirname, {
    before: {
      genReadme: async ({ packageDir }) => {
        l.info(
          `Generating readme for '${chalk.cyan(printFriendlyAbsoluteDir(packageDir))}'`,
        );
      },
    },
    after: {
      readConfig: async ({ config, configPath }) => {
        if (!config) {
          l.warn(`Missing '${chalk.cyan(printFriendlyAbsoluteDir(configPath))}'`);
        }
      },
    },
    on: {
      error: async (err) => {
        l.error(err.stack);
      },
    },
  });
};
task('writeme', writeme);

const build = series(parallel(copy, transpile), writeme);
task('build', build);

const watch = () => {
  gulp.watch(
    [
      ...config.buildableSourceFileGlobs,
      ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    { ignoreInitial: false, events: 'all' },
    parallel(copy, transpile),
  );
};
task('watch', watch);

task('default', build);

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
task('format', format);

const formatStaged = async () => {
  return (await formatPipes(await formatStagedStream())).pipe(gulp.dest('.'));
};
task('format-staged', formatStaged);

let withTypeCheckPipes = async (stream) => {
  const gulpTypescriptPromise = import('gulp-typescript');

  const tsProjectPromise = (async () => {
    const typescript = await import('typescript');
    const gulpTypescript = await gulpTypescriptPromise;
    const tsProject = await gulpTypescript.createProject('tsconfig.json', { typescript });

    return tsProject;
  })();

  withTypeCheckPipes = async (stream) => {
    const gulpTypescript = await gulpTypescriptPromise;

    const tsProject = await tsProjectPromise;
    return stream.pipe(tsProject(gulpTypescript.reporter.defaultReporter()));
  };

  return withTypeCheckPipes(stream);
};

const checkTypes = () => {
  return withTypeCheckPipes([
    ...config.buildableSourceCodeGlobs,
    ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
  ]);
};
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
task('check-types', checkTypes);

const checkTypesStaged = async () => {
  return withTypeCheckPipes(await packagesSrcCodeStagedStream());
};
task('check-types-staged', checkTypesStaged);

const flIgnoreGlob =
  'faultjs/{fault-messages,fault-tester-mocha,fault-addon-mutation-localization,fault-istanbul-util,fault-runner,fault-addon-hook-schema,hook-schema,fault-record-faults,fault-addon-istanbul,fault-types}/**/*';

const getFaultLocalizationAddon = async () => {
  switch (config.extra.flMode) {
    default:
    case 'sbfl': {
      const { default: createAddon } = await import('@fault/addon-sbfl');
      const { default: dstar } = await import('@fault/sbfl-dstar');
      return createAddon({
        scoringFn: dstar,
        console: true,
      });
    }
    case 'mbfl': {
      const { default: createAddon } = await import('@fault/addon-mutation-localization');
      return createAddon({
        babelOptions: {
          plugins: ['jsx', 'typescript', 'exportDefaultFrom', 'classProperties'],
          sourceType: 'module',
        },
        ignoreGlob: flIgnoreGlob,
        mapToIstanbul: true,
        onMutation: () => {
          return new Promise((resolve, reject) => {
            let scriptFinish = false;
            let esmFinish = false;
            const checkToFinish = () => {
              if (scriptFinish && esmFinish) {
                resolve();
              }
            };
            const rejectOnStreamError = (stream) => stream.on('error', reject);
            scriptTranspileStream(rejectOnStreamError).then((stream) =>
              stream.on('end', () => {
                scriptFinish = true;
                checkToFinish();
              }),
            );
            esmTranspileStream(rejectOnStreamError).then((stream) =>
              stream.on('end', () => {
                esmFinish = true;
                checkToFinish();
              }),
            );
          });
        },
      });
    }
  }
};

const testNoBuild = async () => {
  const runner = await import('@fault/runner');
  const flAddon = await getFaultLocalizationAddon();
  const passed = await runner.run({
    tester: '@fault/tester-mocha',
    testMatch: [
      ...config.testableGlobs,
      ...config.testableIgnoreGlobs.map((glob) => `!${glob}`),
    ],
    addons: [flAddon],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    setupFiles: [
      'source-map-support/register',
      './test/require/babel',
      './test/helpers/globals',
    ],
    testerOptions: {
      sandbox: true,
    },
    timeout: 20000,
  });
  if (!passed) {
    process.exit(1);
  }
};

task('test', testNoBuild);

const precommit = series(parallel(series(formatStaged, transpile), copy), writeme);
task('precommit', precommit);

const webpackCompilers = async () => {
  const { default: minimist } = await import('minimist');
  const { default: webpack } = await import('webpack');
  const { isMatch } = await import('micromatch');
  const { default: webpackConfigs } = await import('./webpack.config');

  const args = minimist(process.argv.slice(2));

  const {
    name = ['*'],
    mode = process.env.NODE_ENV
      ? process.env.NODE_ENV === 'production'
        ? 'prod'
        : 'dev'
      : 'dev',
  } = args;

  const names = Array.isArray(name) ? name : [name];

  return webpackConfigs
    .filter((config) => isMatch(config.name, names))
    .map((config) => {
      const mergedConfig = {
        mode: mode === 'prod' ? 'production' : 'development',
        ...config,
      };
      return {
        config: mergedConfig,
        compiler: webpack(mergedConfig),
      };
    });
};

// From: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
const humanReadableFileSize = (size: number) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const humanReadableValue = size / Math.pow(1024, i);
  const roundedHumanReadableString = humanReadableValue.toFixed(2);
  return `${roundedHumanReadableString} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
};

const bundleWebpack = async () => {
  const compilers = await webpackCompilers();

  const compilersStatsPromises = compilers.map((info) => {
    return new Promise((resolve, reject) => {
      info.compiler.run((err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      });
    });
  });

  const l = logger.child({ tags: [chalk.magenta('webpack')] });
  for await (const stats of compilersStatsPromises) {
    const compilation = stats.compilation;
    const timeTaken = (stats.endTime - stats.startTime) / 1000;

    const messages = [];

    const filesMessage = Object.values(compilation.assets)
      .map(
        (asset) =>
          ` - ${chalk.cyan(asset.existsAt)} ${chalk.magenta(
            humanReadableFileSize(asset.size()),
          )}`,
      )
      .join('\n');
    const bundleMessage = `Bundled: '${chalk.cyan(
      `${compilation.name}`,
    )}' ${chalk.magenta(`${timeTaken} s`)}`;
    messages.push(bundleMessage, filesMessage);

    if (stats.hasWarnings()) {
      messages.push(
        `${compilation.warnings.length} warnings:`,
        compilation.warnings
          .map((warning) => warning.stack)
          .map(chalk.yellow)
          .join('\n\n'),
      );
    }

    if (stats.hasErrors()) {
      messages.push(
        `${compilation.errors.length} errors:`,
        compilation.errors
          .map(chalk.redBright)
          .map((error) => (error.stack !== undefined ? error.stack : error))
          .join('\n\n'),
      );
    }
    const outputMessage = messages.join('\n');

    l.info(outputMessage);
  }
};

task('webpack', bundleWebpack);

task('build-all', series(parallel(copy, transpile), bundleWebpack, writeme));

const prepublish = series(
  parallel(clean, format),
  parallel(transpile, copy, testNoBuild),
  parallel(bundleWebpack, checkTypes, writeme),
);

task('prepublish', prepublish);

const serveBundles = async () => {
  const { default: WebpackDevServer } = await import('webpack-dev-server');
  const compilers = await webpackCompilers();
  let port = 3000;
  const l = logger.child({ tags: [chalk.magenta('webpack')] });
  for (const { compiler, config } of compilers) {
    const mergedDevServerConfig = config.devServer;
    const server = new WebpackDevServer(compiler, mergedDevServerConfig);
    const serverPort = config.devServer.port !== undefined ? config.devServer.port : port;
    server.listen(serverPort, 'localhost', () => {
      l.info(
        `Serving '${chalk.cyan(config.name)}' on port ${chalk.cyan(
          serverPort.toString(),
        )}...`,
      );
    });
    port++;
  }
};
task('serve', serveBundles);
run();
