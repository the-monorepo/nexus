require('source-map-support/register');
/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
const { join, sep, relative } = require('path');

const chalk = require('chalk');

const gulp = require('gulp');
const changed = require('gulp-changed');
const staged = require('gulp-staged');
const rename = require('gulp-rename');

const { promisify } = require('util');

const spawn = require('cross-spawn');

const through = require('through2');

const PluginError = require('plugin-error');

const monorepo = require('./monorepo.config');

const packagesDirNames = monorepo.projectsDirs;
const buildPackagesDirNames = monorepo.buildProjects;

function swapSrcWith(srcPath, newDirName) {
  // Should look like /packages/<package-name>/src/<rest-of-the-path>
  srcPath = relative(__dirname, srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[2] = newDirName;
  const resultingPath = join(__dirname, ...parts);
  return resultingPath;
}

function createSrcDirSwapper(dir) {
  return srcPath => swapSrcWith(srcPath, dir);
}

function packagesGlobFromPackagesDirName(dirName) {
  return `./${dirName}/*`;
}

function packageSubDirGlob(dirName, folderName) {
  return `./${dirName}/*/${folderName}/**/*`;
}

const transpiledExtensions = '{js,jsx,ts,tsx}';

function srcTranspiledGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}.${transpiledExtensions}`;
}

function mockGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}/__mocks__/*`;
}

function globSrcMiscFromPackagesDirName(dirNames) {
  return dirNames
    .map(dirName => [
      packageSubDirGlob(dirName, 'src'),
      `!${srcTranspiledGlob(dirName, 'src')}`,
      `!${mockGlob(dirName, 'src')}`,
    ])
    .flat();
}

function globSrcCodeFromPackagesDirName(dirNames) {
  return dirNames
    .map(dirName => [srcTranspiledGlob(dirName, 'src'), `!${mockGlob(dirName, 'src')}`])
    .flat();
}

function globBuildOutputFromPackagesDirName(dirNames) {
  return dirNames
    .map(dirName => [
      packageSubDirGlob(dirName, 'lib'),
      packageSubDirGlob(dirName, 'esm'),
      packageSubDirGlob(dirName, 'dist'),
    ])
    .flat();
}

function sourceGlobFromPackagesDirName(dirName) {
  return `${packagesGlobFromPackagesDirName(dirName)}/src/**`;
}

const pshawLogger = require('build-pshaw-logger');
const logger = pshawLogger.logger().add(pshawLogger.consoleTransport());

function packagesSrcMiscStream(options) {
  return gulp.src(globSrcMiscFromPackagesDirName(packagesDirNames), {
    base: '.',
    ...options,
  });
}

function packagesSrcCodeStream(options) {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirNames), {
    base: `.`,
    ...options,
  });
}

function packagesSrcCodeWithTsDefinitionsStream(options) {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirNames).concat('**/*.d.ts'), {
    base: `.`,
    ...options,
  });
}

function codeStream(options) {
  return gulp.src(
    [
      '**/*.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!coverage/**',
      '!{build-packages,misc,faultjs}/*/{dist,lib,esm,coverage}/**',
      '!faultjs/fault-benchmarker/{disabled-projects,projects}/**',
    ],
    {
      base: '.',
      ...options,
    },
  );
}

function simplePipeLogger(l, verb) {
  return through.obj(function(file, enc, callback) {
    l.info(`${verb} '${chalk.cyan(file.relative)}'`);
    callback(null, file);
  });
}

async function clean() {
  const del = require('del');
  await del([
    ...globBuildOutputFromPackagesDirName(packagesDirNames),
    ...globBuildOutputFromPackagesDirName(buildPackagesDirNames),
    './README.md',
    './{build-packages,faultjs,misc}/*/README.md',
    './faultjs/fault-benchmarker/{disabled-projects,projects}/*/{faults,coverage,fault-results.json}',
    './faultjs/fault-benchmarker/benchmark-results.json',
  ]);
}
gulp.task('clean', clean);

function copyPipes(stream, l, dir) {
  return stream
    .pipe(changed('.', { transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, 'Copying'))
    .pipe(
      rename(filePath => {
        filePath.dirname = swapSrcWith(filePath.dirname, dir);
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
}

function copyScript() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.blueBright('lib')] });
  return copyPipes(packagesSrcMiscStream(), l, 'lib');
}

function copyEsm() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.cyanBright('esm')] });
  return copyPipes(packagesSrcMiscStream(), l, 'esm');
}

const copy = gulp.parallel(copyScript, copyEsm);

function transpilePipes(stream, babelOptions, dir, chalkFn) {
  const sourcemaps = require('gulp-sourcemaps');
  const babel = require('gulp-babel');
  const l = logger.child({ tags: [chalk.blue('transpile'), chalkFn(dir)] });

  return stream
    .pipe(changed('.', { extension: '.js', transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, 'Transpiling'))
    .pipe(sourcemaps.init())
    .pipe(babel(babelOptions))
    .pipe(
      rename(filePath => {
        filePath.dirname = swapSrcWith(filePath.dirname, dir);
        return filePath;
      }),
    )
    .pipe(sourcemaps.mapSources(filePath => filePath.replace(/.*\/src\//g, '../src/')))
    .pipe(sourcemaps.write('.'));
}

const scriptTranspileStream = (wrapStreamFn = stream => stream) => {
  return wrapStreamFn(
    transpilePipes(packagesSrcCodeStream(), undefined, 'lib', chalk.blueBright),
  ).pipe(gulp.dest('.'));
};

const esmTranspileStream = (wrapStreamFn = stream => stream) => {
  return wrapStreamFn(
    transpilePipes(
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

function prettierPipes(stream) {
  const prettier = require('gulp-prettier');
  const l = logger.child({ tags: [chalk.magentaBright('prettier')] });
  return stream.pipe(simplePipeLogger(l, 'Formatting')).pipe(prettier());
}

function lintPipes(stream, lintOptions) {
  const eslint = require('gulp-eslint');

  const l = logger.child({ tags: [chalk.magenta('eslint')] });
  return (
    stream
      .pipe(simplePipeLogger(l, 'Formatting'))
      .pipe(eslint(lintOptions))
      .pipe(eslint.format())
      // TODO: Need to halt build process/throw error
      .pipe(eslint.failAfterError())
  );
}

function formatPipes(stream) {
  return prettierPipes(lintPipes(stream, { fix: true }));
}

function printFriendlyAbsoluteDir(dir) {
  if (relative(dir, __dirname) === '') {
    return '.';
  }
  return relative(join(__dirname), dir);
}

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
      error: async err => {
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
    packagesDirNames.map(dirName => sourceGlobFromPackagesDirName(dirName)),
    { ignoreInitial: false, events: 'all' },
    gulp.parallel(copy, transpile),
  );
});

gulp.task('default', build);

function formatPrettier() {
  return prettierPipes(codeStream()).pipe(gulp.dest('.'));
}
gulp.task('format:prettier', formatPrettier);

function formatStagedPrettier() {
  return prettierPipes(codeStream().pipe(staged())).pipe(gulp.dest('.'));
}
gulp.task('format-staged:prettier', formatStagedPrettier);

function formatStagedLint() {
  return lintPipes(codeStream().pipe(staged()), { fix: true });
}
formatStagedLint.description =
  'Corrects any automatically fixable linter warnings or errors. Note that this command will ' +
  'overwrite files without creating a backup.';
gulp.task('format-staged:lint', formatStagedLint);

function format() {
  return formatPipes(codeStream()).pipe(gulp.dest('.'));
}
gulp.task('format', format);

function formatStaged() {
  return formatPipes(codeStream().pipe(staged())).pipe(gulp.dest('.'));
}
gulp.task('format-staged', formatStaged);

let withTypeCheckPipes = stream => {
  const typescript = require('typescript');
  const gulpTypescript = require('gulp-typescript');
  const tsProject = gulpTypescript.createProject('tsconfig.json', { typescript });

  withTypeCheckPipes = stream => {
    return stream.pipe(tsProject(gulpTypescript.reporter.defaultReporter()));
  };

  return withTypeCheckPipes(stream);
};

function checkTypes() {
  return withTypeCheckPipes(packagesSrcCodeWithTsDefinitionsStream());
}
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
gulp.task('check-types', checkTypes);

function checkTypesStaged() {
  return withTypeCheckPipes(packagesSrcCodeStream().pipe(staged()));
}
gulp.task('check-types-staged', checkTypesStaged);

const flIgnoreGlob =
  'faultjs/{fault-messages,fault-tester-mocha,fault-addon-mutation-localization,fault-istanbul-util,fault-runner,fault-addon-hook-schema,hook-schema,fault-record-faults,fault-addon-istanbul,fault-types}/**/*';
async function testNoBuild() {
  try {
    const runner = require('@fault/runner');
    const passed = await runner.run({
      tester: '@fault/tester-mocha',
      testMatch: [
        './{faultjs,misc,build-packages,test}/**/*.test.{js,jsx,ts,tsx}',
        '!./**/node_modules/**',
        '!./coverage',
        '!./{faultjs,misc,build-packages}/*/{dist,lib,esm}/**/*',
        '!./faultjs/fault-benchmarker/{disabled-projects,projects}/**',
      ],
      addons: [
        true
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
              onMutation: mutatedFilePaths => {
                return new Promise((resolve, reject) => {
                  let scriptFinish = false;
                  let esmFinish = false;
                  const checkToFinish = () => {
                    if (scriptFinish && esmFinish) {
                      resolve();
                    }
                  };
                  const rejectOnStreamError = stream => stream.on('error', reject);
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
      timeout: 60000,
    });
    if (!passed) {
      process.exit(1);
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

gulp.task('test', testNoBuild);

const precommit = gulp.series(
  gulp.parallel(gulp.series(formatStaged, transpile), copy),
  gulp.parallel(checkTypesStaged, testNoBuild, writeme),
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
  const globby = require('globby');
  const { resolve } = require('path');
  const micromatch = require('micromatch');
  const { access, readFile } = require('mz/fs');

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
    .filter(config => micromatch.isMatch(config.name, names))
    .map(config => {
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
const humanReadableFileSize = size => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2) * 1} ${
    ['B', 'kB', 'MB', 'GB', 'TB'][i]
  }`;
};

const bundleRollup = async () => {
  const rollup = require('rollup');

  const bundle = await rollup.rollup({});
};

const bundleWebpack = async () => {
  const compilers = webpackCompilers();

  const compilersStatsPromises = compilers.map(info => {
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
        asset =>
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
          .map(warning => warning.stack)
          .map(chalk.yellow)
          .join('\n\n'),
      );
    }

    if (stats.hasErrors()) {
      messages.push(
        `${compilation.errors.length} errors:`,
        compilation.errors
          .map(chalk.redBright)
          .map(error => error.stack)
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
    const serverPort = port;
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

const rollupCompilers = () => {
  const minimist = require('minimist');
  const rollup = require('rollup');
  const globby = require('globby');
  const { resolve } = require('path');
  const micromatch = require('micromatch');
  const { access, readFile } = require('mz/fs');

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

  const configs = require('./rollup.config');

  return configs
    .filter(config => micromatch.isMatch(config.input, names))
    .map(config => {
      const mergedConfig = {
        ...config,
      };
      return {
        config: mergedConfig,
        compiler: rollup.rollup(mergedConfig),
      };
    });
};

const moreServes = async () => {
  const express = require('express');

  let port = 2999;
  const rollup = require('rollup');

  const url = require('rollup-plugin-url');

  const babel = require('rollup-plugin-babel');

  const nodeResolvePlugin = require('rollup-plugin-node-resolve');

  const json = require('rollup-plugin-json');

  const openSansUrl = 'https://fonts.googleapis.com/css?family=Open+Sans';

  const tsxExtensions = ['.tsx', '.ts', '.jsx', '.js'];

  const urlPlugin = url({
    limit: 10 * 1024,
    include: ['**/*.svg'],
  });

  const babelPlugin = babel({
    exclude: ['**/node_modules/**'],
    extensions: tsxExtensions,
  });

  const resolvePlugin = nodeResolvePlugin({
    preferBuiltins: false,
    extensions: tsxExtensions,
    browser: true,
  });

  const jsonPlugin = json();

  await Promise.all(
    monorepo.serve.servers.map(async ({ input }) => {
      const l = logger.child({ tags: [chalk.magenta('rollup'), chalk.gray(input)] });
      l.info('Creating bundle...');
      port++;
      const serverPort = port;
      try {
        console.log('q');
        const bundle = await rollup.rollup({
          input,
          plugins: [resolvePlugin, babelPlugin, jsonPlugin],
        });
        console.log('b');
        l.info('Outputting bundle...');
        const outputObj = await bundle.generate({
          format: 'es',
          sourcemap: true,
        });

        const app = express();
        outputObj.output.map(output => {
          app.get(`/${output.fileName}`, (req, res) => {
            res.send(output.code);
          });
        });
        app.get('/index.html', (req, res) => {
          res.send(`
        <!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script type="text/javascript" src="/index.js"></script>
  </body>
</html>

        `);
        });
        app.get('/', res => {
          res.redirect('/index.html');
        });
        await new Promise((resolve, reject) => {
          app.listen(serverPort, err => {
            if (err) {
              reject(err);
            } else {
              l.info(`Serving on port ${chalk.cyan(serverPort.toString())}`);
              resolve();
            }
          });
        });
      } catch (err) {
        l.error(err.stack);
      }
    }),
  );
};
gulp.task('moreserves', moreServes);
