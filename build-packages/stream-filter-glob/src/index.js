const { Duplex } = require('stream');

const { some } = require('micromatch');

class GlobFilterStream extends Duplex {
  constructor(globs, ignoreGlobs, options) {
    super({
      decodeStrings: false,
      objectMode: true,
    });
    this.globs = globs;
    this.ignoreGlobs = ignoreGlobs;
    this.options = options;
  }

  _read() {
    
  }

  _write(chunk, encoding, callback) {
    if (some(chunk.path, this.globs, this.options) && !some(chunk.path, this.ignoreGlobs, this.options)) {
      this.push(chunk);
      callback();
    } else {
      callback();
    }
  }
}

const createGlobFilterStream = (glob, ignoreGlobs, options) => {
  return new GlobFilterStream(glob, ignoreGlobs, options);
};

module.exports = createGlobFilterStream;
