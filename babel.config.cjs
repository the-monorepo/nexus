const config = require('@monorepo/config');

module.exports = (api) => {
  const usingEsm = api.env(['production-esm', 'test-esm', 'development-esm']);
  const production = api.env(['production', 'production-esm']);
  const test = api.env(['test', 'test-esm']);

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
        modules: usingEsm ? false : 'commonjs',
        // useBuiltIns: 'usage',
        // corejs: '3',
        targets: {
          node: production ? '12' : 'current',
          esmodules: usingEsm,
        },
      },
    ],
  ];
  return {
    presets: presets.concat(['@babel/preset-typescript']),
    plugins,
    overrides: [
      {
        test: ['./packages/**/*.react.tsx'],
        plugins,
        presets: presets.concat(['@babel/preset-typescript', '@babel/preset-react']),
      },
      {
        test: ['./packages/**/*.tsx'],
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
