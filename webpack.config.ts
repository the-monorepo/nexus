import { resolve } from 'path';

import {
  createHtmlWebpackPlugin,
  createBundleAnalyzerPlugin,
  recommendedRules,
  resolvedExtensions,
  createOutput,
  CopyPlugin,
  Configuration,
  distPath,
} from '@pshaw/webpack';

const packagesDir = resolve(__dirname, './packages');
const miscDir = resolve(packagesDir, './misc');
const patrickShawDir = resolve(packagesDir, './patrick-shaw');
const pageBreakerDir = resolve(miscDir, 'page-breaker-chrome');
const resumeDir = resolve(patrickShawDir, 'my-resume');

const createDistOutput = (packageDir: string) => {
  return createOutput(distPath(packageDir));
};

/*const webcomponentsSassModulesRule = {
  test: /\.(sass|scss)$/,
  use: [cssModuleLoader, sassLoader],
};*/

const pageBreakerFrontendConfig: Configuration = {
  name: 'page-breaker',
  target: 'web',
  resolve: {
    extensions: resolvedExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: recommendedRules,
  },
  entry: resolve(pageBreakerDir, 'src/index.tsx'),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Page Breaker`,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: resolve(pageBreakerDir, 'src/manifest.json'),
          to: resolve(pageBreakerDir, 'dist/manifest.json'),
        },
        {
          from: resolve(pageBreakerDir, 'src/icon.png'),
          to: resolve(pageBreakerDir, 'dist/icon.png'),
        },
      ],
    }),
  ],
  devServer: {
    port: 3002,
    compress: true,
  },
};

const resumeConfig: Configuration = {
  name: 'my-resume',
  target: 'web',
  resolve: {
    extensions: resolvedExtensions,
  },
  module: {
    rules: recommendedRules,
  },
  entry: resolve(resumeDir, 'src/index.tsx'),
  output: createDistOutput(resumeDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: 'Patrick Shaw - Resume',
    }),
    createBundleAnalyzerPlugin(resumeDir),
  ],
  devServer: {
    port: 3000,
    compress: true,
  },
};

const geneticSequenceAnalysisAppDir = resolve(miscDir, 'genetic-sequence-analysis-app');
const geneticSequenceAnalysisApp: Configuration = {
  name: 'genetic-sequence-analysis-app',
  target: 'web',
  resolve: {
    extensions: resolvedExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: recommendedRules,
  },
  entry: resolve(geneticSequenceAnalysisAppDir, 'src/index.tsx'),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Genetic Sequence Analysis`,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: resolve(geneticSequenceAnalysisAppDir, 'src/manifest.json'),
          to: resolve(geneticSequenceAnalysisAppDir, 'dist/manifest.json'),
        },
        {
          from: resolve(geneticSequenceAnalysisAppDir, 'src/icon.png'),
          to: resolve(geneticSequenceAnalysisAppDir, 'dist/icon.png'),
        },
      ],
    }),
  ],
  devServer: {
    port: 3003,
    compress: true,
  },
};

const particleSensorAppDir = resolve(patrickShawDir, 'particle-sensor-app');
const particleSensorApp: Configuration = {
  name: 'particle-sensor-app',
  target: 'web',
  resolve: {
    extensions: resolvedExtensions,
  },
  devtool: 'source-map',
  module: {
    rules: recommendedRules,
  },
  entry: resolve(particleSensorAppDir, 'src/index.tsx'),
  output: createDistOutput(particleSensorAppDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Particle Sensor App`,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: resolve(particleSensorAppDir, 'src/manifest.json'),
          to: resolve(particleSensorAppDir, 'dist/manifest.json'),
        },
        {
          from: resolve(particleSensorAppDir, 'src/icon.png'),
          to: resolve(particleSensorAppDir, 'dist/icon.png'),
        },
      ],
    }),
  ],
  devServer: {
    port: 3014,
    compress: true,
  },
};

const configs: Configuration[] = [
  resumeConfig,
  pageBreakerFrontendConfig,
  geneticSequenceAnalysisApp,
  particleSensorApp,
];

export default configs;
