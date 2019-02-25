const { join } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { HotModuleReplacementPlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackTemplate = require('html-webpack-template');

module.exports = {
  name: 'Resume',
  target: 'web',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.svg'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cwd: join(__dirname, '../..'),
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [{ loader: 'file-loader' }],
      },
    ],
  },
  entry: join(__dirname, 'src/index.tsx'),
  output: {
    filename: '[name].js',
    path: join(__dirname, 'dist'),
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: `Patrick Shaw - Resume`,
      inject: false,
      template: HtmlWebpackTemplate,
      appMountId: 'root',
      links: ['https://fonts.googleapis.com/css?family=Open+Sans'],
      mobile: true,
    }),
    new HotModuleReplacementPlugin(),
    new BundleAnalyzerPlugin({
      openAnalyzer: false,
      analyzerMode: 'static',
      reportFilename: join(__dirname, 'stats.html'),
    }),
    /*new DefinePlugin({
      MODE: '"web"',
    }),*/
  ],
  devServer: {
    port: 3000,
    compress: true,
  },
};
