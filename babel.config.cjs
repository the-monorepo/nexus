const config = require('@monorepo/config');

module.exports = (api) => {
  const usingCommonjs = api.env(['production-commonjs', 'test-commonjs', 'development-commonjs']);
  const production = api.env(['production', 'production-commonjs']);
  const test = api.env(['test', 'test-commonjs']);

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
        modules: usingCommonjs ? 'commonjs' : false,
        targets: {
          node: production ? '10' : 'current',
          esmodules: !usingCommonjs,
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
