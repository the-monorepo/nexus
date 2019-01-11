const { readCodeBlock } = require('@shawp/markdown-util');
const { join } = require('path');
module.exports = async () => {
  const examples = await readCodeBlock(
    join(__dirname, 'examples/file-and-console/index.js'),
  );
  return {
    sections: {
      examples,
    },
  };
};
