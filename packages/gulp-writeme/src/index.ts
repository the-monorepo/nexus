import ogWriteme from '@pshaw/writeme';
import { join } from 'path';
import through from 'through2';
import PluginError from 'plugin-error';
export function writeme(missingFileCallback) {
  return through.obj(async (file, enc, callback) => {
    try {
      const readmeText = await ogWriteme(file.path, missingFileCallback);
      file.contents = new Buffer(readmeText, enc);
      file.path = join(file.path, 'README.md');
    } catch (err) {
      callback(new PluginError('writeme', err, { showStack: true }));
      return;
    }
    callback(null, file);
  });
}
export default writeme;
