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
        test: ['./packages/my-resume', './packages/resume-template', './test.js', './ast.js'],
        plugins: [
          '@babel/plugin-syntax-jsx',
          [
            'babel-plugin-transform-mobx-jsx',
            { pragma: 'dom', pragmaFrag: 'domFragment' },
          ],
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
