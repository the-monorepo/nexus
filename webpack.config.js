const { resolve } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackTemplate = require('html-webpack-template');
const CopyPlugin = require('copy-webpack-plugin');

const openSansUrl = 'https://fonts.googleapis.com/css?family=Open+Sans';
const materialIconsUrl = 'https://fonts.googleapis.com/icon?family=Material+Icons';
const normalizeCssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css';

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

const cssModuleLoader = {
  loader: 'css-loader',
  options: {
    modules: {
      localIdentName: '[name]__[local]--[hash:base64:5]'        
    },
  }
};

const cssRule = {
  test: /\.css$/,
  use: ['style-loader', cssModuleLoader],
};

const sassModulesRule = {
  test: /\.(sass|scss)$/,
  use: ['style-loader', cssModuleLoader, {
    loader: 'sass-loader',
    options: {
      sourceMap: true,
      implementation: require('sass'),
      sassOptions: {
        fiber: require('fibers'),
      }
    }
  }]
}


const webcomponentsSassModulesRule = {
  test: /\.(sass|scss)$/,
  use: [
    {
      loader: 'raw-loader'
    },
    {
      loader: 'sass-loader',
      options: {
        sourceMap: true,
        implementation: require('sass'),
        sassOptions: {
          fiber: require('fibers'),
        }
      }
    }
  ]
}

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
const pageBreakerFrontendConfig = {
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
        to: resolve(pageBreakerDir, 'dist/manifest.json')
      },
      {
        from: resolve(pageBreakerDir, 'src/icon.png'),
        to: resolve(pageBreakerDir, 'dist/icon.png')
      }
    ])
  ],
  devServer: {
    port: 3002,
    compress: true,
  },
};

const semanticDocumentsDir = resolve(miscDir, 'semantic-documents');
const semanticDocumentsConfig = {
  name: 'semantic-documents',
  target: 'web',
  resolve: {
    extensions: tsxExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: [svgRule, sassModulesRule, sourceMapRule, babelRule],
  },
  entry: resolve(semanticDocumentsDir, 'src/index.tsx'),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    defaultHtmlWebpackPlugin({
      title: `Semantic Documents`,
      links: [openSansUrl, materialIconsUrl, normalizeCssUrl],
    }),
  ],
  devServer: {
    port: 3003,
    compress: true,
  },
};

module.exports = [resumeConfig, faultjsBenchmarkConfig, pageBreakerFrontendConfig, semanticDocumentsConfig];
