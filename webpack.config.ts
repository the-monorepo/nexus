import { resolve } from "path";

import CopyPlugin from "copy-webpack-plugin";
import type { Configuration as WebpackConfiguration } from "webpack";
import type { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

import {
  createHtmlWebpackPlugin,
  createBundleAnalyzerPlugin,
  recommendedRules,
  codeExtensions,
  createDistOutput,
} from "@pshaw/webpack-config-utils";

type Configuration = WebpackConfiguration & {
  devServer: WebpackDevServerConfiguration;
};

const miscDir = resolve(__dirname, "./misc");
const faultjsDir = resolve(__dirname, "faultjs");
const faultjsBenchmarkDir = resolve(faultjsDir, "fault-benchmark");
const patrickShawDir = resolve(__dirname, "patrick-shaw");

const resumeDir = resolve(patrickShawDir, "my-resume");

/*const webcomponentsSassModulesRule = {
  test: /\.(sass|scss)$/,
  use: [cssModuleLoader, sassLoader],
};*/

const resumeConfig: Configuration = {
  name: "my-resume",
  target: "web",
  resolve: {
    extensions: codeExtensions,
  },
  module: {
    rules: recommendedRules,
  },
  entry: resolve(resumeDir, "src/index.tsx"),
  output: createDistOutput(resumeDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: "Patrick Shaw - Resume",
    }),
    createBundleAnalyzerPlugin(resumeDir),
  ],
  devServer: {
    port: 3000,
    compress: true,
  },
};

const faultjsBenchmarkConfig: Configuration = {
  name: "fault-benchmark",
  target: "web",
  resolve: {
    extensions: codeExtensions,
  },
  devtool: "source-map",
  module: {
    rules: recommendedRules,
  },
  entry: resolve(faultjsBenchmarkDir, "src/frontend/index.tsx"),
  output: createDistOutput(faultjsBenchmarkDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Fault.js benchmark results`,
    }),
  ],
  devServer: {
    port: 3001,
    compress: true,
  },
};

const pageBreakerDir = resolve(miscDir, "page-breaker-chrome");
const pageBreakerFrontendConfig: Configuration = {
  name: "page-breaker",
  target: "web",
  resolve: {
    extensions: codeExtensions,
  },
  devtool: "source-map",
  module: {
    rules: recommendedRules,
  },
  entry: resolve(pageBreakerDir, "src/index.tsx"),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Page Breaker`,
    }),
    new CopyPlugin([
      {
        from: resolve(pageBreakerDir, "src/manifest.json"),
        to: resolve(pageBreakerDir, "dist/manifest.json"),
      },
      {
        from: resolve(pageBreakerDir, "src/icon.png"),
        to: resolve(pageBreakerDir, "dist/icon.png"),
      },
    ]),
  ],
  devServer: {
    port: 3002,
    compress: true,
  },
};

const geneticSequenceAnalysisAppDir = resolve(
  miscDir,
  "genetic-sequence-analysis-app"
);
const geneticSequenceAnalysisApp: Configuration = {
  name: "genetic-sequence-analysis-app",
  target: "web",
  resolve: {
    extensions: codeExtensions,
  },
  devtool: "source-map",
  module: {
    rules: recommendedRules,
  },
  entry: resolve(geneticSequenceAnalysisAppDir, "src/index.tsx"),
  output: createDistOutput(pageBreakerDir),
  plugins: [
    createHtmlWebpackPlugin({
      title: `Genetic Sequence Analysis`,
    }),
    new CopyPlugin([
      {
        from: resolve(geneticSequenceAnalysisAppDir, "src/manifest.json"),
        to: resolve(geneticSequenceAnalysisAppDir, "dist/manifest.json"),
      },
      {
        from: resolve(geneticSequenceAnalysisAppDir, "src/icon.png"),
        to: resolve(geneticSequenceAnalysisAppDir, "dist/icon.png"),
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
