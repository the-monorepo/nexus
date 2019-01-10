const { readFile } = require('mz/fs');
const { join } = require('path');
module.exports = async () => {
  const example = await readFile(join(__dirname, 'examples', 'from-package-directory'));
  const examples = '```js\n' + example + '\n' + '```';
  console.log(examples);
  return {
    isDevPackage: true,
    examples,
  };
};
