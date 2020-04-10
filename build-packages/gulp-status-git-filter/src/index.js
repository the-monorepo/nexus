module.exports = function gitFileFilter(filterFn, options = {}) {
  const changedFilePaths = require('./file');
  const { relative } = require('path');
  const streamfilter = require('streamfilter');

  const stagedPathsPromise = changedFilePaths(filterFn);

  return streamfilter(
    async (file, enc, cb) => {
      const stagedPaths = await stagedPathsPromise;

      const match = stagedPaths.some(
        (stagedPath) => relative(stagedPath, file.path) === '',
      );

      cb(!match);
    },
    {
      objectMode: true,
      passthrough: options.passthrough,
      restore: options.restore,
    },
  );
};
