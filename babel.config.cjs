const config = require('@monorepo/config');

module.exports = (api) => {
  const usingEsm = api.env(['production-esm', 'test-esm', 'development-esm']);
  const production = api.env(['production', 'production-esm']);
  const test = api.env(['test', 'test-esm']);

  const classPropertyPlugin = [
    '@babel/plugin-proposal-class-properties',
    { loose: false },
  ];

  const plugins = [
    classPropertyPlugin,
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
    '@babel/plugin-transform-strict-mode',
  ];
  if (test) {
    plugins.push(
      [
        'babel-plugin-istanbul',
        {
          useInlineSourceMaps: true,
          include: config.buildableSourceFileGlobs,
          exclude: ['.yarn/**', '.pnp.js', '.pnp.cjs'],
        },
      ],
      'rewiremock/babel',
    );
  }
  const presets = [
    [
      '@babel/preset-env',
      {
        shippedProposals: true,
        // TODO: Remove this once Babel 8 is implemented
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
    presets: [...presets, '@babel/preset-typescript'],
    plugins,
    assumptions: {
      constantReexports: true,
      constantSuper: true,
      enumerableModuleMeta: false,
      ignoreFunctionLength: false,
      //ignoreToPrimitiveHint:
      iterableIsArray: false,
      //mutableTemplateObject:
      noClassCalls: true,
      noDocumentAll: true,
      noNewArrows: true,
      objectRestNoSymbols: false,
      //privateFieldsAsProperties:
      pureGetters: false,
      setClassMethods: false,
      setComputedProperties: true,
      setPublicClassFields: false,
      //setSpreadProperties:
      //skipForOfIteratorClosing:
      //superIsCallableConstructor:
    },
    overrides: [
      {
        test: ['./packages/*/javascript/**/*.react.tsx'],
        plugins,
        presets: presets.concat(['@babel/preset-typescript', '@babel/preset-react']),
      },
      {
        test: ['./packages/*/javascript/**/*.tsx'],
        plugins: plugins.concat([
          '@babel/plugin-syntax-jsx',
          require.resolve('@cinderjs/babel-plugin-transform-jsx'),
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
