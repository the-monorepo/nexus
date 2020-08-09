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

export const openSansUrl = 'https://fonts.googleapis.com/css?family=Open+Sans';
export const materialIconsUrl = 'https://fonts.googleapis.com/icon?family=Material+Icons';
export const normalizeCssUrl =
  'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css';

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

export const createDistOutput = (packageDir) => {
  return {
    filename: '[name].js',
    path: distPath(packageDir),
    publicPath: '/',
  };
};

export const createHtmlWebpackPlugin = (options) => {
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

const geneticSequenceAnalysisAppDir = resolve(miscDir, 'genetic-sequence-analysis-app');
const geneticSequenceAnalysisApp: Configuration = {
  name: 'genetic-sequence-analysis-app',
  target: 'web',
  resolve: {
    extensions: tsxExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: [svgRule, sassModulesRule, sourceMapRule, babelRule],
  },
  entry: resolve(geneticSequenceAnalysisAppDir, 'src/index.tsx'),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    defaultHtmlWebpackPlugin({
      title: `Genetic Sequence Analysis`,
      links: [openSansUrl, materialIconsUrl, normalizeCssUrl],
    }),
    new CopyPlugin([
      {
        from: resolve(geneticSequenceAnalysisAppDir, 'src/manifest.json'),
        to: resolve(geneticSequenceAnalysisAppDir, 'dist/manifest.json'),
      },
      {
        from: resolve(geneticSequenceAnalysisAppDir, 'src/icon.png'),
        to: resolve(geneticSequenceAnalysisAppDir, 'dist/icon.png'),
      },
    ]),
  ],
  devServer: {
    port: 3003,
    compress: true,
  },
};

const configs: Configuration[] = [
  resumeConfig,
  faultjsBenchmarkConfig,
  pageBreakerFrontendConfig,
  geneticSequenceAnalysisApp,
];

export default configs;
