/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
require('colors');
require('source-map-support/register');
const { join, sep, relative } = require('path');

const del = require('del');

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const changed = require('gulp-changed');
const plumber = require('gulp-plumber');

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

function rename(fn) {
  return through.obj((file, enc, callback) => {
    file.path = fn(file);
    callback(null, file);
  });
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
    `${packageSubDirGlob(dirName, 'src')}`,
    `!${srcTranspiledGlob(dirName, 'src')}`,
    `!${mockGlob(dirName, 'src')}`,
  ];
}

function globSrcCodeFromPackagesDirName(dirName) {
  return [`${srcTranspiledGlob(dirName, 'src')}`, `!${mockGlob(dirName, 'src')}`];
}

function globBuildOutputFromPackagesDirName(dirName) {
  return [
    `${packageSubDirGlob(dirName, 'lib')}`,
    `${packageSubDirGlob(dirName, 'esm')}`,
    `${packageSubDirGlob(dirName, 'dist')}`,
  ];
}

function sourceGlobFromPackagesDirName(dirName) {
  return join(packagesGlobFromPackagesDirName(dirName), 'src/**/*.{js,jsx,ts,tsx}');
}

const pshawLogger = require('@pshaw/logger');
const logger = pshawLogger.logger().add(pshawLogger.consoleTransport());

function packagesSrcMiscStream() {
  return gulp.src(globSrcMiscFromPackagesDirName(packagesDirName), { base: packagesDir });
}

function packagesSrcCodeStream() {
  return gulp.src(globSrcCodeFromPackagesDirName(packagesDirName), { base: packagesDir });
}

function simplePipeLogger(l, verb) {
  return through.obj(function(file, enc, callback) {
    l.info(`${verb} '${file.relative.cyan}'`);
    callback(null, file);
  });
}

function clean() {
  return del(globBuildOutputFromPackagesDirName(packagesDirName));
}
gulp.task('clean', clean);

function copy() {
  const l = logger.tag('copy'.yellow);
  return packagesSrcMiscStream()
    .pipe(simplePipeLogger(l, 'Copying'))
    .pipe(rename(file => (file.path = swapSrcWithLib(file.path))))
    .pipe(gulp.dest(packagesDir));
}

function transpile() {
  const l = logger.tag('transpile'.blue);
  return packagesSrcCodeStream()
    .pipe(errorLogger(l))
    .pipe(changed(packagesDir, { extension: '.js', transformPath: swapSrcWithLib }))
    .pipe(simplePipeLogger(l, 'Compiling'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(rename(file => (file.path = swapSrcWithLib(file.path))))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(packagesDir));
}

gulp.task('transpile', transpile);

function writeme() {
  const base = join(__dirname, packagesDirName);
  const stream = gulp.src(packagesGlobFromPackagesDirName(packagesDirName), { base });
  const { writeme } = require('@pshaw/gulp-writeme');
  const l = logger.tag('writeme'.green);
  return stream
    .pipe(errorLogger(l))
    .pipe(simplePipeLogger(l, 'Generating readme for'))
    .pipe(writeme(configPath => l.warn(`Missing '${`${configPath}.js`.cyan}'`)))
    .pipe(gulp.dest(base));
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

function runLinter({ fix }) {
  const stream = packagesSrcCodeStream();
  const tslintProgram = tslint.Linter.createProgram('./tsconfig.json');
  return stream
    .pipe(
      gulpTslint({
        program: tslintProgram,
        fix,
        formatter: 'stylish',
        tslint,
      }),
    )
    .pipe(
      gulpTslint.report({
        summarizeFailureOutput: true,
      }),
    );
}
function formatLint() {
  return runLinter({ fix: true });
}
formatLint.description =
  'Corrects any automatically fixable linter warnings or errors. Note that this command will ' +
  'overwrite files without creating a backup.';
gulp.task('format:lint', formatLint);

function checkTypes() {
  const stream = packagesSrcCodeStream();
  return stream.pipe(tsProject(gulpTypescript.reporter.fullReporter()));
}
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
gulp.task('checker:types', checkTypes);
