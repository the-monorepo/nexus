const { readCodeBlock } = require('@shawp/markdown-util');
const { join } = require('path');

module.exports = async () => {
  const examples = await readCodeBlock(
    join(__dirname, 'examples/logged-read-json/index.js'),
  );
  return {
    sections: {
      examples,
    },
  };
};
