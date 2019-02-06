const writeme = require('@pshaw/gulp-writeme');
gulp.task('writeme', () => {
  return thythgulp
    .src('.')
    .pipe(writeme)
    .dest('.');
});
