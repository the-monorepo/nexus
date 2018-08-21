module.exports = (defaultConfig, env, baseConfig) => {
  defaultConfig.resolve.extensions.push('.ts', '.tsx');
  let babelIndex = null;
  for (let r = 0; r < defaultConfig.module.rules.length; r++) {
    const rule = defaultConfig.module.rules[r];
    if (typeof rule.loader === 'string' && rule.loader.includes('babel-loader')) {
      babelIndex = r;
      break;
    }
  }
  defaultConfig.module.rules[babelIndex] = {
    test: /\.(t|j)sx?$/,
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['last 2 versions'],
            },
          },
        ],
      ],
      plugins: ['babel-plugin-istanbul'],
    },
  };
  console.log(defaultConfig.module.rules);
  console.log(defaultConfig);
  return defaultConfig;
};
