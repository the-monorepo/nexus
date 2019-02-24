/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
require('source-map-support/register');
const { join, sep, relative } = require('path');

const chalk = require('chalk');

const gulp = require('gulp');
const changed = require('gulp-changed');
const staged = require('gulp-staged');
const rename = require('gulp-rename');

const through = require('through2');

const packagesDirName = 'packages';
const buildPackagesDirName = 'build-packages';

function swapSrcWith(srcPath, newDirName) {
  // Should look like /packages/<package-name>/src/<rest-of-the-path>
  srcPath = relative(__dirname, srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[2] = newDirName;
  return join(__dirname, ...parts);
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

const transpiledExtensions = '{js,jsx,ts,tsx,html,css}';

function srcTranspiledGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}.${transpiledExtensions}`;
}

function mockGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}/__mocks__/*`;
}

function globSrcMiscFromPackagesDirName(dirName) {
  return [
    packageSubDirGlob(dirName, 'src'),
    `!${srcTranspiledGlob(dirName, 'src')}`,
    `!${mockGlob(dirName, 'src')}`,
  ];
}

function globSrcCodeFromPackagesDirName(dirName) {
  return [srcTranspiledGlob(dirName, 'src'), `!${mockGlob(dirName, 'src')}`];
}

function globBuildOutputFromPackagesDirName(dirName) {
  return [
    packageSubDirGlob(dirName, 'lib'),
    packageSubDirGlob(dirName, 'esm'),
    packageSubDirGlob(dirName, 'dist'),
  ];
}

function sourceGlobFromPackagesDirName(dirName) {
  return join(packagesGlobFromPackagesDirName(dirName), 'src/**/*.{js,jsx,ts,tsx}');
}

const pshawLogger = require('build-pshaw-logger');
const logger = pshawLogger.logger().add(pshawLogger.consoleTransport());

function packagesSrcMiscStream(options) {
  return gulp.src(globSrcMiscFromPackagesDirName(packagesDirName), {
    base: '.',
    ...options,
  });
}

function packagesSrcCodeStream(options) {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirName), {
    base: '.',
    ...options,
  });
}

function codeStream(options) {
  return gulp.src(
    [
      '**/*.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!coverage/**',
      '!{build-packages,packages}/*/{dist,lib,esm}/**',
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
  await del(globBuildOutputFromPackagesDirName(packagesDirName));
  await del(globBuildOutputFromPackagesDirName(buildPackagesDirName));
  await del(['./README.md', './packages/*/README.md']);
}
gulp.task('clean', clean);

function copyPipes(stream, l, dir) {
  return stream
    .pipe(changed('.', { transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, 'Copying'))
    .pipe(
      rename(filePath => {
        filePath.dirname = join(filePath.dirname, `../${dir}`);
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
}

function copyScript() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.blueBright('script')] });
  return copyPipes(packagesSrcMiscStream(), l, 'lib');
}

function copyEsm() {
  const l = logger.child({ tags: [chalk.yellow('copy'), chalk.cyanBright('esm')] });
  return copyPipes(packagesSrcMiscStream(), l, 'esm');
}

const copy = gulp.parallel(copyScript, copyEsm);

function transpilePipes(stream, babelOptions, l, loggerVerb, dir) {
  const sourcemaps = require('gulp-sourcemaps');
  const babel = require('gulp-babel');

  return stream
    .pipe(changed('.', { extension: '.js', transformPath: createSrcDirSwapper(dir) }))
    .pipe(simplePipeLogger(l, loggerVerb))
    .pipe(sourcemaps.init())
    .pipe(babel(babelOptions))
    .pipe(
      rename(filePath => {
        filePath.dirname = join(filePath.dirname, `../${dir}`);
        return filePath;
      }),
    )
    .pipe(sourcemaps.write('.'));
}

function transpileScript() {
  const l = logger.child({ tags: [chalk.blue('transpile'), chalk.blueBright('script')] });
  return transpilePipes(packagesSrcCodeStream(), undefined, l, 'Transpiling', 'lib').pipe(
    gulp.dest('.'),
  );
}

function transpileEsm() {
  const l = logger.child({ tags: [chalk.blue('transpile'), chalk.cyanBright('esm')] });
  return transpilePipes(
    packagesSrcCodeStream(),
    {
      envName: 'ESM',
    },
    l,
    'Transpiling',
    'esm',
  ).pipe(gulp.dest('.'));
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
  const { writeReadmeFromPackageDir } = require('@pshaw/writeme');
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

function watch() {
  return gulp.watch(
    [sourceGlobFromPackagesDirName(packagesDirName)],
    { ignoreInitial: false },
    build,
  );
}
gulp.task('watch', watch);

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

let checkerTypes = () => {
  const gulpTypescript = require('gulp-typescript');
  const tsProject = gulpTypescript.createProject('tsconfig.json');

  checkerTypes = () => {
    const stream = packagesSrcCodeStream();
    return stream.pipe(tsProject(gulpTypescript.reporter.fullReporter()));
  };
  return checkerTypes();
};
checkerTypes.name = 'checkerTypes';
checkerTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';

gulp.task('checker:types', checkerTypes);

async function testNoBuild() {
  const jest = require('jest-cli/build/cli');
  try {
    const results = await jest.runCLI({ json: false }, [process.cwd()]);
    if (!results.results.success) {
      throw new Error('Tests failed');
    }
  } catch (err) {
    const PluginError = require('plugin-error');
    throw new PluginError('Jest', err);
  }
}
gulp.task('test-no-build', testNoBuild);

const test = gulp.series(transpile, testNoBuild);
gulp.task('test', test);

const precommit = gulp.series(
  gulp.parallel(gulp.series(formatStaged, transpile), copy),
  gulp.parallel(testNoBuild, writeme),
);
gulp.task('precommit', precommit);

const prepublish = gulp.series(
  gulp.parallel(clean, format),
  gulp.parallel(transpile, copy),
  gulp.parallel(testNoBuild, writeme),
);
gulp.task('prepublish', prepublish);
