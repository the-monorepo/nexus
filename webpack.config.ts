import { resolve } from 'path';

import CopyPlugin from 'copy-webpack-plugin';
import fibers from 'fibers';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import sass from 'sass';
import type { Configuration as WebpackConfiguration } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

type Configuration = WebpackConfiguration & {
  devServer: WebpackDevServerConfiguration;
};

const openSansUrl = 'https://fonts.googleapis.com/css?family=Open+Sans';
const materialIconsUrl = 'https://fonts.googleapis.com/icon?family=Material+Icons';
const normalizeCssUrl =
  'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css';

const svgRule = {
  test: /\.svg$/,
  use: [
    {
      loader: require.resolve('file-loader'),
    },
  ],
};

const sourceMapRule = {
  test: /\.[jt]sx?$/,
  enforce: 'pre',
  use: [
    {
      loader: require.resolve('source-map-loader'),
    },
  ],
};

const babelRule = {
  test: /\.[jt]sx?$/,
  use: [
    {
      loader: require.resolve('babel-loader'),
      options: {
        cwd: resolve('.'),
      },
    },
  ],
};

const tsxExtensions = ['.tsx', '.ts', '.jsx', '.js'];

const miscDir = resolve(__dirname, './misc');
const faultjsDir = resolve(__dirname, 'faultjs');
const faultjsBenchmarkDir = resolve(faultjsDir, 'fault-benchmark');
const patrickShawDir = resolve(__dirname, 'patrick-shaw');

const resumeDir = resolve(patrickShawDir, 'my-resume');

const distPath = (packageDir) => resolve(packageDir, 'dist');

const createDistOutput = (packageDir) => {
  return {
    filename: '[name].js',
    path: distPath(packageDir),
    publicPath: '/',
  };
};

const defaultHtmlWebpackPlugin = (options) => {
  return new HtmlWebpackPlugin({
    inject: true,
    template: resolve(__dirname, 'template.html'),
    title: options.title,
    tags: {
      headTags: options.links.map((linkHref) =>
        HtmlWebpackPlugin.createHtmlTagObject(
          'link',
          { href: linkHref, rel: 'stylesheet' },
          undefined,
        ),
      ),
    },
  });
};

const defaultBundleAnalyzerPlugin = (packageDir, options?) => {
  return new BundleAnalyzerPlugin({
    openAnalyzer: false,
    analyzerMode: 'static',
    reportFilename: resolve(packageDir, 'stats.html'),
    ...options,
  });
};

const cssModuleLoader = {
  loader: require.resolve('css-loader'),
  options: {
    esModule: true,
    modules: {
      localIdentName: '[name]__[local]--[hash:base64:5]',
    },
  },
};

const sassLoader = {
  loader: require.resolve('sass-loader'),
  options: {
    sourceMap: true,
    implementation: sass,
    sassOptions: {
      fiber: fibers,
    },
  },
};

const cssRule = {
  test: /\.css$/,
  use: [require.resolve('style-loader'), cssModuleLoader],
};

const sassModulesRule = {
  test: /\.(sass|scss)$/,
  use: [require.resolve('style-loader'), cssModuleLoader, sassLoader],
};

const webcomponentsSassModulesRule = {
  test: /\.(sass|scss)$/,
  use: [cssModuleLoader, sassLoader],
};

const resumeConfig: Configuration = {
  name: 'my-resume',
  target: 'web',
  resolve: {
    extensions: tsxExtensions,
  },
  module: {
    rules: [svgRule, sassModulesRule, sourceMapRule, babelRule],
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

const faultjsBenchmarkConfig: Configuration = {
  name: 'fault-benchmark',
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
const pageBreakerFrontendConfig: Configuration = {
  name: 'page-breaker',
  target: 'web',
  resolve: {
    extensions: tsxExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: [svgRule, sassModulesRule, sourceMapRule, babelRule],
  },
  entry: resolve(pageBreakerDir, 'src/index.tsx'),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    defaultHtmlWebpackPlugin({
      title: `Page Breaker`,
      links: [openSansUrl, materialIconsUrl, normalizeCssUrl],
    }),
    new CopyPlugin([
      {
        from: resolve(pageBreakerDir, 'src/manifest.json'),
        to: resolve(pageBreakerDir, 'dist/manifest.json'),
      },
      {
        from: resolve(pageBreakerDir, 'src/icon.png'),
        to: resolve(pageBreakerDir, 'dist/icon.png'),
      },
    ]),
  ],
  devServer: {
    port: 3002,
    compress: true,
  },
};

const configs: Configuration[] = [
  resumeConfig,
  faultjsBenchmarkConfig,
  pageBreakerFrontendConfig,
];

export default configs;
