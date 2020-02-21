const { resolve } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackTemplate = require('html-webpack-template');

const openSansUrl = 'https://fonts.googleapis.com/css?family=Open+Sans';

const svgRule = {
  test: /\.svg$/,
  use: [
    {
      loader: 'file-loader',
    },
  ],
};

const sourceMapRule = {
  test: /\.[jt]sx?$/,
  enforce: 'pre',
  use: [
    {
      loader: 'source-map-loader',
    },
  ],
};

const babelRule = {
  test: /\.[jt]sx?$/,
  use: [
    {
      loader: 'babel-loader',
      options: {
        cwd: resolve('.'),
      },
    },
  ],
};

const tsxExtensions = ['.tsx', '.ts', '.jsx', '.js'];

const tsExtensions = ['.ts', '.js'];

const jsxExtensions = ['.js', '.jsx'];

const miscDir = resolve(__dirname, './misc');
const faultjsDir = resolve(__dirname, 'faultjs');
const faultjsBenchmarkDir = resolve(faultjsDir, 'fault-benchmarker');

const resumeDir = resolve(miscDir, 'my-resume');

const distPath = (packageDir) => resolve(packageDir, 'dist');

const createDistOutput = packageDir => {
  return {
    filename: '[name].js',
    path: distPath(packageDir),
    publicPath: '/',
  };
};

const defaultHtmlWebpackPlugin = options => {
  return new HtmlWebpackPlugin({
    inject: false,
    template: HtmlWebpackTemplate,
    appMountId: 'root',
    mobile: true,
    ...options,
  });
};

const defaultBundleAnalyzerPlugin = (packageDir, options) => {
  return new BundleAnalyzerPlugin({
    openAnalyzer: false,
    analyzerMode: 'static',
    reportFilename: resolve(packageDir, 'stats.html'),
    ...options,
  });
};

const resumeConfig = {
  name: 'Resume',
  target: 'web',
  resolve: {
    extensions: tsxExtensions,
  },
  module: {
    rules: [svgRule, sourceMapRule, babelRule],
  },
  entry: resolve(resumeDir, 'src/index.tsx'),
  output: createDistOutput(resumeDir),
  plugins: [
    defaultHtmlWebpackPlugin({
      title: 'Patrick Shaw - Resume',
      links: [openSansUrl],
    }),
    defaultBundleAnalyzerPlugin(resumeDir),
  ],
  devServer: {
    port: 3000,
    compress: true,
  },
};

const cssRule = {
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
};

const faultjsBenchmarkConfig = {
  name: 'fault-benchmarker',
  target: 'web',
  resolve: {
    extensions: tsxExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: [svgRule, cssRule, sourceMapRule, babelRule],
  },
  entry: resolve(faultjsBenchmarkDir, 'src/frontend/index.tsx'),
  output: createDistOutput(faultjsBenchmarkDir),
  plugins: [
    defaultHtmlWebpackPlugin({
      title: `Fault.js benchmark results`,
      links: [openSansUrl],
    }),
  ],
  devServer: {
    port: 3001,
    compress: true,
  },
};

const pageBreakerDir = resolve(miscDir, 'page-breaker-chrome');
const pageBreakerConfig = {
  name: 'page-breaker',
  target: 'web',
  resolve: {
    extensions: tsxExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: [svgRule, cssRule, sourceMapRule, babelRule],
  },
  entry: resolve(pageBreakerDir, 'src/index.tsx'),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    defaultHtmlWebpackPlugin({
      title: `Page Breaker`,
      links: [openSansUrl],
    }),
  ],
  devServer: {
    port: 3002,
    compress: true,
  },
};

module.exports = [resumeConfig, faultjsBenchmarkConfig, pageBreakerConfig];
