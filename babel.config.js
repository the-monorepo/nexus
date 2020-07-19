const config = require('@monorepo/config');

module.exports = (api) => {
  const env = api.env();
  const esm = env === 'esm';
  const production = env === 'production' || env === 'esm';
  const test = env === 'test';

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
          include: config.buildableSourceFileGlobs,
          exclude: '.yarn/**',
        },
      ],
      'rewiremock/babel',
    );
  }
  const presets = [
    [
      '@babel/preset-env',
      {
        // TODO: Remove this in once Babel 8 is implemented
        bugfixes: true,
        modules: esm ? false : 'commonjs',
        targets: {
          node: production ? '10' : 'current',
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
          './misc/page-breaker-chrome',
          './faultjs/fault-benchmark/src/frontend',
          './faultjs/fault-benchmark-viewer-components',
          './misc/genetic-sequence-analysis-app',
        ],
        plugins: plugins.concat(['@babel/plugin-syntax-jsx', 'cinder/babel']),
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
