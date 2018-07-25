/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
const colors = require('colors');
const { join, sep, resolve } = require('path');

const gulp = require('gulp');
const babel = require('gulp-babel');
const newer = require('gulp-newer');
const gulpWatch = require('gulp-watch');

const through = require('through2');

const packagesDirName = 'packages';
const distDirName = 'dist';

function swapSrcWithLib(srcPath) {
  const parts = srcPath.split(sep);
  parts[1] = 'lib';
  return parts.join(sep);
}

function rename(fn) {
  return through.obj(function(file, enc, callback) {
    file.path = fn(file);
    callback(null, file);
  });
}

function globFromPackagesDirName(dirName) {
  return `./${dirName}/*/src/**/*.{js,jsx,ts,tsx}`;
}

function compilationLogger(rollup) {
  return through.obj(function(file, enc, callback) {
    console.log(`Compiling '${file.relative.cyan}'`);
    callback(null, file);
  });
}

function buildBabel() {
  const base = join(__dirname, packagesDirName);
  const stream = gulp.src(globFromPackagesDirName(packagesDirName), { base });
  return stream
    .pipe(newer({ dest: base, map: swapSrcWithLib }))
    .pipe(compilationLogger())
    .pipe(babel())
    .pipe(rename(file => resolve(file.base, swapSrcWithLib(file.relative))))
    .pipe(gulp.dest(base));
}

gulp.task('build', () => {
  return buildBabel();
});

gulp.task(
  'watch',
  gulp.series('build', function watch() {
    gulpWatch(
      [globFromPackagesDirName(packagesDirName)],
      { debounceDelay: 200 },
      gulp.task('build'),
    );
  }),
);

gulp.task('default', gulp.series('build'));
