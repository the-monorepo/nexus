module.exports = api => {
  const env = api.env();
  const esm = env === 'ES6';
  return {
    sourceMaps: true,
    presets: [
      [
        '@babel/preset-env',
        {
          modules: esm ? false : undefined,
          targets: {
            esmodules: esm,
          },
        },
      ],
      '@babel/preset-typescript',
    ],
  };
};
