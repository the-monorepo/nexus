module.exports = function stagedFilter(options = {}) {
  const gitFilter = require('gulp-status-git-filter');

  return gitFilter(status => status[3] >= 2, options);
};
