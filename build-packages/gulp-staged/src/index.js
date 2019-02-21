const fs = require('fs');
const { relative, resolve } = require('path');

const git = require('isomorphic-git');
const streamfilter = require('streamfilter');

git.plugins.set('fs', fs);

async function stagedAndPartiallyStagedFilePaths() {
  const statusMatrix = await git.statusMatrix({ fs, dir: '.' });
  return statusMatrix.filter(status => status[3] >= 2).map(([filePath]) => filePath);
}

module.exports = function stagedFilter(options = {}) {
  const stagedPathsPromise = stagedAndPartiallyStagedFilePaths();

  return streamfilter(
    async (file, enc, cb) => {
      const stagedPaths = await stagedPathsPromise;

      let relPath = relative(file.cwd, file.path);

      // If the path leaves the current working directory, then we need to
      // resolve the absolute path so that the path can be properly matched
      // by minimatch (via multimatch)
      if (/^\.\.[\\/]/.test(relPath)) {
        relPath = resolve(relPath);
      }
      const match = stagedPaths.includes(relPath);

      cb(!match);
    },
    {
      objectMode: true,
      passthrough: options.passthrough,
      restore: options.restore,
    },
  );
};
