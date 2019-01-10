module.exports = () => {
  const example = JSON.stringify(
    {
      extends: [require('./package.json').name],
    },
    undefined,
    2,
  );
  const examples = '```json\n' + example + '\n' + '```';
  return {
    isDevPackage: true,
    sections: {
      examples,
    },
  };
};
