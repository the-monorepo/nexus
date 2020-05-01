module.exports = (api) => {
  const env = api.env();
  const esm = env === 'esm';
  const test = env === 'test';
  const development = env === 'development';

  const classPropertyPlugin = [
    '@babel/plugin-proposal-class-properties',
    { loose: true },
  ];

  const plugins = [
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
    classPropertyPlugin,
    '@babel/plugin-transform-strict-mode',
  ];
  if (test) {
    plugins.push(
      [
        'babel-plugin-istanbul',
        {
          useInlineSourceMaps: true,
          exclude: [
            '**/*.test.{js,jsx,ts,tsx}',
            './{faultjs,misc,patrick-shaw,semantic-documents,cinder}/*/test/**',
            './test/**',
            '**/{lib,esm,dist}/**',
          ],
        },
      ],
      'rewiremock/babel',
    );
  }
  const presets = [
    [
      '@babel/preset-env',
      {
        modules: esm ? false : undefined,
        targets: {
          node: development || test ? 'current' : '10',
          esmodules: esm,
        },
      },
    ],
  ];
  return {
    presets: presets.concat(['@babel/preset-typescript']),
    plugins,
    overrides: [
      {
        test: [
          './patrick-shaw/my-resume',
          './misc/resume-template',
          './cinder/cinder',
          './misc/page-breaker-chrome',
          './faultjs/fault-benchmarker/src/frontend',
        ],
        plugins: plugins.concat([
          '@babel/plugin-syntax-jsx',
          'babel-plugin-transform-cinder-jsx',
        ]),
        presets: [
          [
            '@babel/preset-typescript',
            {
              jsxPragma: 'cinder',
            },
          ],
        ],
      },
    ],
  };
};
