const { join } = require('path');

const { readCodeBlock } = require('@pshaw/markdown-util');

module.exports = async () => {
  const howTo = await readCodeBlock(
    join(__dirname, 'file-examples/inline-explanations.ts'),
  );
  return {
    sections: {
      howTo,
    },
  };
};
