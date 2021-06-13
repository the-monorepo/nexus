import { Duplex } from 'stream';

import { some } from 'micromatch';

class GlobFilterStream extends Duplex {
  constructor(
    public readonly globs,
    public readonly ignoreGlobs,
    public readonly options,
  ) {
    super({
      decodeStrings: false,
      objectMode: true,
    });
  }

  _read() {}

  _write(chunk, encoding, callback) {
    if (
      some(chunk.path, this.globs, this.options) &&
      !some(chunk.path, this.ignoreGlobs, this.options)
    ) {
      this.push(chunk);
      callback();
    } else {
      callback();
    }
  }
}

const createGlobFilterStream = (glob, ignoreGlobs, options?) => {
  return new GlobFilterStream(glob, ignoreGlobs, options);
};

export default createGlobFilterStream;
