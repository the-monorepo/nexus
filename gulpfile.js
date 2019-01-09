/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
require('colors');
require('source-map-support/register');
const { join, sep, resolve } = require('path');

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const newer = require('gulp-newer');

const gulpTslint = require('gulp-tslint');
const gulpTypescript = require('gulp-typescript');

const tslint = require('tslint');

const tsProject = gulpTypescript.createProject('tsconfig.json');

const through = require('through2');

const packagesDirName = 'packages';
const packagesDir = join(__dirname, packagesDirName);

function swapSrcWithLib(srcPath) {
  const parts = srcPath.split(sep);
  parts[1] = 'lib';
  return parts.join(sep);
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

function globFolderFromPackagesDirName(dirName, folderName) {
  return [
    `./${dirName}/*/${folderName}/**/*.{js,jsx,ts,tsx,html,css}`,
    `!./${dirName}/*/${folderName}/**/__mocks__/*.{js,ts,tsx,jsx,html,css}`,
  ];
}

function globSrcFromPackagesDirName(dirName) {
  return globFolderFromPackagesDirName(dirName, 'src');
}

function sourceGlobFromPackagesDirName(dirName) {
  return join(packagesGlobFromPackagesDirName(dirName), 'src/**/*.{js,jsx,ts,tsx}');
}

const logger = () => {
  const pshawLogger = require('@shawp/logger');
  return pshawLogger.logger().add(pshawLogger.consoleTransport());
};

function packagesSrcStream() {
  return gulp.src(globSrcFromPackagesDirName(packagesDirName), { base: packagesDir });
}

function simplePipeLogger(tag, verb) {
  return through.obj(function(file, enc, callback) {
    logger()
      .tag(tag)
      .info(`${verb} '${file.relative.cyan}'`);
    callback(null, file);
  });
}

function transpile() {
  const base = join(__dirname, packagesDirName);
  const stream = gulp.src(sourceGlobFromPackagesDirName(packagesDirName), { base });
  return stream
    .pipe(newer({ dest: base, map: swapSrcWithLib }))
    .pipe(simplePipeLogger('transpile'.blue, 'Compiling'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(rename(file => resolve(file.base, swapSrcWithLib(file.relative))))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(base));
}

gulp.task('transpile', transpile);

function writeme() {
  const base = join(__dirname, packagesDirName);
  const { writeme } = require('@shawp/gulp-writeme');
  const l = logger().tag('writeme'.green);
  return gulp
    .src(packagesGlobFromPackagesDirName(packagesDirName), { base })
    .pipe(simplePipeLogger('writeme'.green, 'Generating readme for'))
    .pipe(writeme(configPath => l.warn(`Missing '${`${configPath}.js`.cyan}'`)))
    .pipe(gulp.dest(base));
}
gulp.task('writeme', writeme);

const build = gulp.series(transpile, writeme);
gulp.task('build', build);

function watch() {
  return gulp.watch(
    [sourceGlobFromPackagesDirName(packagesDirName)],
    { ignoreInitial: false },
    build,
  );
}
gulp.task('watch', watch);

function clean() {}
gulp.task('clean', clean);

gulp.task('default', build);

function runLinter({ fix }) {
  const stream = packagesSrcStream();
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
  const stream = packagesSrcStream();
  return stream.pipe(tsProject(gulpTypescript.reporter.fullReporter()));
}
checkTypes.description =
  'Runs the TypeScript type checker on the codebase, displaying the output. This will display any ' +
  'serious errors in the code, such as invalid syntax or the use of incorrect types.';
gulp.task('checker:types', checkTypes);
