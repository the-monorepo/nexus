module.exports = api => {
  const env = api.env();
  const esm = env === 'esm';

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          modules: esm ? false : undefined,
          targets: {
            node: env === 'development' ? 'current' : '6',
            esmodules: esm,
          },
        },
      ],
      '@babel/preset-typescript',
    ],
    overrides: [
      {
        test: ['./packages/my-resume', './packages/resume-template'],
        presets: [
          '@babel/preset-react',
          [
            '@babel/preset-env',
            {
              modules: esm ? false : undefined,
              targets: { esmodules: esm },
            },
          ],
        ],
      },
    ],
  };
};
