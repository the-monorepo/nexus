/**
 * Inspiration for this file taken from https://github.com/babel/babel/blob/master/Gulpfile.js
 */
const colors = require('colors');
const { join, sep, resolve } = require('path');

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const newer = require('gulp-newer');
const gulpWatch = require('gulp-watch');

const through = require('through2');

const { genReadmeFromPackageDir } = require('@by-example/gen-readmes');

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

function simpleFileMessageLogger(verb) {
  return through.obj(function(file, enc, callback) {
    console.log(`${verb} '${file.relative.cyan}'`);
    callback(null, file);
  });
}

function buildBabel() {
  const base = join(__dirname, packagesDirName);
  const stream = gulp.src(sourceGlobFromPackagesDirName(packagesDirName), { base });
  return stream
    .pipe(newer({ dest: base, map: swapSrcWithLib }))
    .pipe(simpleFileMessageLogger('Compiling'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(rename(file => resolve(file.base, swapSrcWithLib(file.relative))))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(base));
}

gulp.task('transpile', buildBabel);

gulp.task('gen-readmes', function genReadmes() {
  const base = join(__dirname, packagesDirName);
  return gulp
    .src(packagesGlobFromPackagesDirName(packagesDirName), { base })
    .pipe(simpleFileMessageLogger('Generating readme for'))
    .pipe(
      through.obj((file, enc, callback) => {
        const readmeText = genReadmeFromPackageDir(file.path, { isDevPackage: false });
        file.contents = new Buffer(readmeText);
        file.path = join(file.path, 'README.md');
        callback(null, file);
      }),
    )
    .pipe(gulp.dest(base));
});

gulp.task('build', gulp.series('transpile', 'gen-readmes'));

gulp.task(
  'watch',
  gulp.series('build', function watch() {
    gulpWatch(
      [sourceGlobFromPackagesDirName(packagesDirName)],
      { debounceDelay: 200 },
      gulp.task('build'),
    );
  }),
);

gulp.task('default', gulp.series('build'));
