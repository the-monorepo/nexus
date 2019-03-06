const { join } = require('path');

const { readCodeBlock } = require('@pshaw/markdown-util');
module.exports = async () => {
  const example = await readCodeBlock(
    join(__dirname, 'examples/from-package-directory/index.js'),
  );
  const examples = example;
  return {
    isDevPackage: true,
    sections: {
      examples,
    },
  };
};
