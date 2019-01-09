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

const logger = () => {
  const pshawLogger = require('@shawp/logger');
  return pshawLogger.logger().add(pshawLogger.consoleTransport());
};

const through = require('through2');

const packagesDirName = 'packages';

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

function sourceGlobFromPackagesDirName(dirName) {
  return join(packagesGlobFromPackagesDirName(dirName), 'src/**/*.{js,jsx,ts,tsx}');
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
