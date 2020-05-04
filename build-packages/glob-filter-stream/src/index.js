const { Writeable } = require('stream');

const { isMatch } = require('micromatch');

class GlobFilterStream extends Writeable {
  constructor(globs) {
    super();
    this.globs = globs;
  }

  write(chunk, encoding, callback) {
    if (isMatch(this.globs)) {
      callback(chunk);
    }
  }
}

module.exports.GlobFilterStream = GlobFilterStream;

const createGlobFilterStream = (filter) => {
  return new GlobFilterStream(filter);
};

module.exports = createGlobFilterStream;
