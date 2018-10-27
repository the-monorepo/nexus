module.exports = api => {
  const env = api.env();
  const esm = env === 'ESM';
  return {
    sourceMaps: true,
    plugins: ['babel-plugin-istanbul'],
    presets: [
      [
        '@babel/preset-env',
        {
          modules: esm ? false : undefined,
          targets: {
            node: '6',
            esmodules: esm,
          },
        },
      ],
      '@babel/preset-typescript',
    ],
  };
};
