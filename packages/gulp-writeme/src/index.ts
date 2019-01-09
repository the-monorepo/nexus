import { genReadmeFromPackageDir } from '@shawp/writeme';
import { join } from 'path';
import through from 'through2';
export function writeme(missingFileCallback) {
  return through.obj(async (file, enc, callback) => {
    const readmeText = await genReadmeFromPackageDir(file.path, missingFileCallback);
    file.contents = new Buffer(readmeText);
    file.path = join(file.path, 'README.md');
    callback(null, file);
  });
}
export default writeme;
