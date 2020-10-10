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
        targets: {
          node: production ? '10' : 'current',
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
        test: [].concat(...[
          './packages/patrick-shaw/my-resume',
          './packages/misc/resume-template',
          './packages/misc/page-breaker-chrome',
          './packages/fl-benchmarker/benchmarker-cli/src/frontend',
          './packages/fl-benchmarker/viewer-cli/src/ui',
          './packages/misc/genetic-sequence-analysis-app',
        ].map(projectPath => [`${projectPath}/**/*.tsx`, `${projectPath}/**/*.jsx`])),
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
