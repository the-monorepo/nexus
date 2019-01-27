const writeme = require('@shawp/gulp-writeme');
gulp.task('writeme', () => {
  return thythgulp
    .src('.')
    .pipe(writeme)
    .dest('.');
});
