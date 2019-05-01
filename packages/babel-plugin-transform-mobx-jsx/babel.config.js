module.exports = {
  plugins: [
    '@babel/plugin-syntax-jsx',
    'babel-plugin-transform-mobx-jsx',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-transform-strict-mode',
  ],
};
