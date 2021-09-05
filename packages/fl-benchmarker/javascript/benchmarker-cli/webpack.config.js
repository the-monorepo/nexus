const { join } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTemplate = require('html-webpack-template');
const { HotModuleReplacementPlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  name: 'Benchmark',
  target: 'web',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.[jt]sx?$/,
        enforce: 'pre',
        use: [
          {
            loader: 'source-map-loader',
          },
        ],
      },
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
    ],
  },
  entry: join(__dirname, 'src/frontend/index.tsx'),
  output: {
    filename: '[name].js',
    path: join(__dirname, 'dist'),
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: `Fault.js benchmark results`,
      inject: false,
      template: HtmlWebpackTemplate,
      appMountId: 'root',
      headHtmlSnippet: [
        'https://unpkg.com/chart.js@2.8.0/dist/Chart.bundle.js',
        'https://unpkg.com/chartjs-chart-box-and-violin-plot@2/build/Chart.BoxPlot.js',
      ]
        .map((script) => `<script src="${script}" type="text/javascript"></script>`)
        .join(''),
      links: [
        'https://fonts.googleapis.com/css?family=Inter',
        'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.8.0/Chart.min.css',
      ],
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
