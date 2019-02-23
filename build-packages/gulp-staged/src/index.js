const fs = require('fs');
const { relative, resolve, normalize } = require('path');

const git = require('isomorphic-git');
const streamfilter = require('streamfilter');

async function stagedAndPartiallyStagedFilePaths() {
  const statusMatrix = await git.statusMatrix({ fs, dir: '.' });
  return statusMatrix.filter(status => status[3] >= 2).map(([filePath]) => filePath);
}

module.exports = function stagedFilter(options = {}) {
  const stagedPathsPromise = stagedAndPartiallyStagedFilePaths();

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
