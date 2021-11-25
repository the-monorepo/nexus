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
  devtool: 'eval-source-map',
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
  devtool: 'eval-source-map',
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

const configs: Configuration[] = [
  resumeConfig,
  pageBreakerFrontendConfig,
  geneticSequenceAnalysisApp,
];

export default configs;
