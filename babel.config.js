module.exports = api => {
  const env = api.env();
  const esm = env === 'ESM';

  function baseConfig(targets) {
    return {
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            modules: esm ? false : undefined,
            targets: {
              ...targets,
              esmodules: esm,
            },
          },
        ],
      ],
      plugins: env === 'test' ? ['babel-plugin-istanbul'] : [],
    };
  }

  const config = baseConfig({ node: env === 'development' ? 'current' : '6' });
  const tsxConfig = baseConfig();
  tsxConfig.plugins.shift('@babel/preset-react');

  return {
    ...config,
    overrides: [
      {
        test: ['./packages/my-resume', './packages/resume-template'],
        ...tsxConfig,
      },
    ],
  };
};
