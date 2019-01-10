const { readFile } = require('mz/fs');
const { join } = require('path');
module.exports = async () => {
  const example = await readFile(
    join(__dirname, 'examples/from-package-directory/index.js'),
  );
  const examples = '```js\n' + example + '\n' + '```';
  return {
    isDevPackage: true,
    sections: {
      examples,
    },
  };
};
