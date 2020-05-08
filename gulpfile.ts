import 'source-map-support/register';
/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
import { join, sep, relative } from 'path';

import * as pshawLogger from 'build-pshaw-logger';
import chalk from 'chalk';

import gulp from 'gulp';
import changed from 'gulp-changed';

import rename from 'gulp-rename';

import getStagableFiles from 'lint-staged/lib/getStagedFiles';
import through from 'through2';

import config from '@monorepo/config';

import filter from 'stream-filter-glob';

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
  return gulp.src(config.buildableSourceAssetGlobs, {
    base: '.',
    nodir: true,
    ...options,
  });
};

const packagesSrcCodeStream = (options?) => {
  return gulp.src(config.buildableSourceCodeGlobs, {
    base: `.`,
    nodir: true,
    ...options,
  });
};

const packagesSrcCodeStagedStream = async (options?) => {
  return gulp
    .src(await getStagableFiles(), {
      base: `.`,
      nodir: true,
      ...options,
    })
    .pipe(filter(config.buildableSourceCodeGlobs));
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
  return through.obj(function (file, enc, callback) {
    l.info(`${verb} '${chalk.cyan(file.relative)}'`);
    callback(null, file);
  });
};

async function clean() {
  const { default: del } = await import('del');
  await del(config.buildArtifactGlobs);
}
gulp.task('clean', clean);

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

function copyScript() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.blueBright('lib')] });
  return copyPipes(packagesSrcAssetStream(), l, 'lib');
}

function copyEsm() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.cyanBright('esm')] });
  return copyPipes(packagesSrcAssetStream(), l, 'esm');
}

const copy = gulp.parallel(copyScript, copyEsm);

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

function transpileScript() {
  return scriptTranspileStream();
}

function transpileEsm() {
  return esmTranspileStream();
}

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
      .pipe(eslint.format('codeframe'))
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

const transpile = gulp.parallel(transpileScript, transpileEsm);
gulp.task('transpile', transpile);

async function writeme() {
  const { writeReadmeFromPackageDir } = require('@writeme/core');
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
}
gulp.task('writeme', writeme);

const build = gulp.series(gulp.parallel(copy, transpile), writeme);
gulp.task('build', build);

gulp.task('watch', function watch() {
  gulp.watch(
    config.buildableSourceFileGlobs,
    { ignoreInitial: false, events: 'all' },
    gulp.parallel(copy, transpile),
  );
});

gulp.task('default', build);

async function formatPrettier() {
  return (await prettierPipes(formatStream())).pipe(gulp.dest('.'));
}
gulp.task('format:prettier', formatPrettier);

async function formatStagedPrettier() {
  return (await prettierPipes(await formatStagedStream())).pipe(gulp.dest('.'));
}
gulp.task('format-staged:prettier', formatStagedPrettier);

async function formatStagedLint() {
  return lintPipes(await formatStagedStream(), { fix: true });
}
formatStagedLint.description =
  'Corrects any automatically fixable linter warnings or errors. Note that this command will ' +
  'overwrite files without creating a backup.';
gulp.task('format-staged:lint', formatStagedLint);

async function format() {
  return (await formatPipes(formatStream())).pipe(gulp.dest('.'));
}
gulp.task('format', format);

async function formatStaged() {
  return (await formatPipes(await formatStagedStream())).pipe(gulp.dest('.'));
}
gulp.task('format-staged', formatStaged);

let withTypeCheckPipes = (stream) => {
  const typescript = require('typescript');
  const gulpTypescript = require('gulp-typescript');
  const tsProject = gulpTypescript.createProject('tsconfig.json', { typescript });

  withTypeCheckPipes = (stream) => {
    return stream.pipe(tsProject(gulpTypescript.reporter.defaultReporter()));
  };

  return withTypeCheckPipes(stream);
};

function checkTypes() {
  return withTypeCheckPipes(config.buildableSourceCodeGlobs);
}
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
gulp.task('check-types', checkTypes);

async function checkTypesStaged() {
  return withTypeCheckPipes(await packagesSrcCodeStagedStream());
}
gulp.task('check-types-staged', checkTypesStaged);

const flIgnoreGlob =
  'faultjs/{fault-messages,fault-tester-mocha,fault-addon-mutation-localization,fault-istanbul-util,fault-runner,fault-addon-hook-schema,hook-schema,fault-record-faults,fault-addon-istanbul,fault-types}/**/*';
async function testNoBuild() {
  const runner = require('@fault/runner');
  const passed = await runner.run({
    tester: '@fault/tester-mocha',
    testMatch: config.testableGlobs,
    addons: [
      config.extra.flMode === 'sbfl'
        ? require('@fault/addon-sbfl').default({
            scoringFn: require('@fault/sbfl-dstar').default,
            console: true,
          })
        : require('@fault/addon-mutation-localization').default({
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
                scriptTranspileStream(rejectOnStreamError).on('end', () => {
                  scriptFinish = true;
                  checkToFinish();
                });
                esmTranspileStream(rejectOnStreamError).on('end', () => {
                  esmFinish = true;
                  checkToFinish();
                });
              });
            },
          }),
    ],
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
}

gulp.task('test', testNoBuild);

const precommit = gulp.series(
  gulp.parallel(gulp.series(formatStaged, transpile), copy),
  writeme,
);
gulp.task('precommit', precommit);

const prepublish = gulp.series(
  gulp.parallel(clean, format),
  gulp.parallel(transpile, copy, testNoBuild),
  gulp.parallel(checkTypes, writeme),
);
gulp.task('prepublish', prepublish);

gulp.task('ci-test', prepublish);

const webpackCompilers = () => {
  const minimist = require('minimist');
  const webpack = require('webpack');
  const micromatch = require('micromatch');

  const args = minimist(process.argv.slice(2));

  const {
    name = ['*'],
    mode = process.NODE_ENV
      ? process.NODE_ENV === 'production'
        ? 'prod'
        : 'dev'
      : 'dev',
  } = args;

  const names = Array.isArray(name) ? name : [name];

  const webpackConfigs = require('./webpack.config');

  return webpackConfigs
    .filter((config) => micromatch.isMatch(config.name, names))
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
const humanReadableFileSize = (size) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2) * 1} ${
    ['B', 'kB', 'MB', 'GB', 'TB'][i]
  }`;
};

const bundleWebpack = async () => {
  const compilers = webpackCompilers();

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

gulp.task('webpack', bundleWebpack);

const serveBundles = () => {
  const WebpackDevServer = require('webpack-dev-server');
  const compilers = webpackCompilers();
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
gulp.task('serve', serveBundles);
