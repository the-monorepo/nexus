const { join } = require('path');
module.exports = config => {
  config.resolve.extensions.push('.ts', '.tsx');
  config.module.rules = [
    {
      test: /[tj]sx?$/,
      loader: 'babel-loader',
      options: {
        cwd: join(__dirname, '../../..'),
      },
      exclude: /node_modules/,
    },
  ];
  return config;
};
