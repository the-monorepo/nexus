const createGitStatusFilterStream = require('git-status-filter-stream');

const createGitStagedStream = () => createGitStatusFilterStream((status) => status[3] >= 2);

module.exports = createGitStagedStream;
