const { readFile } = require('mz/fs');
const { join } = require('path');
module.exports = async () => {
  let examples =
    '```js\n' +
    (await readFile(join(__dirname, 'examples', 'from-package-directory'))) +
    '\n' +
    '```';
  return {
    isDevPackage: true,
    examples,
  };
};
