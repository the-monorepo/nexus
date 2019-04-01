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
      ['@babel/preset-typescript', {
        jsxPragma: 'mbx'
      }],
    ],
    overrides: [
      {
        test: [
          './packages/my-resume',
          './packages/resume-template',
          './packages/mobx-dom',
        ],
        plugins: [
          '@babel/plugin-syntax-jsx',
          'babel-plugin-transform-mobx-jsx',
        ],
        presets: [
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
