module.exports = api => {
  const env = api.env();
  const esm = env === 'esm';
  const test = env === 'test';
  const development = env === 'development';
  const plugins = ['@babel/plugin-proposal-optional-chaining'];
  if (test) {
    plugins.push(
      [
        'babel-plugin-istanbul',
        {
          useInlineSourceMaps: true,
          exclude: [
            '**/*.test.{js,jsx,ts,tsx}',
            './{faultjs,misc}/*/test/**',
            './test/**',
            '**/{lib,esm,dist}/**',
          ],
        },
      ],
      'rewiremock/babel',
    );
  }
  const classPropertyPlugin = [
    '@babel/plugin-proposal-class-properties',
    { loose: true },
  ];
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
    plugins: plugins.concat([classPropertyPlugin]),
    overrides: [
      {
        test: [
          './misc/my-resume',
          './misc/resume-template',
          './misc/mobx-dom',
          './misc/page-breaker-chrome',
          './faultjs/fault-benchmarker/src/frontend',
        ],
        plugins: plugins.concat([
          '@babel/plugin-syntax-jsx',
          'babel-plugin-transform-mobx-jsx',
          ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
          classPropertyPlugin,
          '@babel/plugin-transform-strict-mode',
        ]),
        presets: [
          [
            '@babel/preset-env',
            {
              modules: esm ? false : undefined,
              targets: {
                esmodules: esm,
                browsers: ['last 1 Chrome versions'],
              },
            },
          ],
        ],
      },
    ],
  };
};
