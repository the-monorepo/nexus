const fs = require('fs');
const { Readable } = require('stream');

const git = require('isomorphic-git');

class GitStatusFilterStream extends Readable {
  constructor(filter) {
    super();
    this.filter = filter;
  }

  async read() {
    const statusMatrix = await git.statusMatrix({ fs, dir: '.' });

    statusMatrix.filter(
      this.filter
    ).forEach(([filePath]) => this.push(filePath))
  }
}

module.exports.GitStatusStream = GitStatusFilterStream;

const createGitStatusFilterStream = (filter) => {
  return new GitStatusFilterStream(filter);
};

module.exports = createGitStatusFilterStream;
