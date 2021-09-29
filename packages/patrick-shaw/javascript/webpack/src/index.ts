import { resolve } from 'path';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import sass from 'sass';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import type { Configuration as WebpackConfiguration } from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

import WebpackDevServer from 'webpack-dev-server';

import CopyPlugin from 'copy-webpack-plugin';

import webpack from 'webpack';

export { BundleAnalyzerPlugin };

export { WebpackDevServer };

export { CopyPlugin };

export { webpack };

export type Configuration = WebpackConfiguration & {
  devServer: WebpackDevServerConfiguration;
};

export const openSansUrl = 'https://fonts.googleapis.com/css?family=Open+Sans';
export const materialIconsUrl = 'https://fonts.googleapis.com/icon?family=Material+Icons';
export const normalizeCssUrl =
  'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css';

export const svgRule = {
  test: /\.svg$/,
  exclude: /node_modules/,
  use: [
    {
      loader: require.resolve('file-loader'),
    },
  ],
};

export const sourceMapRule = {
  test: /\.[jt]sx?$/,
  enforce: 'pre',
  use: [
    {
      loader: require.resolve('source-map-loader'),
    },
  ],
};

export const babelRule = {
  test: /\.[jt]sx?$/,
  exclude: /node_modules/,
  use: [
    {
      loader: require.resolve('babel-loader'),
      options: {
        cwd: resolve('.'),
      },
    },
  ],
};

export const distPath = (packageDir) => resolve(packageDir, 'dist');

export const createOutput = (outputDir) => {
  return {
    filename: '[name].js',
    path: outputDir,
    publicPath: '/',
    scriptType: 'module',
  };
};

export const defaultLinks = [openSansUrl, materialIconsUrl, normalizeCssUrl];

export const createHtmlWebpackPlugin = ({
  title = 'TODO: Title',
  links = defaultLinks,
} = {}) => {
  return new HtmlWebpackPlugin({
    inject: true,
    template: resolve(__dirname, 'template.html'),
    title: title,
    tags: {
      headTags: links.map((linkHref) =>
        HtmlWebpackPlugin.createHtmlTagObject(
          'link',
          { href: linkHref, rel: 'stylesheet' },
          undefined,
        ),
      ),
    },
  });
};

export const createBundleAnalyzerPlugin = (packageDir, options?) => {
  return new BundleAnalyzerPlugin({
    openAnalyzer: false,
    analyzerMode: 'static',
    reportFilename: resolve(packageDir, 'stats.html'),
    ...options,
  });
};

export const cssModuleLoader = {
  loader: require.resolve('css-loader'),
  options: {
    esModule: true,
    modules: {
      localIdentName: '[name].[ext]__[local]--[hash:base64:5]',
    },
  },
};

export const sassLoader = {
  loader: require.resolve('sass-loader'),
  options: {
    sourceMap: true,
    implementation: sass,
  },
};

export const cssRule = {
  test: /\.css$/,
  exclude: /node_modules/,
  use: [require.resolve('style-loader'), cssModuleLoader],
};

export const inlineJsonRule = {
  test: /\.json$/,
  exclude: /node_modules/,
  use: [require.resolve('json-loader')],
};

export const fileJsonRule = {
  test: /\.json$/,
  exclude: /node_modules/,
  use: [require.resolve('file-loader')],
};

export const sassModulesRule = {
  test: /\.(sass|scss)$/,
  exclude: /node_modules/,
  use: [require.resolve('style-loader'), cssModuleLoader, sassLoader],
};

export const recommendedRules = [
  svgRule,
  sassModulesRule,
  cssRule,
  fileJsonRule,
  sourceMapRule,
  babelRule,
];

export const webcomponentsSassModulesRule = {
  test: /\.(sass|scss)$/,
  exclude: /node_modules/,
  use: [cssModuleLoader, sassLoader],
};

export const recommendedWebcomponentRules = [
  webcomponentsSassModulesRule,
  ...recommendedRules.filter((rule) => rule !== sassModulesRule),
];
