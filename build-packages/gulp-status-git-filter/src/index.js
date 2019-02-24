async function stagedAndPartiallyStagedFilePaths(filter) {
  const fs = require('fs');
  const git = require('isomorphic-git');
  const statusMatrix = await git.statusMatrix({ fs, dir: '.' });
  return statusMatrix.filter(filter).map(([filePath]) => filePath);
}

module.exports = function gitFileFilter(filterFn, options = {}) {
  const { relative } = require('path');
  const streamfilter = require('streamfilter');

  const stagedPathsPromise = stagedAndPartiallyStagedFilePaths(filterFn);

  return streamfilter(
    async (file, enc, cb) => {
      const stagedPaths = await stagedPathsPromise;

      const match = stagedPaths.some(
        stagedPath => relative(stagedPath, file.path) === '',
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
