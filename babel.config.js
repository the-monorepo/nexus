module.exports = api => {
  const env = api.env();
  const esm = env === 'ESM';

  function baseConfig() {
    return {
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            modules: esm ? false : undefined,
            targets: {
              esmodules: esm,
            },
          },
        ],
      ],
      plugins: ['babel-plugin-istanbul'],
    };
  }

  const config = baseConfig();
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
