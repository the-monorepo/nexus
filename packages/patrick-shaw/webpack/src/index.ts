import { resolve } from 'path';

import fibers from 'fibers';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import sass from 'sass';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import type { Configuration as WebpackConfiguration } from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

import WebpackDevServer from 'webpack-dev-server';

import CopyPlugin from 'copy-webpack-plugin';

import webpack from 'webpack';

import { codeExtensions } from '@pshaw/monorepo-config';

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

export const resolvedExtensions = codeExtensions.map((extension) => `.${extension}`);

export const svgRule = {
  test: /\.svg$/,
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
  use: [
    {
      loader: require.resolve('babel-loader'),
      options: {
        cwd: resolve('.'),
      },
    },
  ],
};

export const tsxExtensions = ['.tsx', '.ts', '.jsx', '.js'];

export const distPath = (packageDir) => resolve(packageDir, 'dist');

export const createDistOutput = (packageDir) => {
  return {
    filename: '[name].js',
    path: distPath(packageDir),
    publicPath: '/',
  };
};

export const defaultLinks = [openSansUrl, materialIconsUrl, normalizeCssUrl];

export const createHtmlWebpackPlugin = ({ title, links = defaultLinks }) => {
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
      localIdentName: '[name]__[local]--[hash:base64:5]',
    },
  },
};

export const sassLoader = {
  loader: require.resolve('sass-loader'),
  options: {
    sourceMap: true,
    implementation: sass,
    sassOptions: {
      fiber: fibers,
    },
  },
};

export const cssRule = {
  test: /\.css$/,
  use: [require.resolve('style-loader'), cssModuleLoader],
};

export const sassModulesRule = {
  test: /\.(sass|scss)$/,
  use: [require.resolve('style-loader'), cssModuleLoader, sassLoader],
};

export const recommendedRules = [svgRule, sassModulesRule, sourceMapRule, babelRule];

/*const webcomponentsSassModulesRule = {
  test: /\.(sass|scss)$/,
  use: [cssModuleLoader, sassLoader],
};*/
