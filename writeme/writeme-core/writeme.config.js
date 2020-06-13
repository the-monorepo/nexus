const { join } = require('path');

const { readCodeBlock } = require('@pshaw/markdown-util');
module.exports = async () => {
  const example = await readCodeBlock(
    join(__dirname, 'examples/from-package-directory/index.js'),
  );
  const examples = example;
  return {
    title: 'Writeme Core',
    isDevPackage: true,
    sections: {
      examples,
    },
  };
};
