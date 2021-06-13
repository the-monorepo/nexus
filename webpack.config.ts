import { join, resolve } from 'path';

import {
  createHtmlWebpackPlugin,
  createBundleAnalyzerPlugin,
  recommendedRules,
  recommendedWebcomponentRules,
  createOutput,
  CopyPlugin,
  Configuration,
  distPath,
} from '@pshaw/webpack';

const projectResolve = (projectDirPath, packageDir) =>
  join(projectDirPath, 'javascript', packageDir);

const packagesDir = resolve(__dirname, './packages');
const miscDir = resolve(packagesDir, './misc');
const patrickShawDir = resolve(packagesDir, './patrick-shaw');
const pageBreakerDir = projectResolve(miscDir, 'page-breaker-chrome');
const resumeDir = projectResolve(patrickShawDir, 'my-resume');

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

const geneticSequenceAnalysisAppDir = projectResolve(
  miscDir,
  'genetic-sequence-analysis-app',
);
const geneticSequenceAnalysisApp: Configuration = {
  name: 'genetic-sequence-analysis-app',
  target: 'web',
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

const particleSensorAppDir = projectResolve(patrickShawDir, 'particle-sensor-app');
const particleSensorApp: Configuration = {
  name: 'particle-sensor-app',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: recommendedWebcomponentRules,
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

const spotWelderSensorAppDir = projectResolve(patrickShawDir, 'spot-welder-app');
const spotWelderApp: Configuration = {
  name: 'spot-welder-app',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: recommendedWebcomponentRules,
  },
  entry: resolve(spotWelderSensorAppDir, 'src/index.tsx'),
  output: createDistOutput(spotWelderSensorAppDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Particle Sensor App`,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: resolve(spotWelderSensorAppDir, 'src/manifest.json'),
          to: resolve(spotWelderSensorAppDir, 'dist/manifest.json'),
        },
        {
          from: resolve(spotWelderSensorAppDir, 'src/icon.png'),
          to: resolve(spotWelderSensorAppDir, 'dist/icon.png'),
        },
      ],
    }),
  ],
  devServer: {
    port: 3015,
    compress: true,
  },
};

const configs: Configuration[] = [
  resumeConfig,
  pageBreakerFrontendConfig,
  geneticSequenceAnalysisApp,
  particleSensorApp,
  spotWelderApp,
];

export default configs;
