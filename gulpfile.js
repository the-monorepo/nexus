/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
require('source-map-support/register');
const { join, sep, relative } = require('path');

const del = require('del');
const chalk = require('chalk');

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const changed = require('gulp-changed');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const prettier = require('gulp-prettier');

const gulpTslint = require('gulp-tslint');
const gulpTypescript = require('gulp-typescript');

const tslint = require('tslint');

const tsProject = gulpTypescript.createProject('tsconfig.json');

const through = require('through2');

const packagesDirName = 'packages';
const packagesDir = join(__dirname, packagesDirName);

function swapSrcWith(srcPath, newDirName) {
  // Should look like /packages/<package-name>/src/<rest-of-the-path>
  srcPath = relative(__dirname, srcPath);
  const parts = srcPath.split(sep);
  // Swap out src for the new dir name
  parts[2] = newDirName;
  return join(__dirname, ...parts);
}

function errorLogger(l) {
  return plumber({
    errorHandler(err) {
      l.error(err);
    },
  });
}

/**
 * @param srcPath An absolute path
 */
function swapSrcWithLib(srcPath) {
  return swapSrcWith(srcPath, 'lib');
}

function packagesGlobFromPackagesDirName(dirName) {
  return `./${dirName}/*`;
}

function packageSubDirGlob(dirName, folderName) {
  return `./${dirName}/*/${folderName}/**/*`;
}

function srcTranspiledGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}.${transpiledExtensions}`;
}

function mockGlob(dirName, folderName) {
  return `${packageSubDirGlob(dirName, folderName)}/__mocks__/*`;
}

const transpiledExtensions = '{js,jsx,ts,tsx,html,css}';

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

function packagesSrcMiscStream() {
  return gulp.src(globSrcMiscFromPackagesDirName(packagesDirName), { base: '.' });
}

function packagesSrcCodeStream() {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirName), { base: '.' });
}

function simplePipeLogger(l, verb) {
  return through.obj(function(file, enc, callback) {
    l.info(`${verb} '${chalk.cyan(file.relative)}'`);
    callback(null, file);
  });
}

function clean() {
  return del(globBuildOutputFromPackagesDirName(packagesDirName));
}
gulp.task('clean', clean);

function copy() {
  const l = logger.tag(chalk.yellow('copy'));
  return packagesSrcMiscStream()
    .pipe(changed('.', { transformPath: swapSrcWithLib }))
    .pipe(simplePipeLogger(l, 'Copying'))
    .pipe(
      rename(filePath => {
        filePath.dirname = join(filePath.dirname, '../lib');
        return filePath;
      }),
    )
    .pipe(gulp.dest('.'));
}

function transpile() {
  const l = logger.tag(chalk.blue('transpile'));
  return packagesSrcCodeStream()
    .pipe(errorLogger(l))
    .pipe(changed('.', { extension: '.js', transformPath: swapSrcWithLib }))
    .pipe(simplePipeLogger(l, 'Transpiling'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(
      rename(filePath => {
        filePath.dirname = join(filePath.dirname, '../lib');
        return filePath;
      }),
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'));
}

function printFriendlyAbsoluteDir(dir) {
  if (relative(dir, __dirname) === '') {
    return '.';
  }
  return relative(join(__dirname), dir);
}

gulp.task('transpile', transpile);

async function writeme() {
  const { writeReadmeFromPackageDir } = require('@pshaw/writeme');
  const l = logger.tag(chalk.green('writeme'));
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

const build = gulp.series(copy, transpile, writeme);
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

function gulpPrettier() {
  return prettier();
}

function formatPrettier() {
  const l = logger.tag(chalk.greenBright('prettier'));
  return packagesSrcCodeStream()
    .pipe(changed('.'))
    .pipe(simplePipeLogger(l, 'Formatting'))
    .pipe(gulpPrettier())
    .pipe(gulp.dest('.'));
}
gulp.task('format:prettier', formatPrettier);

function gulpLint(options) {
  return gulpTslint({
    formatter: 'stylish',
    tslint,
    ...options,
  });
}

function gulpLintReport() {
  return gulpTslint.report({
    summarizeFailureOutput: true,
  });
}

function lintPipes(stream, lintOptions) {
  const tslintProgram = tslint.Linter.createProgram('./tsconfig.json');
  const l = logger.tag(chalk.greenBright('tslint'));
  return stream
    .pipe(simplePipeLogger(l, 'Formatting'))
    .pipe(gulpLint({
        tslintProgram,
        ...lintOptions,
    }))
    .pipe(gulpLintReport());
}

function runLinter(lintOptions) {
  return lintPipes(
    packagesSrcCodeStream()
      .pipe(changed('.')),
    lintOptions
  );
}

function formatLint() {
  return runLinter({ fix: true });
}
formatLint.description =
  'Corrects any automatically fixable linter warnings or errors. Note that this command will ' +
  'overwrite files without creating a backup.';
gulp.task('format:lint', formatLint);

const format = gulp.series(formatLint, formatPrettier);
gulp.task('format', format);

function checkTypes() {
  const stream = packagesSrcCodeStream();
  return stream.pipe(tsProject(gulpTypescript.reporter.fullReporter()));
}
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
gulp.task('checker:types', checkTypes);
