const gitFilter = require('gulp-git-status-filter');

module.exports = function stagedFilter(options = {}) {
  return gitFilter(status => status[3] >= 2, options);
};
