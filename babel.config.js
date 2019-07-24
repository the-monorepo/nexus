module.exports = api => {
  const env = api.env();
  const esm = env === 'esm';
  const test = env === 'test';
  const development = env === 'development';
  const plugins = [];
  if (test) {
    plugins.push('babel-plugin-istanbul', 'rewiremock/babel');
  }
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          modules: esm ? false : undefined,
          targets: {
            node: development || test ? 'current' : '6',
            esmodules: esm,
          },
        },
      ],
      [
        '@babel/preset-typescript',
        {
          jsxPragma: 'mbx',
        },
      ],
    ],
    plugins,
    overrides: [
      {
        test: [
          './packages/my-resume',
          './packages/resume-template',
          './packages/mobx-dom',
          './packages/fault-benchmarker/src/frontend',
        ],
        plugins: plugins.concat([
          '@babel/plugin-syntax-jsx',
          'babel-plugin-transform-mobx-jsx',
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
          '@babel/plugin-transform-strict-mode',
        ]),
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
