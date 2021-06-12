import 'source-map-support/register';

import { join, sep, relative } from 'path';

import chalk from 'chalk';

import gulp from 'gulp';

import gulpPlumber from 'gulp-plumber';
import changed from 'gulp-changed';

import rename from 'gulp-rename';

import getStagableFiles from 'lint-staged/lib/getStagedFiles.js';
import streamToPromise from 'stream-to-promise';
import through from 'through2';

import {
  task as buildplanTask,
  run,
  series as buildplanSeries,
  parallel as buildplanParallel,
  TASK_INFO,
} from '@buildplan/core';

import config from '@monorepo/config';
import createLogger from '@pshaw/logger';

import filter from 'stream-filter-glob';

const oldStreamToPromise = async (something) => {
  const value = await something;
  if (
    value !== undefined &&
    value !== null &&
    value.constructor !== undefined &&
    value.constructor.name === 'Pumpify'
  ) {
    return streamToPromise(value);
  }

  return value;
};

const task = (name: string, descriptionOrCallback, callbackOrUndefined?) => {
  const callback =
    callbackOrUndefined === undefined ? descriptionOrCallback : callbackOrUndefined;
  const wrapped = { [name]: () => oldStreamToPromise(callback()) }[name];
  if (callback[TASK_INFO] !== undefined) {
    wrapped[TASK_INFO] = callback[TASK_INFO];
  }
  return buildplanTask(
    name,
    callbackOrUndefined !== undefined ? descriptionOrCallback : '',
    callback,
  );
};

const series = (...tasks) =>
  buildplanSeries(
    ...tasks.map((aTask) => {
      const wrapped = { [aTask.name]: () => oldStreamToPromise(aTask()) }[aTask.name];
      if (aTask[TASK_INFO] !== undefined) {
        wrapped[TASK_INFO] = aTask[TASK_INFO];
      }
      return wrapped;
    }),
  );

const parallel = (...tasks) =>
  buildplanParallel(
    ...tasks.map((aTask) => {
      const wrapped = { [aTask.name]: () => oldStreamToPromise(aTask()) }[aTask.name];
      if (aTask[TASK_INFO] !== undefined) {
        wrapped[TASK_INFO] = aTask[TASK_INFO];
      }
      return wrapped;
    }),
  );

const swapSrcWith = (srcPath, newDirName) => {
  // Should look like /packages/<package-name>/javascript/src/<rest-of-the-path>
  srcPath = relative(__dirname, srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[4] = newDirName;
  const resultingPath = join(...parts);
  return resultingPath;
};

const createSrcDirSwapper = (dir) => {
  return (srcPath) => swapSrcWith(srcPath, dir);
};

const logger = createLogger();

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

const simplePipeLogger = (l) => {
  return through.obj((file, enc, callback) => {
    l.info(`'${chalk.cyanBright(file.relative)}'`);
    callback(null, file);
  });
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

const touch = () =>
  through.obj(function (file, _, cb) {
    if (file.stat) {
      file.stat.atime = file.stat.mtime = file.stat.ctime = new Date();
    }
    cb(null, file);
  });

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

const transpilePipes = async (stream, babelOptions, dir, logName = dir, chalkFn) => {
  const sourcemaps = await import('gulp-sourcemaps');
  const { transformAsync: bableTransform } = await import('@babel/core');
  const { default: applySourceMap } = await import('vinyl-sourcemaps-apply');

  const l = logger.child(chalk.blueBright('transpile'), chalkFn(logName));
  const renamePath = createSrcDirSwapper(dir);

  return stream
    .pipe(gulpPlumber({ errorHandler: (err) => l.exception(err) }))
    .pipe(
      changed('.', {
        transformPath: renamePath,
      }),
    )
    .pipe(simplePipeLogger(l))
    .pipe(sourcemaps.init())
    .pipe(
      through.obj(async function (file, _, done) {
        try {
          // Copied from https://github.com/babel/gulp-babel/blob/master/index.js
          const { code, map } = await bableTransform(file.contents.toString(), {
            ...babelOptions,
            filename: file.path,
            filenameRelative: file.relative,
            sourceMap: Boolean(file.sourceMap),
            sourceFileName: file.relative,
          });

          file.contents = Buffer.from(code);

          map.file = file.relative;
          applySourceMap(file, map);

          done(null, file);
        } catch (err) {
          done(err);
        }
      }),
    )
    .pipe(
      rename((filePath) => {
        filePath.dirname = renamePath(filePath.dirname);
        return filePath;
      }),
    )
    .pipe(sourcemaps.mapSources((filePath) => filePath.replace(/.*\/src\//g, '../src/')))
    .pipe(sourcemaps.write('.', undefined))
    .pipe(touch());
};

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

const printFriendlyAbsoluteDir = (dir) => {
  if (relative(dir, __dirname) === '') {
    return '.';
  }
  return relative(join(__dirname), dir);
};

const transpile = async () => {
  const stream = packagesSrcCodeStream();

  const baseEnv = process.env.NODE_ENV ?? 'development';

  const streams = await Promise.all([
    transpilePipes(
      stream,
      {
        envName: baseEnv,
      },
      'commonjs',
      'cjs',
      chalk.rgb(200, 255, 100),
    ),
    transpilePipes(
      stream,
      {
        envName: `${baseEnv}-esm`,
      },
      'esm',
      undefined,
      chalk.rgb(255, 200, 100),
    ),
  ]);

  return await Promise.all(
    streams.map((aStream) => aStream.pipe(gulp.dest('.'))).map(oldStreamToPromise),
  );
};
task('transpile', transpile);

const writeme = async () => {
  const { default: writeReadmeFromPackageDir } = await import('@writeme/core');
  const l = logger.child(chalk.greenBright('writeme'));
  await writeReadmeFromPackageDir(__dirname, {
    before: {
      genReadme: async ({ packageDir }) => {
        l.info(`Generating '${chalk.cyanBright(printFriendlyAbsoluteDir(packageDir))}'`);
      },
    },
    after: {
      readConfig: async ({ config, configPath }) => {
        if (!config) {
          l.warn(`Missing '${chalk.cyanBright(printFriendlyAbsoluteDir(configPath))}'`);
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
task('writeme', 'Generates README doco', writeme);

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

const flIgnoreGlob =
  'packages/faultjs/javascript/{fault-messages,fault-tester-mocha,fault-addon-mutation-localization,fault-istanbul-util,fault-runner,fault-addon-hook-schema,hook-schema,fault-record-faults,fault-addon-istanbul,fault-types}/**/*';

const getFaultLocalizationAddon = async () => {
  switch (config.extra.flMode) {
    default:
    case 'sbfl': {
      const { default: createAddon } = await import('@fault/addon-sbfl');
      const { default: dstar } = await import('@fault/sbfl-dstar');
      return createAddon({
        scoringFn: dstar,
        faultFilePath: true,
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
        onMutation: transpile,
      });
    }
  }
};

const testNoBuild = async () => {
  const runner = await import('@fault/runner');
  const flAddon = await getFaultLocalizationAddon();
  const { default: minimist } = await import('minimist');

  const args = minimist(process.argv.slice(3));

  const { _: paths } = args;

  const passed = await runner.run({
    tester: '@fault/tester-mocha',
    testMatch:
      paths.length >= 1
        ? paths
        : [
            ...config.testableGlobs,
            ...config.testableIgnoreGlobs.map((glob) => `!${glob}`),
          ],
    addons: [flAddon],
    processOptions: {
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    },
    setupFiles: ['./test/helpers/globals.js'],
    testerOptions: {
      sandbox: true,
    },
    timeout: 20000,
  });
  if (!passed) {
    process.exitCode = 1;
  }
};

task('test', 'Runs unit tests (without building)', testNoBuild);

const webpackCompilers = async () => {
  const { default: minimist } = await import('minimist');
  const { webpack } = await import('@pshaw/webpack');
  const { isMatch } = await import('micromatch');
  const { default: webpackConfigs } = await import('./webpack.config');
  const { existsSync } = await import('fs');
  const { readFile } = await import('fs/promises');

  const args = minimist(process.argv.slice(2));

  const {
    name = ['*'],
    mode = (process.env.NODE_ENV ?? 'development') === 'production' ? 'prod' : 'dev',
    http = false,
  } = args;

  const httpsConfig = await (async () => {
    if (http) {
      return undefined;
    }

    const existsThenRead = async (path: string) => {
      if (!existsSync(path)) {
        // TODO: Need a better message
        throw new Error(
          `${path} is missing. Please create a ${path} or run with --http flag`,
        );
      }

      return await readFile(path);
    };

    const [key, crt] = await Promise.all([
      existsThenRead('./localhost.key'),
      existsThenRead('./localhost.crt'),
    ]);

    return {
      key,
      cert: crt,
    };
  })();

  const names = Array.isArray(name) ? name : [name];

  return webpackConfigs
    .filter((config) => isMatch(config.name, names))
    .map((config) => {
      const mergedConfig = {
        mode: mode === 'prod' ? 'production' : 'development',
        ...config,
        devServer: {
          https: config.devServer.https ?? httpsConfig,
          ...config.devServer,
        },
      };
      return {
        config: mergedConfig,
        // TODO: Fix
        compiler: webpack(mergedConfig as any),
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
    return new Promise<any>((resolve, reject) => {
      info.compiler.run((err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      });
    });
  });

  const l = logger.child(chalk.magentaBright('webpack'));
  for await (const stats of compilersStatsPromises) {
    const compilation = stats.compilation;
    const timeTaken = (stats.endTime - stats.startTime) / 1000;

    const messages: string[] = [];

    const filesMessage = Object.values<any>(compilation.assets)
      .map(
        (asset) =>
          ` - ${chalk.cyanBright(asset.existsAt)} ${chalk.magentaBright(
            humanReadableFileSize(asset.size()),
          )}`,
      )
      .join('\n');
    const bundleMessage = `Bundled: '${chalk.cyanBright(
      `${compilation.name}`,
    )}' ${chalk.magentaBright(`${timeTaken} s`)}`;
    messages.push(bundleMessage, filesMessage);

    if (stats.hasWarnings()) {
      messages.push(
        `${compilation.warnings.length} warnings:`,
        compilation.warnings
          .map((warning) => warning.stack)
          .map(chalk.yellowBright)
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

task('webpack', 'Bundke all Webpack-bundled packages', bundleWebpack);

const serveBundles = async () => {
  const { WebpackDevServer } = await import('@pshaw/webpack');
  const compilers = await webpackCompilers();
  let port = 3000;
  const l = logger.child(chalk.magentaBright('webpack'));
  for (const { compiler, config } of compilers) {
    const mergedDevServerConfig = config.devServer;
    const server = new WebpackDevServer(compiler as any, mergedDevServerConfig);
    const serverPort = config.devServer.port !== undefined ? config.devServer.port : port;
    server.listen(serverPort, 'localhost', () => {
      l.info(
        `Serving '${chalk.cyanBright(config.name)}' on port ${chalk.cyanBright(
          serverPort.toString(),
        )}...`,
      );
    });
    port++;
  }
};
task('serve', 'Serves Webpack bundled packages', serveBundles);
run();
