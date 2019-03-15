module.exports = async function stagedAndPartiallyStagedFilePaths(filter) {
  const fs = require('fs');
  const git = require('isomorphic-git');
  const statusMatrix = await git.statusMatrix({ fs, dir: '.' });
  return statusMatrix.filter(filter).map(([filePath]) => filePath);
};
